import { checkNewEpisodes } from "@/lib/episodes";

// Runs once a day from Vercel Cron (vercel.json). Vercel sends CRON_SECRET as a bearer token.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const report = await checkNewEpisodes();
  console.log("episode check", report);
  return Response.json(report);
}
