/**
 * app-ads.txt for AdMob. Google crawls it at the root of the developer website
 * listed on the Play Store, to confirm we're allowed to sell ads for the app.
 * Set ADMOB_PUBLISHER_ID (pub-…, or the app ID ca-app-pub-…~…) to publish it;
 * without it the route 404s rather than listing a wrong account.
 */

// Google's certification authority ID, the same for every AdMob publisher
const GOOGLE_TAG_ID = "f08c47fec0942fa0";

export function GET() {
  const match = process.env.ADMOB_PUBLISHER_ID?.match(/pub-\d+/);
  if (!match) return new Response("Not found\n", { status: 404 });
  return new Response(`google.com, ${match[0]}, DIRECT, ${GOOGLE_TAG_ID}\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
