"use client";

import { useEffect, useRef, useState } from "react";
import HandVisualizer from "./HandVisualizer";
import {
  detectHands,
  type HandDetection,
  type HandDetectionFrame,
} from "@/lib/handDetection";
import {
  classifyGesture,
  type GesturePrediction,
  ensureAslModel,
} from "@/lib/gestureClassifier";

type CameraFeedProps = {
  onPrediction: (prediction: GesturePrediction | null) => void;
  onDetection?: (detection: HandDetection | null) => void;
};

const DEFAULT_DIMENSIONS = { width: 960, height: 540 };
const MIRROR_FEED = true;

const CameraFeed = ({ onPrediction, onDetection }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [detection, setDetection] = useState<HandDetection | null>(null);
  const [prediction, setPrediction] = useState<GesturePrediction | null>(null);
  const [videoDimensions, setVideoDimensions] = useState(DEFAULT_DIMENSIONS);
  const [statusMessage, setStatusMessage] = useState(
    "Requesting webcam access…",
  );
  const [hasCamera, setHasCamera] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    let mounted = true;
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatusMessage("Camera access is not supported in this browser.");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        setHasCamera(true);
        setStatusMessage("Show your hand to start typing.");

        if (!videoRef.current) {
          return;
        }

        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        if (!mounted) {
          return;
        }

        setVideoDimensions({
          width: videoRef.current.videoWidth || DEFAULT_DIMENSIONS.width,
          height: videoRef.current.videoHeight || DEFAULT_DIMENSIONS.height,
        });

        const renderLoop = async () => {
          if (!mounted || !videoRef.current) {
            return;
          }

          if (
            videoRef.current.readyState <
            HTMLMediaElement.HAVE_ENOUGH_DATA
          ) {
            animationFrameId = window.requestAnimationFrame(renderLoop);
            return;
          }

          let frame: HandDetectionFrame | null = null;
          try {
            frame = await detectHands(videoRef.current);
          } catch (error) {
            console.error("Failed to run hand detection", error);
            setStatusMessage("Loading hand-tracking model…");
            animationFrameId = window.requestAnimationFrame(renderLoop);
            return;
          }

          if (!mounted) {
            return;
          }

          const latestHand = frame?.hands?.[0] ?? null;
          setDetection(latestHand);
          onDetection?.(latestHand);

          if (latestHand) {
            setStatusMessage("Tracking hand");
            const nextPrediction = classifyGesture(latestHand.landmarks);
            setPrediction(nextPrediction);
            onPrediction(nextPrediction);
          } else {
            setStatusMessage("Show your hand to start typing.");
            setPrediction(null);
            onPrediction(null);
          }

          animationFrameId = window.requestAnimationFrame(renderLoop);
        };

        animationFrameId = window.requestAnimationFrame(renderLoop);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to access the webcam.";
        setStatusMessage(message);
        setHasCamera(false);
        onPrediction(null);
      }
    };

    ensureAslModel();
    startCamera();

    return () => {
      mounted = false;
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onDetection, onPrediction]);

  return (
    <section className="flex w-full flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/90 shadow-xl dark:border-slate-800">
        <video
          ref={videoRef}
          className="h-full w-full object-cover opacity-75"
          playsInline
          autoPlay
          muted
          style={{ transform: MIRROR_FEED ? "scaleX(-1)" : "none" }}
        />

        <HandVisualizer
          detection={detection}
          videoDimensions={videoDimensions}
          predictedLetter={prediction?.letter ?? null}
          confidence={prediction?.confidence ?? 0}
          isMirrored={MIRROR_FEED}
        />

        {!hasCamera && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/90 text-center text-white">
            <p className="max-w-sm text-lg font-semibold">
              Grant webcam access to see the live hand-tracking overlay.
            </p>
          </div>
        )}
      </div>

      <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
        {statusMessage}
      </p>
    </section>
  );
};

export default CameraFeed;

