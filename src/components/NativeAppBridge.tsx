"use client";

import { useEffect } from "react";
import { nativePlugins } from "@/lib/native";

/**
 * Android app behaviour (renders nothing; no-op on the web):
 * - Back button closes an open modal, then walks back through the app's
 *   history, and only at the first page sends the app to the background.
 * - Status bar icons follow the site theme (light icons on dark, dark on light).
 * Links to other sites already open in the system browser (Capacitor default).
 */
export function NativeAppBridge() {
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
