import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

type StabilizationMeterProps = {
  letter: string | null;
  count: number;
  threshold: number;
};

const StabilizationMeter = ({
  letter,
  count,
  threshold,
}: StabilizationMeterProps) => {
  const progress = Math.min(count / threshold, 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stabilization</Text>
      <Text style={styles.subtitle}>
        {letter
          ? `Confirming ${letter} (${count}/${threshold})`
          : `Hold a gesture steady for ${threshold} frames`}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: "rgba(15,23,42,0.08)",
    borderWidth: 1,
    gap: 8,
  },
  title: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#64748b",
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "500",
  },
  track: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(148,163,184,0.25)",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: "#0ea5e9",
    borderRadius: 999,
  },
});

export default memo(StabilizationMeter);

