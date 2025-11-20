"use client";

import { useCallback, useMemo, useState } from "react";
import CameraFeed from "@/components/CameraFeed";
import LetterWheel from "@/components/LetterWheel";
import TextOutput from "@/components/TextOutput";
import DatasetRecorder from "@/components/DatasetRecorder";
import type { GesturePrediction } from "@/lib/gestureClassifier";
import type { HandDetection } from "@/lib/handDetection";

const CONFIDENCE_THRESHOLD = 0.6;
const FRAMES_TO_CONFIRM = 12;

type StreakState = {
  letter: string | null;
  count: number;
};

export default function Home() {
  const [typedText, setTypedText] = useState("");
  const [currentPrediction, setCurrentPrediction] =
    useState<GesturePrediction | null>(null);
  const [streak, setStreak] = useState<StreakState>({
    letter: null,
    count: 0,
  });
  const [latestDetection, setLatestDetection] = useState<HandDetection | null>(
    null,
  );

  const handlePrediction = useCallback((prediction: GesturePrediction | null) => {
    setCurrentPrediction(prediction);

    if (
      !prediction ||
      !prediction.letter ||
      prediction.confidence < CONFIDENCE_THRESHOLD
    ) {
      setStreak({ letter: null, count: 0 });
      return;
    }

    setStreak((prev) => {
      if (prev.letter === prediction.letter) {
        const nextCount = prev.count + 1;
        if (nextCount >= FRAMES_TO_CONFIRM) {
          setTypedText((prevText) => prevText + prediction.letter);
          return { letter: prediction.letter, count: 0 };
        }
        return { letter: prev.letter, count: nextCount };
      }
      return { letter: prediction.letter, count: 1 };
    });
  }, []);

  const handleClear = useCallback(() => setTypedText(""), []);
  const handleSpace = useCallback(
    () => setTypedText((prev) => `${prev} `),
    [],
  );
  const handleBackspace = useCallback(
    () => setTypedText((prev) => prev.slice(0, -1)),
    [],
  );

  const stabilizationProgress = useMemo(() => {
    if (!streak.letter) {
      return 0;
    }
    return Math.min(streak.count / FRAMES_TO_CONFIRM, 1);
  }, [streak]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-6 py-10 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Prototype
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            AirType — gesture-based typing
          </h1>
          <p className="max-w-3xl text-lg text-slate-600 dark:text-slate-300">
            Raise your hand to let MediaPipe Hands extract landmarks in real
            time. We map stabilized gestures to letters (currently A, B, and C)
            and feed them into a virtual text buffer while the letter wheel
            highlights the model&apos;s best guess.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <CameraFeed
            onPrediction={handlePrediction}
            onDetection={setLatestDetection}
          />

          <div className="flex flex-col gap-6">
            <LetterWheel
              currentLetter={currentPrediction?.letter ?? null}
              confidence={currentPrediction?.confidence ?? 0}
            />

            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900/80">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
                Stabilization
              </p>
              <p className="mt-1 text-lg font-medium text-slate-900 dark:text-white">
                {streak.letter
                  ? `Confirming ${streak.letter} (${streak.count}/${FRAMES_TO_CONFIRM})`
                  : "Hold a gesture steady to confirm a letter"}
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all"
                  style={{ width: `${stabilizationProgress * 100}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                A letter is added after it is predicted with ≥
                {Math.round(CONFIDENCE_THRESHOLD * 100)}% confidence for{" "}
                {FRAMES_TO_CONFIRM} consecutive frames.
              </p>
            </div>
          </div>
        </div>

        <TextOutput
          text={typedText}
          onClear={handleClear}
          onSpace={handleSpace}
          onBackspace={handleBackspace}
        />

        <DatasetRecorder detection={latestDetection} />
      </div>
    </main>
  );
}
