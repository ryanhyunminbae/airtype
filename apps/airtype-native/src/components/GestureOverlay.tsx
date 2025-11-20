import { memo } from "react";
import { StyleSheet } from "react-native";
import Svg, { Circle, Line, Rect } from "react-native-svg";
import type { HandDetection } from "../types";

type GestureOverlayProps = {
  detection: HandDetection | null;
};

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

const GestureOverlay = ({ detection }: GestureOverlayProps) => {
  if (!detection) {
    return null;
  }

  return (
    <Svg style={styles.svg}>
      <Rect
        x={`${detection.boundingBox.xMin * 100}%`}
        y={`${detection.boundingBox.yMin * 100}%`}
        width={`${(detection.boundingBox.xMax - detection.boundingBox.xMin) * 100}%`}
        height={`${(detection.boundingBox.yMax - detection.boundingBox.yMin) * 100}%`}
        stroke="#38bdf8"
        strokeWidth={2}
        fill="transparent"
      />

      {HAND_CONNECTIONS.map(([start, end]) => {
        const a = detection.landmarks[start];
        const b = detection.landmarks[end];
        if (!a || !b) {
          return null;
        }
        return (
          <Line
            key={`${start}-${end}`}
            x1={`${a.x * 100}%`}
            y1={`${a.y * 100}%`}
            x2={`${b.x * 100}%`}
            y2={`${b.y * 100}%`}
            stroke="#0ea5e9"
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })}

      {detection.landmarks.map((point, index) => (
        <Circle
          key={`point-${index}`}
          cx={`${point.x * 100}%`}
          cy={`${point.y * 100}%`}
          r="4"
          fill="#0ea5e9"
        />
      ))}
    </Svg>
  );
};

const styles = StyleSheet.create({
  svg: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default memo(GestureOverlay);

