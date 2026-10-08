"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ContentType } from "@/db/schema";
import type { WatchProvider } from "@/lib/providers";
import { ProviderIcons } from "./ProviderIcons";

/**
 * Streaming services on a poster's corner, for poster rails rendered on the
 * server (similar titles, a franchise, a filmography). Every tile on screen
 * asks at once; the asks are gathered into one request per 24 titles, after
 * the page, so they never hold it up. Answers are remembered for the visit.
 */
export function TitleStreaming({ type, id, className = "" }: { type: ContentType; id: number; className?: string }) {
  const key = `${type}:${id}`;
  const providers = useSyncExternalStore(
    subscribe,
    () => known.get(key),
    () => undefined,
  );

  useEffect(() => {
    if (!known.has(key)) request(key);
  }, [key]);

  if (!providers?.length) return null;
  return <ProviderIcons providers={providers} className={`fade-in ${className}`} />;
}

const BATCH = 24;
const known = new Map<string, WatchProvider[]>();
const pending = new Set<string>();
const asked = new Set<string>();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function request(key: string) {
  if (asked.has(key)) return;
  asked.add(key);
  pending.add(key);
  timer ??= setTimeout(flush, 0);
}

function flush() {
  timer = null;
  const keys = [...pending];
  pending.clear();
  for (let i = 0; i < keys.length; i += BATCH) {
    const chunk = keys.slice(i, i + BATCH);
    fetch(`/api/tmdb/providers?items=${encodeURIComponent(chunk.join(","))}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { providers: Record<string, WatchProvider[]> } | null) => {
        // A title with no answer is settled as "nowhere", so it is not asked again
        for (const k of chunk) known.set(k, data?.providers[k] ?? []);
        listeners.forEach((cb) => cb());
      })
      // A failed lookup can be asked again by the next tile that needs it
      .catch(() => chunk.forEach((k) => asked.delete(k)));
  }
}
