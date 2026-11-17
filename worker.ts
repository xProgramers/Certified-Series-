/**
 * The Worker Cloudflare runs: the site as OpenNext builds it, plus the daily
 * new-episode check (cron trigger in wrangler.jsonc).
 *
 * A Worker on the free plan may make only 50 subrequests (TMDB, Turso, Firebase
 * calls) per request, so the cron doesn't do the whole check in one go: it asks
 * the site for /api/cron/episodes one batch at a time through the
 * WORKER_SELF_REFERENCE binding, and each batch is a request of its own.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore `.open-next/worker.js` only exists after `opennextjs-cloudflare build`
import { default as handler } from "./.open-next/worker.js";

type Env = {
  CRON_SECRET?: string;
  WORKER_SELF_REFERENCE: { fetch(req: Request): Promise<Response> };
};

/**
 * A request may wake at most 32 Workers through service bindings, so the cron
 * makes at most 30 calls: with the default 5 series a batch, 150 running
 * series. Past that the rest is skipped and a warning is logged; on the paid
 * plan (10,000 subrequests) raise EPISODE_BATCH, e.g. to 100.
 */
const MAX_BATCHES = 30;

const worker = {
  fetch: handler.fetch,

  async scheduled(_event: unknown, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) {
    ctx.waitUntil(runEpisodeCheck(env));
  },
};

export default worker;

async function runEpisodeCheck(env: Env) {
  if (!env.CRON_SECRET) {
    console.warn("episode check skipped: CRON_SECRET is not set");
    return;
  }
  let from: number | null = 0;
  for (let i = 0; from !== null && i < MAX_BATCHES; i++) {
    const res = await env.WORKER_SELF_REFERENCE.fetch(
      new Request(`https://self/api/cron/episodes?from=${from}`, {
        headers: { authorization: `Bearer ${env.CRON_SECRET}` },
      }),
    );
    if (!res.ok) {
      console.error("episode check failed", from, res.status, await res.text());
      return;
    }
    const report = (await res.json()) as { next: number | null };
    console.log("episode check", report);
    from = report.next;
  }
  if (from !== null) console.warn(`episode check stopped at series ${from}: raise EPISODE_BATCH`);
}
