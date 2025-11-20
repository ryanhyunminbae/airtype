import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type TextOutputProps = {
  text: string;
  onClear: () => void;
  onSpace: () => void;
  onBackspace: () => void;
};

const TextOutput = ({
  text,
  onClear,
  onSpace,
  onBackspace,
}: TextOutputProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Typed Text</Text>
      <View style={styles.textBox}>
        <Text style={styles.text}>{text || "Waiting for input…"}</Text>
      </View>
      <View style={styles.controls}>
        <ControlButton label="Insert Space" onPress={onSpace} />
        <ControlButton label="Backspace" onPress={onBackspace} />
        <ControlButton label="Clear Buffer" onPress={onClear} variant="danger" />
      </View>
    </View>
  );
};

type ControlButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "default" | "danger";
};

const ControlButton = ({
  label,
  onPress,
  variant = "default",
}: ControlButtonProps) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.button,
      variant === "danger" ? styles.buttonDanger : styles.buttonDefault,
    ]}
  >
    <Text
      style={[
        styles.buttonText,
        variant === "danger" ? styles.buttonTextDanger : styles.buttonTextDefault,
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 12,
  },
  label: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#64748b",
    fontWeight: "600",
  },
  textBox: {
    width: "100%",
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.1)",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  text: {
    fontSize: 20,
    lineHeight: 28,
    color: "#0f172a",
  },
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  buttonDefault: {
    backgroundColor: "#0f172a",
  },
  buttonDanger: {
    backgroundColor: "#f43f5e",
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  buttonTextDefault: {
    color: "#fff",
  },
  buttonTextDanger: {
    color: "#fff",
  },
});

export default memo(TextOutput);

