import type { ContentType } from "@/db/schema";
import { getStreamingFor } from "@/lib/tmdb";

const MAX_ITEMS = 24;
const ITEM_RE = /^(series|movie):(\d{1,10})$/;

/** ?items=series:1396,movie:603 — streaming services in Brazil for each title of a search page. */
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("items") ?? "";
  const items = raw
    .split(",")
    .slice(0, MAX_ITEMS)
    .flatMap((s) => {
      const m = ITEM_RE.exec(s.trim());
      return m ? [{ type: m[1] as ContentType, id: Number(m[2]) }] : [];
    });
  const providers = await getStreamingFor(items);
  return Response.json({ providers }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
