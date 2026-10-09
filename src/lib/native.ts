/**
 * The Android app (mobile/): a Capacitor shell that loads this site and
 * injects `window.Capacitor`, with the native plugins installed in the shell
 * under `Capacitor.Plugins`. This module only talks to that object, so the
 * site needs no Capacitor dependency and everything here is a no-op on the web.
 */

import { useSyncExternalStore } from "react";

type Listener = { remove(): Promise<void> | void };

type NativePlugins = {
  App?: {
    addListener(event: "backButton", cb: (e: { canGoBack: boolean }) => void): Promise<Listener>;
    minimizeApp(): Promise<void>;
  };
  SystemBars?: { setStyle(opts: { style: "DARK" | "LIGHT" }): Promise<void> };
  Filesystem?: {
    writeFile(opts: { path: string; data: string; directory: "CACHE" }): Promise<{ uri: string }>;
  };
  Share?: { share(opts: { title?: string; text?: string; files?: string[]; dialogTitle?: string }): Promise<unknown> };
};

type CapacitorGlobal = { isNativePlatform?: () => boolean; Plugins?: NativePlugins };

export function nativePlugins(): NativePlugins | null {
  if (typeof window === "undefined") return null;
  const cap = (window as { Capacitor?: CapacitorGlobal }).Capacitor;
  return cap?.isNativePlatform?.() ? (cap.Plugins ?? null) : null;
}

const noop = () => () => {};

/** True inside the Android app. False on the server and during hydration, so markup always matches. */
export function useIsNativeApp() {
  return useSyncExternalStore(noop, () => nativePlugins() !== null, () => false);
}

/**
 * Opens the system share sheet with a PNG (the WebView can't download files or
 * use the Web Share API). Resolves false when sharing isn't available here.
 */
export async function shareImage(dataUrl: string, filename: string, title: string): Promise<boolean> {
  const p = nativePlugins();
  if (!p?.Filesystem || !p.Share) return false;
  const { uri } = await p.Filesystem.writeFile({
    path: filename,
    data: dataUrl.slice(dataUrl.indexOf(",") + 1),
    directory: "CACHE",
  });
  try {
    await p.Share.share({ title, files: [uri], dialogTitle: "Compartilhar card" });
  } catch (e) {
    // Closing the share sheet rejects with "Share canceled": not an error for us
    if (!/cancel/i.test(String((e as Error)?.message ?? e))) throw e;
  }
  return true;
}
