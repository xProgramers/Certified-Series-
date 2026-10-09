"use client";

import { useRef } from "react";
import type { AchievementKey } from "@/lib/achievements";
import { Medal } from "./Medal";

/**
 * A medal you can hold: it turns toward the pointer and catches the light
 * (the way a struck coin does in the hand), and spins in once when it appears.
 */
export function MedalStage({
  achievement,
  locked,
  engraved,
  spin = true,
  className = "",
  delay = 0,
}: {
  achievement: AchievementKey;
  locked?: boolean;
  engraved?: string;
  spin?: boolean;
  className?: string;
  /** Spin-in delay, ms. */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${((0.5 - y) * 26).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${((x - 0.5) * 30).toFixed(2)}deg`);
    el.style.setProperty("--lx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--ly", `${(y * 100).toFixed(1)}%`);
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    for (const k of ["--rx", "--ry", "--lx", "--ly"]) el.style.removeProperty(k);
  };

  return (
    <div ref={ref} className={`medal-stage ${className}`} onPointerMove={move} onPointerLeave={leave}>
      <div className={`medal-turn ${locked ? "is-locked" : ""}`}>
        <div className={spin ? "medal-spin" : undefined} style={{ animationDelay: `${delay}ms` }}>
          <Medal achievement={achievement} locked={locked} engraved={engraved} className="block h-full w-full" />
        </div>
        {!locked && <span className="medal-glint" aria-hidden />}
      </div>
    </div>
  );
}
