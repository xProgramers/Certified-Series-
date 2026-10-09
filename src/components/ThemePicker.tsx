"use client";

import { useSyncExternalStore } from "react";
import { THEME_BG, type Theme } from "@/lib/theme";
import { chooseTheme, storedTheme, THEME_EVENT } from "./ThemeToggle";

type Choice = Theme | "system";

const OPTIONS: { value: Choice; label: string; note: string }[] = [
  { value: "dark", label: "Escuro", note: "Sala de cinema" },
  { value: "light", label: "Claro", note: "Parede de galeria" },
  { value: "system", label: "Automático", note: "Segue o celular" },
];

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

/** Theme choice as three small swatches of the app's walls, the current one ringed in gold. */
export function ThemePicker() {
  // Unknown on the server: the choice lives in this device's storage
  const choice = useSyncExternalStore<Choice | null>(subscribe, () => storedTheme() ?? "system", () => null);

  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 items-start gap-3">
      {OPTIONS.map(({ value, label, note }) => {
        const on = choice === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => chooseTheme(value)}
            className="group flex flex-col text-left"
          >
            <span
              className={`relative block aspect-[4/3] overflow-hidden rounded-xl border transition-all duration-300 ${
                on ? "border-gold shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-gold)_25%,transparent)]" : "border-line-strong group-hover:border-gold/50"
              }`}
              style={{
                background:
                  value === "system"
                    ? `linear-gradient(135deg, ${THEME_BG.dark} 50%, ${THEME_BG.light} 50%)`
                    : THEME_BG[value],
              }}
              aria-hidden
            >
              {/* A tiny card on the wall */}
              <span
                className="absolute left-1/2 top-1/2 block aspect-[5/8] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-[3px]"
                style={{
                  background: "linear-gradient(160deg, #3b3226, #121110 70%)",
                  boxShadow: "0 0 0 1px rgb(201 176 122 / 0.55), 0 8px 18px -6px rgb(0 0 0 / 0.5)",
                }}
              />
              {on && (
                <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-gold text-[11px] text-ink-0">
                  ✓
                </span>
              )}
            </span>
            <span className={`mt-2.5 block text-sm ${on ? "text-paper" : "text-mute"}`}>{label}</span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-dim">{note}</span>
          </button>
        );
      })}
    </div>
  );
}
