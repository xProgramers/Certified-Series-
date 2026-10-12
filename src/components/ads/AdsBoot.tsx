"use client";

import { useEffect } from "react";
import { startAds } from "@/lib/admob";

/** Asks for ad consent on app launch (Android app only; nothing happens on the web). */
export function AdsBoot() {
  useEffect(() => {
    startAds();
  }, []);
  return null;
}
