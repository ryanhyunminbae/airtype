import fs from "node:fs/promises";
import path from "node:path";
import * as tf from "@tensorflow/tfjs-node";
import {
  buildModelFeatures,
  MODEL_FEATURE_LENGTH,
  type LandmarkLike,
} from "@/lib/featureExtractor";

type Sample = {
  label: string;
  landmarks: LandmarkLike[];
};

type DatasetFile = {
  samples: Sample[];
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DATASET_PATH = path.resolve("data/asl_landmarks.json");
const OUTPUT_DIR = path.resolve("public/models/asl-letter-model");

const readDataset = async (): Promise<Sample[]> => {
  try {
    const raw = await fs.readFile(DATASET_PATH, "utf-8");
    const parsed = JSON.parse(raw) as DatasetFile;
    if (!Array.isArray(parsed.samples)) {
      throw new Error("Dataset file must include a `samples` array.");
    }
    return parsed.samples;
  } catch (error) {
    throw new Error(
      `Unable to read dataset at ${DATASET_PATH}. Did you export samples from the recorder?\n${error}`,
    );
  }
};

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const encodeLabel = (label: string): number => {
  const index = LETTERS.indexOf(label.toUpperCase());
  if (index === -1) {
    throw new Error(`Unsupported label "${label}". Expected A-Z.`);
  }
  return index;
};

const buildModel = () => {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      units: 256,
      activation: "relu",
      inputShape: [MODEL_FEATURE_LENGTH],
    }),
  );
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: 128, activation: "relu" }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 64, activation: "relu" }));
  model.add(tf.layers.dense({ units: LETTERS.length, activation: "softmax" }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return model;
};

const samplesToTensors = (samples: Sample[]) => {
  const xs = samples.map((sample) => buildModelFeatures(sample.landmarks));
  const ys = samples.map((sample) => encodeLabel(sample.label));

  const xsTensor = tf.tensor2d(xs, [xs.length, MODEL_FEATURE_LENGTH]);
  const ysTensor = tf.oneHot(tf.tensor1d(ys, "int32"), LETTERS.length);

  return { xsTensor, ysTensor };
};

const main = async () => {
  const samples = await readDataset();
  if (samples.length < LETTERS.length * 5) {
    console.warn(
      `Dataset only contains ${samples.length} samples. Accuracy may suffer. Aim for at least ~100 samples per letter.`,
    );
  }

  const shuffled = shuffle(samples);
  const splitIndex = Math.floor(shuffled.length * 0.85);
  const trainSamples = shuffled.slice(0, splitIndex);
  const valSamples = shuffled.slice(splitIndex);

  const { xsTensor: trainXs, ysTensor: trainYs } = samplesToTensors(
    trainSamples,
  );
  const { xsTensor: valXs, ysTensor: valYs } = samplesToTensors(valSamples);

  const model = buildModel();
  await model.fit(trainXs, trainYs, {
    epochs: 80,
    batchSize: 64,
    validationData: [valXs, valYs],
    callbacks: tf.node.tensorBoard("logs/asl-training"),
  });

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await model.save(`file://${OUTPUT_DIR}`);
  console.log(
    `✅ Saved ASL classifier to ${OUTPUT_DIR}. Copy the folder to public/ if you trained elsewhere.`,
  );

  trainXs.dispose();
  trainYs.dispose();
  valXs.dispose();
  valYs.dispose();
};

main().catch((error) => {
  console.error("Training failed:", error);
  process.exit(1);
});

