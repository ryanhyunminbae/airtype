import * as tf from "@tensorflow/tfjs";
import type { Landmark } from "./handDetection";
import {
  buildModelFeatures,
  computeHeuristicFeatures,
  MODEL_FEATURE_LENGTH,
} from "./featureExtractor";

export type GestureSource = "prototype" | "asl-model";

export type GesturePrediction = {
  letter: string | null;
  confidence: number;
  vector: number[];
  source: GestureSource;
};

const PROTOTYPE_FEATURES = {
  A: [0.08, 0.12, 0.1, 0.03, 0.004], // Closed fist
  B: [0.32, 0.4, 0.35, 0.14, 0.02], // Open palm
  C: [0.22, 0.24, 0.3, 0.2, 0.01], // Curved "C" shape
} as const satisfies Record<string, number[]>;

const PROTOTYPE_LETTERS = Object.keys(PROTOTYPE_FEATURES);

const ASL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MODEL_URL = "/models/asl-letter-model/model.json";

let prototypeTensor: tf.Tensor2D | null = null;
let model: tf.LayersModel | null = null;
let modelLoadingPromise: Promise<tf.LayersModel | null> | null = null;
let modelLoadAttempted = false;

const ensurePrototypeTensor = () => {
  if (prototypeTensor) {
    return prototypeTensor;
  }

  const data = Object.values(PROTOTYPE_FEATURES);
  prototypeTensor = tf.tensor2d(data, [data.length, data[0].length]);
  return prototypeTensor;
};

const fetchAslModel = async (): Promise<tf.LayersModel | null> => {
  if (model) {
    return model;
  }

  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }

  if (modelLoadAttempted) {
    return null;
  }

  modelLoadAttempted = true;
  modelLoadingPromise = tf
    .loadLayersModel(MODEL_URL)
    .then((loaded) => {
      model = loaded;
      return loaded;
    })
    .catch((error) => {
      console.warn(
        "[gestureClassifier] Unable to load ASL model, falling back to prototypes.",
        error,
      );
      model = null;
      return null;
    })
    .finally(() => {
      modelLoadingPromise = null;
    });

  return modelLoadingPromise;
};

export const ensureAslModel = () => {
  void fetchAslModel();
};

export const classifyGesture = (
  landmarks: Landmark[] | null,
): GesturePrediction | null => {
  if (!landmarks || landmarks.length < 21) {
    return null;
  }

  if (model) {
    return classifyWithModel(landmarks);
  }

  void fetchAslModel(); // trigger lazy load
  return classifyWithPrototypes(landmarks);
};

const classifyWithModel = (landmarks: Landmark[]): GesturePrediction | null => {
  if (!model) {
    return null;
  }

  const features = buildModelFeatures(landmarks);

  const distribution = tf.tidy(() => {
    const input = tf.tensor2d([features], [1, MODEL_FEATURE_LENGTH]);
    const prediction = model!.predict(input) as tf.Tensor2D;
    return Array.from(prediction.dataSync());
  });

  const maxConfidence = Math.max(...distribution);
  const bestIndex = distribution.indexOf(maxConfidence);

  return {
    letter: ASL_LETTERS[bestIndex] ?? null,
    confidence: Number.isFinite(maxConfidence) ? maxConfidence : 0,
    vector: features,
    source: "asl-model",
  };
};

const classifyWithPrototypes = (
  landmarks: Landmark[],
): GesturePrediction | null => {
  const heuristicVector = computeHeuristicFeatures(landmarks);
  const prototype = ensurePrototypeTensor();
  const distribution = tf.tidy(() => {
    const featureTensor = tf.tensor1d(heuristicVector);
    const negativeDistances = prototype
      .sub(featureTensor)
      .square()
      .sum(1)
      .mul(-1);

    return Array.from(tf.softmax(negativeDistances).dataSync());
  });

  const maxConfidence = Math.max(...distribution);
  const bestIndex = distribution.indexOf(maxConfidence);

  return {
    letter: PROTOTYPE_LETTERS[bestIndex] ?? null,
    confidence: Number.isFinite(maxConfidence) ? maxConfidence : 0,
    vector: heuristicVector,
    source: "prototype",
  };
};

