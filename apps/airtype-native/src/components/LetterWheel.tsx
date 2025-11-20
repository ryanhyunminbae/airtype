import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

type LetterWheelProps = {
  currentLetter: string | null;
  confidence: number;
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const LetterWheel = ({ currentLetter, confidence }: LetterWheelProps) => {
  return (
    <View style={styles.container}>
      {LETTERS.map((letter, index) => {
        const angle = (index / LETTERS.length) * 2 * Math.PI - Math.PI / 2;
        const radius = 120;
        const x = 150 + Math.cos(angle) * radius;
        const y = 150 + Math.sin(angle) * radius;
        const isActive = letter === currentLetter;

        return (
          <Text
            key={letter}
            style={[
              styles.letter,
              {
                left: x,
                top: y,
                transform: [{ translateX: -15 }, { translateY: -15 }],
              },
              isActive ? styles.activeLetter : styles.inactiveLetter,
            ]}
          >
            {letter}
          </Text>
        );
      })}

      <View style={styles.centerBadge}>
        <Text style={styles.centerLabel}>Current</Text>
        <Text style={styles.centerLetter}>{currentLetter ?? "–"}</Text>
        <Text style={styles.centerConfidence}>
          {(confidence * 100).toFixed(0)}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.2)",
    backgroundColor: "rgba(255,255,255,0.9)",
    alignSelf: "center",
  },
  letter: {
    position: "absolute",
    fontSize: 18,
    fontWeight: "500",
  },
  activeLetter: {
    color: "#0ea5e9",
    fontWeight: "700",
  },
  inactiveLetter: {
    color: "#94a3b8",
  },
  centerBadge: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -70 }, { translateY: -70 }],
    shadowColor: "#0f172a",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
  centerLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "rgba(248,250,252,0.7)",
  },
  centerLetter: {
    fontSize: 48,
    color: "#fff",
    fontWeight: "700",
    marginVertical: 6,
  },
  centerConfidence: {
    fontSize: 12,
    color: "rgba(248,250,252,0.8)",
  },
});

export default memo(LetterWheel);

