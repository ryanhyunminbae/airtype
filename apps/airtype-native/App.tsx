import { StatusBar } from "expo-status-bar";
import { useMemo, useState, useCallback, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import CameraPreview from "./src/components/CameraPreview";
import LetterWheel from "./src/components/LetterWheel";
import PipelineStatus from "./src/components/PipelineStatus";
import StabilizationMeter from "./src/components/StabilizationMeter";
import TextOutput from "./src/components/TextOutput";
import { useGesturePipeline } from "./src/hooks/useGesturePipeline";
import type { GesturePrediction } from "./src/types";

const CONFIDENCE_THRESHOLD = 0.6;
const FRAMES_TO_CONFIRM = 12;

type Streak = {
  letter: string | null;
  count: number;
};

export default function App() {
  const { prediction, detection, isSimulated } = useGesturePipeline();
  const [typedText, setTypedText] = useState("");
  const [streak, setStreak] = useState<Streak>({ letter: null, count: 0 });

  useStabilization(prediction, setTypedText, setStreak);

  const handleClear = useCallback(() => setTypedText(""), []);
  const handleSpace = useCallback(
    () => setTypedText((current) => `${current} `),
    [],
  );
  const handleBackspace = useCallback(
    () => setTypedText((current) => current.slice(0, -1)),
    [],
  );

  const stabilizationProgress = useMemo(
    () => Math.min(streak.count / FRAMES_TO_CONFIRM, 1),
    [streak],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.pill}>Native prototype</Text>
          <Text style={styles.title}>AirType Mobile</Text>
          <Text style={styles.subtitle}>
            Raise your hand to teach the device which letter you intend to type.
            Once stabilized, the letter is appended to the buffer and highlighted
            on the wheel.
          </Text>
          <PipelineStatus isSimulated={isSimulated} />
        </View>

        <CameraPreview detection={detection} disabled={false} />

        <View style={styles.grid}>
          <LetterWheel
            currentLetter={prediction?.letter ?? null}
            confidence={prediction?.confidence ?? 0}
          />
          <StabilizationMeter
            letter={streak.letter}
            count={streak.count}
            threshold={FRAMES_TO_CONFIRM}
          />
        </View>

        <TextOutput
          text={typedText}
          onClear={handleClear}
          onSpace={handleSpace}
          onBackspace={handleBackspace}
        />

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Next steps</Text>
          <Text style={styles.footerText}>
            This build still uses simulated predictions. Integrate
            tfjs-react-native or MediaPipe Tasks to power real detection,
            then swap the pipeline hook to stream live landmarks.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStabilization = (
  prediction: GesturePrediction | null,
  appendText: (updater: (current: string) => string) => void,
  setStreak: (updater: (streak: Streak) => Streak) => void,
) => {
  useEffect(() => {
    if (
      !prediction ||
      !prediction.letter ||
      prediction.confidence < CONFIDENCE_THRESHOLD
    ) {
      setStreak(() => ({ letter: null, count: 0 }));
      return;
    }

    setStreak((current) => {
      if (current.letter === prediction.letter) {
        const nextCount = current.count + 1;
        if (nextCount >= FRAMES_TO_CONFIRM) {
          appendText((text) => `${text}${prediction.letter}`);
          return { letter: prediction.letter, count: 0 };
        }
        return { letter: current.letter, count: nextCount };
      }
      return { letter: prediction.letter, count: 1 };
    });
  }, [appendText, prediction, setStreak]);
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  header: {
    gap: 12,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(14,165,233,0.15)",
    color: "#0369a1",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontSize: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
  },
  grid: {
    gap: 20,
  },
  footerCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#e0f2fe",
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0369a1",
    marginBottom: 8,
  },
  footerText: {
    fontSize: 15,
    color: "#0f172a",
    lineHeight: 22,
  },
});
