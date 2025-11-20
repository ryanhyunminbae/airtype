import * as tf from "@tensorflow/tfjs";
import {
  buildModelFeatures,
  computeHeuristicFeatures,
  MODEL_FEATURE_LENGTH,
} from "./featureExtractor";
import type { HandLandmark, GesturePrediction } from "../types";

const PROTOTYPE_FEATURES: Record<string, number[]> = {
  A: [0.08, 0.12, 0.1, 0.03, 0.004],
  B: [0.32, 0.4, 0.35, 0.14, 0.02],
  C: [0.22, 0.24, 0.3, 0.2, 0.01],
};

const LETTERS = Object.keys(PROTOTYPE_FEATURES);

export const classifyGesture = (
  landmarks: HandLandmark[] | null,
  model?: tf.LayersModel | null,
): GesturePrediction | null => {
  if (!landmarks || landmarks.length < 21) {
    return null;
  }

  if (model) {
    return classifyWithModel(landmarks, model);
  }

  const features = computeHeuristicFeatures(landmarks);
  const distances = LETTERS.map((letter) => {
    const prototype = PROTOTYPE_FEATURES[letter];
    return euclideanDistance(features, prototype);
  });

  const minDistance = Math.min(...distances);
  const index = distances.indexOf(minDistance);
  const confidence = Math.max(0, 1 - minDistance * 5);

  return {
    letter: LETTERS[index] ?? null,
    confidence,
    vector: features,
    source: "prototype",
  };
};

const classifyWithModel = (
  landmarks: HandLandmark[],
  model: tf.LayersModel,
): GesturePrediction | null => {
  const features = buildModelFeatures(landmarks);
  const distribution = tf.tidy(() => {
    const input = tf.tensor2d([features], [1, MODEL_FEATURE_LENGTH]);
    const logits = model.predict(input) as tf.Tensor2D;
    return Array.from(logits.squeeze().dataSync());
  });

  const maxConfidence = Math.max(...distribution);
  const index = distribution.indexOf(maxConfidence);

  return {
    letter: LETTERS[index] ?? null,
    confidence: Number.isFinite(maxConfidence) ? maxConfidence : 0,
    vector: features,
    source: "asl-model",
  };
};

const euclideanDistance = (a: number[], b: number[]): number =>
  Math.sqrt(
    a.reduce((sum, value, idx) => {
      const delta = value - (b[idx] ?? 0);
      return sum + delta * delta;
    }, 0),
  );

