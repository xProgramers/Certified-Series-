import { checkNewEpisodes } from "@/lib/episodes";

/**
 * The daily new-episode check. The Cloudflare cron (worker.ts) calls it with
 * CRON_SECRET as a bearer token, one batch at a time: `?from=N` checks a few
 * series starting at N and answers with `next`, the offset of the next batch
 * (null when done). A Worker on the free plan may only make 50 subrequests per
 * request, so the whole check can't run in one.
 */
export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Series per request: ~6 subrequests each fit the free plan's 50. On the paid plan it can be much higher.
// Never served from the Worker cache: each batch has to really run
const NO_STORE = { "Cache-Control": "no-store" };

const BATCH = Math.max(1, Number(process.env.EPISODE_BATCH) || 5);

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }
  const from = Math.max(0, Number(new URL(req.url).searchParams.get("from")) || 0);
  const report = await checkNewEpisodes(from, BATCH);
  console.log("episode check", report);
  return Response.json(report, { headers: NO_STORE });
}
