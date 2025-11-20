export type LandmarkLike = {
  x: number;
  y: number;
  z?: number | null;
};

const FINGER_TIPS = [4, 8, 12, 16, 20];

const safeValue = (value: number | null | undefined): number =>
  Number.isFinite(value ?? NaN) ? (value as number) : 0;

export const flattenLandmarks = (landmarks: LandmarkLike[]): number[] =>
  landmarks.flatMap((point) => [
    safeValue(point.x),
    safeValue(point.y),
    safeValue(point.z),
  ]);

export const computeHeuristicFeatures = (
  landmarks: LandmarkLike[],
): number[] => {
  if (!landmarks.length) {
    return [0, 0, 0, 0, 0];
  }

  const wrist = landmarks[0];
  const fingerTips = FINGER_TIPS.map((index) => landmarks[index]).filter(
    Boolean,
  ) as LandmarkLike[];

  const wristDistances = fingerTips.map((point) =>
    euclideanDistance(point, wrist),
  );
  const averageTipDistance =
    wristDistances.reduce((total, value) => total + value, 0) /
    Math.max(fingerTips.length, 1);

  const horizontalSpread =
    Math.max(...fingerTips.map((point) => safeValue(point.x))) -
    Math.min(...fingerTips.map((point) => safeValue(point.x)));

  const verticalSpread =
    Math.max(...fingerTips.map((point) => safeValue(point.y))) -
    Math.min(...fingerTips.map((point) => safeValue(point.y)));

  const thumbIndexDistance = landmarks[4] && landmarks[8]
    ? euclideanDistance(landmarks[4], landmarks[8])
    : 0;

  const zVariance = variance(fingerTips.map((point) => safeValue(point.z)));

  return [
    averageTipDistance,
    horizontalSpread,
    verticalSpread,
    thumbIndexDistance,
    zVariance,
  ];
};

export const buildModelFeatures = (
  landmarks: LandmarkLike[],
): number[] => {
  if (!landmarks.length) {
    return Array(landmarks.length * 3 + 5).fill(0);
  }

  const normalized = normalizeLandmarks(landmarks);
  const heuristics = computeHeuristicFeatures(landmarks);
  return [...normalized, ...heuristics];
};

export const MODEL_FEATURE_LENGTH = (21 * 3) + 5;

const normalizeLandmarks = (landmarks: LandmarkLike[]): number[] => {
  const wrist = landmarks[0];
  const center = {
    x: safeValue(wrist?.x),
    y: safeValue(wrist?.y),
    z: safeValue(wrist?.z),
  };

  const distances = landmarks.map((point) => euclideanDistance(point, center));
  const scale = Math.max(...distances, 1e-6);

  return landmarks.flatMap((point) => [
    (safeValue(point.x) - center.x) / scale,
    (safeValue(point.y) - center.y) / scale,
    (safeValue(point.z) - center.z) / scale,
  ]);
};

const euclideanDistance = (
  a?: LandmarkLike | null,
  b?: LandmarkLike | null,
): number => {
  if (!a || !b) {
    return 0;
  }

  const dx = safeValue(a.x) - safeValue(b.x);
  const dy = safeValue(a.y) - safeValue(b.y);
  const dz = safeValue(a.z) - safeValue(b.z);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const variance = (values: number[]): number => {
  if (!values.length) {
    return 0;
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return (
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    values.length
  );
};

