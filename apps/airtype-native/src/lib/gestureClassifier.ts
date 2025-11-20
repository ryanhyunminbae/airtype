import { computeHeuristicFeatures } from "./featureExtractor";
import type { HandLandmark, GesturePrediction } from "../types";

const PROTOTYPE_FEATURES: Record<string, number[]> = {
  A: [0.08, 0.12, 0.1, 0.03, 0.004],
  B: [0.32, 0.4, 0.35, 0.14, 0.02],
  C: [0.22, 0.24, 0.3, 0.2, 0.01],
};

const LETTERS = Object.keys(PROTOTYPE_FEATURES);

export const classifyGesture = (
  landmarks: HandLandmark[] | null,
): GesturePrediction | null => {
  if (!landmarks || landmarks.length < 21) {
    return null;
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

const euclideanDistance = (a: number[], b: number[]): number =>
  Math.sqrt(
    a.reduce((sum, value, idx) => {
      const delta = value - (b[idx] ?? 0);
      return sum + delta * delta;
    }, 0),
  );

