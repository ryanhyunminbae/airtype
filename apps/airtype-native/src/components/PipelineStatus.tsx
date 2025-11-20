import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

type PipelineStatusProps = {
  isSimulated: boolean;
};

const PipelineStatus = ({ isSimulated }: PipelineStatusProps) => {
  return (
    <View style={[styles.badge, isSimulated ? styles.simulated : styles.live]}>
      <View
        style={[
          styles.dot,
          { backgroundColor: isSimulated ? "#f97316" : "#22c55e" },
        ]}
      />
      <Text style={styles.label}>
        {isSimulated ? "Simulated predictions" : "Live predictions"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  simulated: {
    backgroundColor: "rgba(249,115,22,0.12)",
  },
  live: {
    backgroundColor: "rgba(34,197,94,0.12)",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
  },
});

export default memo(PipelineStatus);

