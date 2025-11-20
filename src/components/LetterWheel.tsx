"use client";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type LetterWheelProps = {
  currentLetter: string | null;
  confidence: number;
};

const DECIMALS = 4;

const formatPercent = (value: number) => `${value.toFixed(DECIMALS)}%`;

const LetterWheel = ({ currentLetter, confidence }: LetterWheelProps) => {
  return (
    <div className="relative h-80 w-80 rounded-full border border-slate-200 bg-white/80 shadow-inner dark:border-slate-800 dark:bg-slate-900/60">
      {LETTERS.map((letter, index) => {
        const angle = (index / LETTERS.length) * 2 * Math.PI - Math.PI / 2;
        const radius = 45;
        const x = 50 + Math.cos(angle) * radius;
        const y = 50 + Math.sin(angle) * radius;
        const isActive = letter === currentLetter;

        return (
          <span
            key={letter}
            style={{
              left: formatPercent(x),
              top: formatPercent(y),
              transform: "translate(-50%, -50%)",
            }}
            className={`absolute text-lg transition-all duration-150 ${
              isActive
                ? "scale-125 font-semibold text-sky-500 drop-shadow"
                : "text-slate-500"
            }`}
          >
            {letter}
          </span>
        );
      })}

      <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-slate-900 text-white shadow-xl dark:bg-white dark:text-slate-900">
        <p className="text-xs uppercase tracking-wide text-slate-200 dark:text-slate-500">
          Current
        </p>
        <p className="text-4xl font-bold">
          {currentLetter ?? "–"}
        </p>
        <p className="text-xs tracking-wide text-slate-200 dark:text-slate-500">
          {(confidence * 100).toFixed(0)}%
        </p>
      </div>
    </div>
  );
};

export default LetterWheel;

