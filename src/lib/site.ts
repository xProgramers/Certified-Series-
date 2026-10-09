/** Where people write about privacy, account deletion and reported profiles. */
export const CONTACT_EMAIL = "mpotal@hotmail.com";

/** Date shown on the privacy policy and terms; bump it whenever they change. */
export const LEGAL_UPDATED_AT = "9 de outubro de 2026";

export function mailto(subject: string) {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

/**
 * Public address of the site, for the absolute URLs social previews need.
 * NEXT_PUBLIC_SITE_URL overrides it (a custom domain).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://certified-series.vercel.app").replace(/\/$/, "");

