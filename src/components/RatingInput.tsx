"use client";

import type { CSSProperties } from "react";

/** 0–10 in 0.5 steps. Slider + stepper buttons, fully keyboard accessible. */
export function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const set = (v: number) => onChange(Math.max(0, Math.min(10, Math.round(v * 2) / 2)));
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-2" aria-live="polite">
          <span className="font-serif text-6xl leading-none tracking-tight tabular-nums">{value.toFixed(1)}</span>
          <span className="font-mono text-xs tracking-widest text-dim">/ 10</span>
        </div>
        <div className="flex gap-1.5">
          <StepButton label="Diminuir nota" onClick={() => set(value - 0.5)} disabled={value <= 0}>
            −
          </StepButton>
          <StepButton label="Aumentar nota" onClick={() => set(value + 0.5)} disabled={value >= 10}>
            +
          </StepButton>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={0.5}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        aria-label="Nota de 0 a 10"
        aria-valuetext={`${value.toFixed(1)} de 10`}
        className="rating-range mt-4"
        style={{ "--fill": `${value * 10}%` } as CSSProperties}
      />
      <div className="mt-1 flex justify-between font-mono text-[10px] tracking-widest text-dim" aria-hidden>
        {[0, 2, 4, 6, 8, 10].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
}

function StepButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-10 w-10 place-items-center rounded-full border border-line-strong text-lg text-paper transition-colors hover:border-gold/60 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
