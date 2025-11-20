import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

export type Landmark = NormalizedLandmark & { z: number };

export type BoundingBox = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export type HandDetection = {
  landmarks: Landmark[];
  worldLandmarks: Landmark[];
  boundingBox: BoundingBox;
  handedness: string;
  score: number;
};

export type HandDetectionFrame = {
  hands: HandDetection[];
  timestampMs: number;
};

let landmarkerPromise: Promise<HandLandmarker> | null = null;

/**
 * Loads the MediaPipe Hand Landmarker exactly once.
 * The WASM assets are served from the official CDN so we can keep the repo lightweight.
 */
export const loadHandLandmarker = async (): Promise<HandLandmarker> => {
  if (landmarkerPromise) {
    return landmarkerPromise;
  }

  if (typeof window === "undefined") {
    throw new Error("Hand tracking is only available in the browser.");
  }

  landmarkerPromise = (async () => {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
    );

    return HandLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      },
      runningMode: "VIDEO",
      numHands: 1,
    });
  })();

  return landmarkerPromise;
};

/**
 * Runs MediaPipe Hands on the provided video element and normalizes the output so
 * the rest of the app does not need to know about the underlying API.
 */
export const detectHands = async (
  video: HTMLVideoElement,
): Promise<HandDetectionFrame | null> => {
  if (!video) {
    return null;
  }

  const landmarker = await loadHandLandmarker();
  const timestampMs = performance.now();
  const result = landmarker.detectForVideo(video, timestampMs);

  if (!result) {
    return null;
  }

  return toFrame(result, timestampMs);
};

const toFrame = (
  result: HandLandmarkerResult,
  timestampMs: number,
): HandDetectionFrame => {
  const hands = (result.landmarks ?? []).map((landmarks, index) => {
    const handedness = result.handednesses?.[index]?.[0];
    return {
      landmarks: landmarks.map(copyLandmark),
      worldLandmarks: (result.worldLandmarks?.[index] ?? []).map(copyLandmark),
      boundingBox: computeBoundingBox(landmarks),
      handedness: handedness?.categoryName ?? "Unknown",
      score: handedness?.score ?? 0,
    };
  });

  return { hands, timestampMs };
};

const copyLandmark = (landmark: NormalizedLandmark): Landmark => ({
  x: landmark.x,
  y: landmark.y,
  z: "z" in landmark ? landmark.z ?? 0 : 0,
});

const computeBoundingBox = (landmarks: NormalizedLandmark[]): BoundingBox => {
  const xs = landmarks.map((point) => point.x);
  const ys = landmarks.map((point) => point.y);

  return {
    xMin: Math.min(...xs),
    xMax: Math.max(...xs),
    yMin: Math.min(...ys),
    yMax: Math.max(...ys),
  };
};

