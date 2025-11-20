export type HandLandmark = {
  x: number;
  y: number;
  z?: number;
};

export type BoundingBox = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export type HandDetection = {
  landmarks: HandLandmark[];
  boundingBox: BoundingBox;
  handedness: string;
  confidence: number;
};

export type GesturePredictionSource = "prototype" | "asl-model" | "simulated";

export type GesturePrediction = {
  letter: string | null;
  confidence: number;
  vector: number[];
  source: GesturePredictionSource;
};

export type GesturePipelineResult = {
  prediction: GesturePrediction | null;
  detection: HandDetection | null;
  isSimulated: boolean;
};

