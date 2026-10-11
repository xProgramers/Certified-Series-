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
  Share?: { share(opts: { title?: string; text?: string; url?: string; dialogTitle?: string }): Promise<unknown> };
  /** @capacitor/push-notifications: only in app builds that ship it (older installs lack it). */
  PushNotifications?: {
    checkPermissions(): Promise<{ receive: PermissionState }>;
    requestPermissions(): Promise<{ receive: PermissionState }>;
    register(): Promise<void>;
    addListener(event: "registration", cb: (t: { value: string }) => void): Promise<Listener>;
    addListener(event: "registrationError", cb: (e: unknown) => void): Promise<Listener>;
    addListener(
      event: "pushNotificationActionPerformed",
      cb: (a: { notification: { data?: { url?: string } } }) => void,
    ): Promise<Listener>;
    addListener(event: "pushNotificationReceived", cb: () => void): Promise<Listener>;
  };
};

type PermissionState = "prompt" | "prompt-with-rationale" | "granted" | "denied";

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
 * Opens the system share sheet with a link (the WebView has no Web Share API).
 * Resolves false when sharing isn't available here.
 */
export async function shareLink(url: string, title: string, text: string): Promise<boolean> {
  const p = nativePlugins();
  if (!p?.Share) return false;
  try {
    await p.Share.share({ title, text, url, dialogTitle: "Compartilhar card" });
  } catch (e) {
    // Closing the share sheet rejects with "Share canceled": not an error for us
    if (!/cancel/i.test(String((e as Error)?.message ?? e))) throw e;
  }
  return true;
}
