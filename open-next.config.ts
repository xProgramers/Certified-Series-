import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * No incremental cache on purpose: the app has no ISR pages, and an R2 bucket
 * would need billing turned on in the Cloudflare account. TMDB calls with
 * `next.revalidate` simply go to TMDB each time, which is fine at this size.
 */
export default defineCloudflareConfig({});
