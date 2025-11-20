"use client";

import { useEffect, useRef } from "react";
import type { HandDetection } from "@/lib/handDetection";

const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
];

type HandVisualizerProps = {
  detection: HandDetection | null;
  videoDimensions: { width: number; height: number };
  predictedLetter: string | null;
  confidence: number;
  isMirrored?: boolean;
};

const HandVisualizer = ({
  detection,
  videoDimensions,
  predictedLetter,
  confidence,
  isMirrored = false,
}: HandVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }

    const displayWidth = canvas.clientWidth || videoDimensions.width;
    const displayHeight = canvas.clientHeight || videoDimensions.height;
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!detection) {
      return;
    }

    const drawSize = { width: canvas.width, height: canvas.height };
    drawBoundingBox(ctx, detection, drawSize);
    drawSkeleton(ctx, detection, drawSize);
    drawPredictionBadge(ctx, predictedLetter, confidence);
  }, [detection, videoDimensions, predictedLetter, confidence]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="hand landmarks overlay"
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
    />
  );
};

const drawBoundingBox = (
  ctx: CanvasRenderingContext2D,
  detection: HandDetection,
  { width, height }: { width: number; height: number },
) => {
  const { xMin, xMax, yMin, yMax } = detection.boundingBox;
  ctx.strokeStyle = "rgba(59, 130, 246, 0.9)";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    xMin * width,
    yMin * height,
    (xMax - xMin) * width,
    (yMax - yMin) * height,
  );
};

const drawSkeleton = (
  ctx: CanvasRenderingContext2D,
  detection: HandDetection,
  { width, height }: { width: number; height: number },
) => {
  ctx.strokeStyle = "rgba(14, 165, 233, 0.85)";
  ctx.lineWidth = 2;
  ctx.fillStyle = "rgba(14, 165, 233, 0.9)";

  HAND_CONNECTIONS.forEach(([start, end]) => {
    const startPoint = detection.landmarks[start];
    const endPoint = detection.landmarks[end];
    if (!startPoint || !endPoint) return;

    ctx.beginPath();
    ctx.moveTo(startPoint.x * width, startPoint.y * height);
    ctx.lineTo(endPoint.x * width, endPoint.y * height);
    ctx.stroke();
  });

  detection.landmarks.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x * width, point.y * height, 5, 0, 2 * Math.PI);
    ctx.fill();
  });
};

const drawPredictionBadge = (
  ctx: CanvasRenderingContext2D,
  letter: string | null,
  confidence: number,
) => {
  if (!letter) {
    return;
  }

  const badgeText = `${letter} ${(confidence * 100).toFixed(0)}%`;
  ctx.font = "bold 20px Inter, system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
  ctx.fillRect(16, 16, ctx.measureText(badgeText).width + 24, 36);
  ctx.fillStyle = "white";
  ctx.fillText(badgeText, 28, 41);
};

export default HandVisualizer;

