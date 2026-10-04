"use client";

import { useId } from "react";
import { RatingInput } from "./RatingInput";

export type EntryValues = {
  rating: number;
  reflection: string;
  completedAt: string; // YYYY-MM-DD
  isPublic: boolean;
};

export const REFLECTION_MAX = 600;

export function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function EntryFields({
  values,
  onChange,
}: {
  values: EntryValues;
  onChange: (v: EntryValues) => void;
}) {
  const id = useId();
  const set = <K extends keyof EntryValues>(k: K, v: EntryValues[K]) => onChange({ ...values, [k]: v });
  const left = REFLECTION_MAX - values.reflection.length;

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="eyebrow mb-4">Sua nota</legend>
        <RatingInput value={values.rating} onChange={(v) => set("rating", v)} />
      </fieldset>

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <label htmlFor={`${id}-r`} className="eyebrow">
            Sua reflexão
          </label>
          <span className={`font-mono text-[11px] tabular-nums ${left < 40 ? "text-gold" : "text-dim"}`}>{left}</span>
        </div>
        <textarea
          id={`${id}-r`}
          value={values.reflection}
          maxLength={REFLECTION_MAX}
          onChange={(e) => set("reflection", e.target.value)}
          rows={5}
          placeholder="O que essa obra significou para você?"
          aria-describedby={`${id}-spoiler`}
          className="w-full resize-none rounded-xl border border-line bg-ink-0/60 px-4 py-3 font-serif text-lg italic leading-relaxed text-paper placeholder:text-dim focus:border-gold/50 focus:outline-none"
        />
        <p id={`${id}-spoiler`} className="mt-2.5 flex gap-2 text-[13px] leading-snug text-mute">
          <span aria-hidden className="text-gold">
            ⚠
          </span>
          {values.isPublic
            ? "Este card ficará público. Evite spoilers: fale do que a obra provocou em você, não do que acontece nela."
            : "Card privado: só você verá esta reflexão."}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-d`} className="eyebrow mb-3 block">
            Terminei em
          </label>
          <input
            id={`${id}-d`}
            type="date"
            value={values.completedAt}
            max={todayISO()}
            min="1950-01-01"
            required
            onChange={(e) => set("completedAt", e.target.value)}
            className="w-full rounded-xl border border-line bg-ink-0/60 px-4 py-2.5 font-mono text-sm text-paper [color-scheme:dark] focus:border-gold/50 focus:outline-none"
          />
        </div>
        <div>
          <span className="eyebrow mb-3 block" id={`${id}-v`}>
            Visibilidade
          </span>
          <div role="radiogroup" aria-labelledby={`${id}-v`} className="flex rounded-xl border border-line p-1">
            {[
              [true, "Público"],
              [false, "Privado"],
            ].map(([v, label]) => (
              <button
                key={String(v)}
                type="button"
                role="radio"
                aria-checked={values.isPublic === v}
                onClick={() => set("isPublic", v as boolean)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  values.isPublic === v ? "bg-paper/[0.08] text-paper" : "text-dim hover:text-mute"
                }`}
              >
                {label as string}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
