"use client";

import { useEffect, useState } from "react";
import { openAdPrivacyOptions, startAds } from "@/lib/admob";

/**
 * "Privacidade dos anúncios": reopens Google's consent form. Google requires
 * this entry point wherever the consent form applies; it only appears in the
 * Android app and only when UMP says it's needed.
 */
export function AdPrivacyLink({ className }: { className?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let alive = true;
    startAds().then((s) => alive && setVisible(s.privacyOptions));
    return () => {
      alive = false;
    };
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        openAdPrivacyOptions()
          .then((s) => setVisible(s.privacyOptions))
          .catch((err) => console.warn("[ads] privacy options failed", err))
      }
    >
      Privacidade dos anúncios
    </button>
  );
}
