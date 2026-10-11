"use client";

import { useEffect, useRef, useState } from "react";
import { ADS, bottomChrome, isNativeApp, showBottomBanner } from "@/lib/admob";

/**
 * Marks the end of a page. Once the reader scrolls here, the app shows an
 * AdMob banner anchored to the bottom of the screen until they leave the page.
 * On the web it renders nothing, unless NEXT_PUBLIC_ADS_PREVIEW=1, which shows
 * a placeholder of the same size to check the layout.
 */
export function AdBanner() {
  const sentinel = useRef<HTMLDivElement>(null);
  // What to show once the reader gets here: the real banner (app), the placeholder (preview) or nothing
  const [reached, setReached] = useState<"native" | "preview" | "none" | null>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || reached) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setReached(isNativeApp() ? "native" : ADS.preview ? "preview" : "none");
      },
      { rootMargin: "0px 0px 120px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reached]);

  useEffect(() => {
    if (reached !== "native") return;
    let cleanup: (() => void) | null = null;
    let gone = false;
    showBottomBanner()
      .then((fn) => {
        if (gone) fn();
        else cleanup = fn;
      })
      .catch((err) => console.warn("[ads] banner failed", err));
    return () => {
      gone = true;
      cleanup?.();
    };
  }, [reached]);

  return (
    <>
      <div ref={sentinel} aria-hidden className="h-px" />
      {reached === "preview" && <BannerPreview />}
    </>
  );
}

function BannerPreview() {
  // Measured after mount, like the native banner's margin
  const [bottom, setBottom] = useState<number | null>(null);
  useEffect(() => {
    const root = document.documentElement;
    const margin = bottomChrome();
    root.style.setProperty("--ad-inset", "56px");
    root.style.setProperty("--ad-bottom", `${56 + margin}px`);
    const id = requestAnimationFrame(() => setBottom(margin));
    return () => {
      cancelAnimationFrame(id);
      root.style.removeProperty("--ad-inset");
      root.style.removeProperty("--ad-bottom");
    };
  }, []);
  if (bottom === null) return null;
  return (
    <div
      role="complementary"
      aria-label="Anúncio"
      style={{ bottom }}
      className="fixed inset-x-0 z-40 flex h-14 items-center justify-center border-t border-line bg-ink-2"
    >
      <span className="font-mono text-[10px] tracking-[0.25em] text-dim">ANÚNCIO DE TESTE</span>
    </div>
  );
}
