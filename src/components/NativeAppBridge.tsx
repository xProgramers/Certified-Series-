"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { savePushToken } from "@/app/actions/notifications";
import { nativePlugins } from "@/lib/native";

/**
 * Android app behaviour (renders nothing; no-op on the web):
 * - Back button closes an open modal, then walks back through the app's
 *   history, and only at the first page sends the app to the background.
 * - Status bar icons follow the site theme (light icons on dark, dark on light).
 * - Push (when signed in and the server has Firebase set up): asks once for
 *   permission, sends this device's token to the account, and a tapped
 *   notification opens the series page. A new notice refreshes the bell.
 * Links to other sites already open in the system browser (Capacitor default).
 */
export function NativeAppBridge({ push = false }: { push?: boolean }) {
  const router = useRouter();

  useEffect(() => {
    const p = nativePlugins()?.PushNotifications;
    if (!push || !p) return;
    const handles: Promise<{ remove(): unknown }>[] = [];
    handles.push(p.addListener("registration", ({ value }) => void savePushToken(value).catch(() => {})));
    handles.push(
      p.addListener("pushNotificationActionPerformed", ({ notification }) => {
        const url = notification.data?.url;
        if (url?.startsWith("/")) router.push(url);
      }),
    );
    handles.push(p.addListener("pushNotificationReceived", () => router.refresh()));

    (async () => {
      let { receive } = await p.checkPermissions();
      if (receive === "prompt" || receive === "prompt-with-rationale") {
        // Android 13+ shows the system dialog; ask only once, the settings page can't re-ask anyway
        if (localStorage.getItem("push-asked")) return;
        localStorage.setItem("push-asked", "1");
        receive = (await p.requestPermissions()).receive;
      }
      if (receive === "granted") await p.register();
    })().catch(() => {});

    return () => handles.forEach((h) => void h.then((x) => x.remove()));
  }, [push, router]);

  useEffect(() => {
    const p = nativePlugins();
    if (!p) return;
    const cleanups: (() => void)[] = [];

    if (p.App) {
      const handle = p.App.addListener("backButton", ({ canGoBack }) => {
        const dialogs = document.querySelectorAll<HTMLDialogElement>("dialog[open]");
        const top = dialogs[dialogs.length - 1];
        if (top) {
          // Same path as Esc: Modal's onCancel closes it through React state
          top.dispatchEvent(new Event("cancel", { cancelable: true }));
        } else if (canGoBack) {
          history.back();
        } else {
          p.App?.minimizeApp();
        }
      });
      cleanups.push(() => void handle.then((h) => h.remove()));
    }

    if (p.SystemBars) {
      const sync = () => {
        const light = document.documentElement.getAttribute("data-theme") === "light";
        p.SystemBars?.setStyle({ style: light ? "LIGHT" : "DARK" }).catch(() => {});
      };
      sync();
      const observer = new MutationObserver(sync);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      cleanups.push(() => observer.disconnect());
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
