/** Where people write about privacy, account deletion and reported profiles. */
export const CONTACT_EMAIL = "contato@certifiedseries.app";

/** Date shown on the privacy policy and terms; bump it whenever they change. */
export const LEGAL_UPDATED_AT = "9 de outubro de 2026";

export function mailto(subject: string) {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
