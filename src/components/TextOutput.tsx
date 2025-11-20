"use client";

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
    <section className="flex w-full flex-col gap-3">
      <label className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Typed Text
      </label>
      <textarea
        readOnly
        value={text}
        rows={4}
        className="w-full rounded-xl border border-slate-200 bg-white/70 p-4 text-lg tracking-wide text-slate-900 shadow-inner outline-none focus:border-sky-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      />
      <div className="flex flex-wrap gap-2">
        <ControlButton label="Insert Space" onClick={onSpace} />
        <ControlButton label="Backspace" onClick={onBackspace} />
        <ControlButton label="Clear Buffer" onClick={onClear} variant="danger" />
      </div>
    </section>
  );
};

type ControlVariant = "default" | "danger";

type ControlButtonProps = {
  label: string;
  onClick: () => void;
  variant?: ControlVariant;
};

const ControlButton = ({
  label,
  onClick,
  variant = "default",
}: ControlButtonProps) => {
  const baseClasses =
    "rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const variants: Record<ControlVariant, string> = {
    default:
      "bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
    danger:
      "bg-rose-500 text-white hover:bg-rose-400 focus-visible:outline-rose-500",
  };
  const variantKey: ControlVariant = variant ?? "default";

  return (
    <button
      type="button"
      className={`${baseClasses} ${variants[variantKey]}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default TextOutput;

