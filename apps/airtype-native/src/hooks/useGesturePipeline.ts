import { useEffect, useState } from "react";
import type { GesturePipelineResult, GesturePrediction, HandDetection } from "../types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const mockDetection: HandDetection = {
  landmarks: Array.from({ length: 21 }).map((_, index) => ({
    x: 0.3 + Math.random() * 0.4 + index * 0.001,
    y: 0.3 + Math.random() * 0.4 - index * 0.001,
    z: Math.random() * 0.02,
  })),
  boundingBox: {
    xMin: 0.25,
    xMax: 0.75,
    yMin: 0.2,
    yMax: 0.8,
  },
  handedness: "Unknown",
  confidence: 0.5,
};

const createSimulatedPrediction = (): GesturePrediction => {
  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return {
    letter,
    confidence: 0.65 + Math.random() * 0.3,
    vector: [],
    source: "simulated",
  };
};

export const useGesturePipeline = (): GesturePipelineResult => {
  const [prediction, setPrediction] = useState<GesturePrediction | null>(null);
  const [detection, setDetection] = useState<HandDetection | null>(null);

  useEffect(() => {
    let mounted = true;
    setDetection(mockDetection);
    const intervalId = setInterval(() => {
      if (!mounted) {
        return;
      }
      setPrediction(createSimulatedPrediction());
    }, 2500);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return {
    prediction,
    detection,
    isSimulated: true,
  };
};

