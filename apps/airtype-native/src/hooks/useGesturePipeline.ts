import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { decode as decodeBase64 } from "base-64";
import { Camera } from "expo-camera";
import * as FileSystem from "expo-file-system";
import { decodeJpeg } from "@tensorflow/tfjs-react-native";
import "@tensorflow/tfjs-react-native";
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import { classifyGesture } from "../lib/gestureClassifier";
import { loadAslModel } from "../lib/aslModel";
import type {
  GesturePipelineResult,
  GesturePrediction,
  HandDetection,
  HandLandmark,
} from "../types";

type PipelineState = {
  prediction: GesturePrediction | null;
  detection: HandDetection | null;
  isSimulated: boolean;
};

const INITIAL_STATE: PipelineState = {
  prediction: null,
  detection: null,
  isSimulated: false,
};

export const useGesturePipeline = (
  cameraRef: MutableRefObject<Camera | null>,
): GesturePipelineResult => {
  const [state, setState] = useState<PipelineState>(INITIAL_STATE);
  const detectorRef = useRef<handpose.HandPose | null>(null);
  const classifierRef = useRef<tf.LayersModel | null>(null);
  const loopRef = useRef<NodeJS.Timeout | null>(null);
  const runningRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await tf.ready();
        if (tf.getBackend() !== "rn-webgl") {
          await tf.setBackend("rn-webgl");
        }
        detectorRef.current = await handpose.load();
        classifierRef.current = await loadAslModel();
        if (!cancelled) {
          setIsReady(true);
        }
      } catch (error) {
        console.warn("[GesturePipeline] init failed", error);
        if (!cancelled) {
          setState((prev) => ({ ...prev, isSimulated: true }));
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      if (loopRef.current) {
        clearTimeout(loopRef.current);
      }
    };
  }, []);

  const processFrame = useCallback(async () => {
    if (
      !cameraRef.current ||
      !detectorRef.current ||
      runningRef.current ||
      state.isSimulated
    ) {
      return;
    }

    runningRef.current = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        skipProcessing: true,
        quality: 0.35,
      });

      if (!photo?.base64 || !photo.width || !photo.height) {
        return;
      }

      const tensor = base64ImageToTensor(photo.base64);
      const predictions = await detectorRef.current.estimateHands(tensor, {
        flipHorizontal: true,
      });
      tf.dispose(tensor);

      if (photo.uri) {
        await FileSystem.deleteAsync(photo.uri, { idempotent: true });
      }

      const hand = predictions[0];
      if (!hand) {
        setState((prev) => ({ ...prev, detection: null, prediction: null }));
        return;
      }

      const detection = toDetection(hand, photo.width, photo.height);
      const prediction =
        classifyGesture(detection.landmarks, classifierRef.current) ?? null;

      setState({
        detection,
        prediction,
        isSimulated: false,
      });
    } catch (error) {
      console.warn("[GesturePipeline] frame error", error);
    } finally {
      runningRef.current = false;
    }
  }, [cameraRef, state.isSimulated]);

  useEffect(() => {
    if (!isReady || state.isSimulated) {
      return;
    }

    const loop = async () => {
      await processFrame();
      loopRef.current = setTimeout(loop, 450);
    };

    loop();

    return () => {
      if (loopRef.current) {
        clearTimeout(loopRef.current);
      }
    };
  }, [isReady, processFrame, state.isSimulated]);

  return state;
};

const base64ImageToTensor = (base64: string): tf.Tensor3D => {
  const raw = base64ToUint8Array(base64);
  return decodeJpeg(raw, 3);
};

const base64ToUint8Array = (base64: string): Uint8Array => {
  const binary =
    typeof globalThis.atob === "function"
      ? globalThis.atob(base64)
      : decodeBase64(base64);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const toDetection = (
  prediction: handpose.AnnotatedPrediction,
  width: number,
  height: number,
): HandDetection => {
  const landmarks: HandLandmark[] = prediction.landmarks.map(([x, y, z]) => ({
    x: clamp(x / width),
    y: clamp(y / height),
    z: z ?? 0,
  }));

  const xs = landmarks.map((point) => point.x);
  const ys = landmarks.map((point) => point.y);

  return {
    landmarks,
    boundingBox: {
      xMin: Math.min(...xs),
      xMax: Math.max(...xs),
      yMin: Math.min(...ys),
      yMax: Math.max(...ys),
    },
    handedness: prediction.handedness ?? "Unknown",
    confidence: prediction.handInViewConfidence ?? 0,
  };
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);

