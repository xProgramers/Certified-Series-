"use client";

import { useLayoutEffect } from "react";
import { THEME_BG, THEME_KEY, type Theme } from "@/lib/theme";

function stored(): Theme | null {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_BG[theme]);
}

/** Sun/moon switch. Both icons are rendered; CSS shows the right one, so SSR never guesses. */
export function ThemeToggle() {
  useLayoutEffect(() => {
    // Re-applies after React's dev remount, and follows the system until the user picks a side
    apply(stored() ?? systemTheme());
    const mq = matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if (!stored()) apply(systemTheme());
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next: Theme = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {}
    const root = document.documentElement;
    root.classList.add("theme-switching");
    apply(next);
    setTimeout(() => root.classList.remove("theme-switching"), 450);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle grid h-9 w-9 place-items-center rounded-full text-mute transition-colors hover:text-paper"
      aria-label="Alternar tema claro e escuro"
      title="Alternar tema"
    >
      <svg viewBox="0 0 20 20" className="theme-icon-sun h-[17px] w-[17px]" aria-hidden>
        <circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <svg viewBox="0 0 20 20" className="theme-icon-moon h-[17px] w-[17px]" aria-hidden>
        <path
          d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
