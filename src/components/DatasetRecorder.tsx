"use client";

import { useMemo, useRef, useState } from "react";
import type { HandDetection } from "@/lib/handDetection";

type RecordedSample = {
  label: string;
  landmarks: Array<{ x: number; y: number; z: number }>;
};

type DatasetRecorderProps = {
  detection: HandDetection | null;
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const DatasetRecorder = ({ detection }: DatasetRecorderProps) => {
  const [selectedLetter, setSelectedLetter] = useState("A");
  const [samples, setSamples] = useState<RecordedSample[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleCounts = useMemo(() => {
    return samples.reduce<Record<string, number>>((acc, sample) => {
      acc[sample.label] = (acc[sample.label] ?? 0) + 1;
      return acc;
    }, {});
  }, [samples]);

  const handleCapture = () => {
    if (!detection) {
      setStatus("No hand detected. Hold a pose before capturing.");
      return;
    }

    const snapshot: RecordedSample = {
      label: selectedLetter,
      landmarks: detection.landmarks.map((point) => ({
        x: point.x,
        y: point.y,
        z: point.z ?? 0,
      })),
    };

    setSamples((prev) => [...prev, snapshot]);
    setStatus(`Captured sample for "${selectedLetter}".`);
  };

  const handleDownload = () => {
    if (!samples.length) {
      setStatus("Capture at least one sample before exporting.");
      return;
    }

    const payload = {
      generatedAt: new Date().toISOString(),
      sampleCount: samples.length,
      samples,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `asl_samples_${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setSamples([]);
    setStatus("Cleared in-memory samples.");
  };

  const handleImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming: RecordedSample[] =
        parsed.samples ??
        parsed ??
        [];

      if (!Array.isArray(incoming)) {
        setStatus("Invalid dataset format.");
        return;
      }

      setSamples(incoming);
      setStatus(`Imported ${incoming.length} samples.`);
    } catch (error) {
      console.error("Failed to import dataset", error);
      setStatus("Failed to import dataset.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Dataset Recorder (ASL)
          </h2>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Experimental
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Capture labeled landmark samples directly in the browser to build an American Sign Language dataset. Export the JSON file and feed it into the training script to create a TF.js model.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Letter
          </label>
          <select
            value={selectedLetter}
            onChange={(event) => setSelectedLetter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {LETTERS.map((letter) => (
              <option key={letter} value={letter}>
                {letter}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            onClick={handleCapture}
          >
            Capture sample
          </button>

          <button
            type="button"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={handleDownload}
          >
            Export JSON
          </button>
          <button
            type="button"
            className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-200 dark:hover:bg-rose-950/30"
            onClick={handleClear}
          >
            Clear
          </button>
          <label className="ml-auto text-xs font-semibold uppercase tracking-wide text-slate-400">
            Load dataset
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="mt-1 block text-sm text-slate-500"
              onChange={handleImport}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          {LETTERS.map((letter) => (
            <span
              key={letter}
              className="rounded-full bg-slate-100 px-2 py-1 font-semibold dark:bg-slate-800"
            >
              {letter}: {sampleCounts[letter] ?? 0}
            </span>
          ))}
        </div>

        {status && (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            {status}
          </p>
        )}
      </div>
    </section>
  );
};

export default DatasetRecorder;

