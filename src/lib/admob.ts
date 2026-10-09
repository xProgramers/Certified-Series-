/**
 * AdMob, through the Capacitor bridge of the Android app.
 *
 * AdMob is a native SDK: it never runs in a browser. The Android app is a
 * Capacitor shell that loads this site, and `@capacitor-community/admob`
 * (installed in that shell) exposes itself as `window.Capacitor.Plugins.AdMob`.
 * This module only talks to that object, so the site needs no Capacitor
 * dependency and everything here is a no-op on the web.
 *
 * Flow on each app launch (Google's recommended order): ask UMP for the
 * consent status, show the consent form when it's required, then start the
 * SDK and request ads only if UMP says we can.
 */

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

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  Plugins?: { AdMob?: AdMobPlugin };
};

/** UMP's debug geography value for "pretend this device is in the EEA". */
const DEBUG_GEOGRAPHY_EEA = 1;

function plugin(): AdMobPlugin | null {
  if (typeof window === "undefined") return null;
  const cap = (window as { Capacitor?: CapacitorGlobal }).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  return cap.Plugins?.AdMob ?? null;
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
 * Native banners float over the WebView at the bottom of the screen; the page
 * gets the same height as bottom padding (--ad-inset) so nothing hides under it.
 * Returns a cleanup that removes the banner.
 */
export async function showBottomBanner(): Promise<() => void> {
  const admob = plugin();
  const { canRequestAds } = await startAds();
  if (!admob || !canRequestAds) return () => {};

  const root = document.documentElement;
  const sub = await admob.addListener("bannerAdSizeChanged", ({ height }) => {
    root.style.setProperty("--ad-inset", `${height}px`);
  });
  await admob.showBanner({
    adId: ADS.bannerId,
    adSize: "ADAPTIVE_BANNER",
    position: "BOTTOM_CENTER",
    margin: 0,
    isTesting: ADS.testing,
  });
  return () => {
    sub.remove();
    root.style.removeProperty("--ad-inset");
    admob.removeBanner().catch(() => {});
  };
}

export function isNativeApp(): boolean {
  return plugin() !== null;
}
