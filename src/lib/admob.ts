/**
 * AdMob, through the Capacitor bridge of the Android app (see src/lib/native.ts).
 *
 * AdMob is a native SDK: it never runs in a browser. `@capacitor-community/admob`
 * ships in the shell (mobile/) and shows up as `Capacitor.Plugins.AdMob`, so
 * everything here is a no-op on the web.
 *
 * Flow on each app launch (Google's recommended order): ask UMP for the
 * consent status, show the consent form when it's required, then start the
 * SDK and request ads only if UMP says we can.
 */

import { nativePlugins } from "./native";

// Google's sample IDs: always serve test ads, safe to click.
// https://developers.google.com/admob/android/test-ads
const TEST_BANNER_ID = "ca-app-pub-3940256099942544/9214589741";

const bannerId = process.env.NEXT_PUBLIC_ADMOB_BANNER_ID?.trim();

export const ADS = {
  bannerId: bannerId || TEST_BANNER_ID,
  /** No real unit configured yet → test ads, and the consent form acts as if the device were in the EEA. */
  testing: !bannerId,
  /** Web-only layout preview: a placeholder where the native banner would sit. */
  preview: process.env.NEXT_PUBLIC_ADS_PREVIEW === "1",
};

type ConsentInfo = {
  status: "UNKNOWN" | "REQUIRED" | "NOT_REQUIRED" | "OBTAINED";
  isConsentFormAvailable?: boolean;
  canRequestAds?: boolean;
  privacyOptionsRequirementStatus?: "UNKNOWN" | "REQUIRED" | "NOT_REQUIRED";
};

type AdMobPlugin = {
  initialize(opts?: { initializeForTesting?: boolean }): Promise<void>;
  requestConsentInfo(opts?: { debugGeography?: number; testDeviceIdentifiers?: string[] }): Promise<ConsentInfo>;
  showConsentForm(): Promise<ConsentInfo>;
  showPrivacyOptionsForm(): Promise<void>;
  showBanner(opts: {
    adId: string;
    adSize?: "ADAPTIVE_BANNER";
    position?: "BOTTOM_CENTER";
    margin?: number;
    isTesting?: boolean;
  }): Promise<void>;
  removeBanner(): Promise<void>;
  addListener(event: "bannerAdSizeChanged", cb: (size: { width: number; height: number }) => void): Promise<{ remove(): void }>;
};

/** UMP's debug geography value for "pretend this device is in the EEA". */
const DEBUG_GEOGRAPHY_EEA = 1;

function plugin(): AdMobPlugin | null {
  return (nativePlugins() as { AdMob?: AdMobPlugin } | null)?.AdMob ?? null;
}

export type AdsState = {
  /** Ads may be requested (consent obtained or not needed). */
  canRequestAds: boolean;
  /** The user must be able to reopen the consent form ("Privacidade dos anúncios"). */
  privacyOptions: boolean;
};

const OFF: AdsState = { canRequestAds: false, privacyOptions: false };

let started: Promise<AdsState> | null = null;

/** Consent + SDK start, once per app launch. Resolves to OFF on the web. */
export function startAds(): Promise<AdsState> {
  started ??= run().catch((err) => {
    console.warn("[ads] start failed", err);
    return OFF;
  });
  return started;
}

async function run(): Promise<AdsState> {
  const admob = plugin();
  if (!admob) return OFF;

  let info = await admob.requestConsentInfo(ADS.testing ? { debugGeography: DEBUG_GEOGRAPHY_EEA } : undefined);
  if (info.status === "REQUIRED" && info.isConsentFormAvailable) info = await admob.showConsentForm();

  const state = toState(info);
  if (state.canRequestAds) await admob.initialize({ initializeForTesting: ADS.testing });
  return state;
}

function toState(info: ConsentInfo): AdsState {
  return {
    canRequestAds: info.canRequestAds ?? (info.status === "OBTAINED" || info.status === "NOT_REQUIRED"),
    privacyOptions: info.privacyOptionsRequirementStatus === "REQUIRED",
  };
}

/** Reopens Google's consent form so the user can change their answer. */
export async function openAdPrivacyOptions(): Promise<AdsState> {
  const admob = plugin();
  if (!admob) return OFF;
  await admob.showPrivacyOptionsForm();
  // The answer may have changed; ask again so the next banner respects it.
  const info = await admob.requestConsentInfo(ADS.testing ? { debugGeography: DEBUG_GEOGRAPHY_EEA } : undefined);
  const state = toState(info);
  if (state.canRequestAds) await admob.initialize({ initializeForTesting: ADS.testing });
  started = Promise.resolve(state);
  return state;
}

/**
 * Native banners float over the WebView at the bottom of the screen, lifted
 * above the app's tab bar (or the system navigation bar when there's none).
 * The page gets the banner's height as bottom padding (--ad-inset) and modals
 * stop above it (--ad-bottom), so nothing hides under it.
 * Returns a cleanup that removes the banner.
 */
export async function showBottomBanner(): Promise<() => void> {
  const admob = plugin();
  const { canRequestAds } = await startAds();
  if (!admob || !canRequestAds) return () => {};

  const root = document.documentElement;
  const margin = bottomChrome();
  const sub = await admob.addListener("bannerAdSizeChanged", ({ height }) => {
    root.style.setProperty("--ad-inset", `${height}px`);
    root.style.setProperty("--ad-bottom", `${height + margin}px`);
  });
  await admob.showBanner({
    adId: ADS.bannerId,
    adSize: "ADAPTIVE_BANNER",
    position: "BOTTOM_CENTER",
    margin,
    isTesting: ADS.testing,
  });
  return () => {
    sub.remove();
    root.style.removeProperty("--ad-inset");
    root.style.removeProperty("--ad-bottom");
    admob.removeBanner().catch(() => {});
  };
}

/** Height (CSS px) of what's fixed at the bottom of the screen: the tab bar, else the system navigation bar. */
export function bottomChrome(): number {
  const tabs = document.querySelector<HTMLElement>("[data-tab-bar]");
  if (tabs && tabs.offsetHeight > 0) return tabs.offsetHeight;
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;visibility:hidden;height:var(--safe-area-inset-bottom,env(safe-area-inset-bottom,0px))";
  document.body.appendChild(probe);
  const h = probe.offsetHeight;
  probe.remove();
  return h;
}

export function isNativeApp(): boolean {
  return plugin() !== null;
}
