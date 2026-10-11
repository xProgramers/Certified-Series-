import "server-only";
import { eq, inArray } from "drizzle-orm";
import { importPKCS8, SignJWT } from "jose";
import { db, schema } from "@/db";

/**
 * Push to the Android app through Firebase Cloud Messaging (HTTP v1 API),
 * signed with a service account, no Firebase SDK on the server.
 * FIREBASE_SERVICE_ACCOUNT holds the service account JSON (raw or base64).
 * Without it, push is off and notifications only show in the bell.
 */
type ServiceAccount = { project_id: string; client_email: string; private_key: string };

function serviceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) return null;
  try {
    const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const sa = JSON.parse(json) as ServiceAccount;
    return sa.project_id && sa.client_email && sa.private_key ? sa : null;
  } catch {
    return null;
  }
}

export function pushConfigured() {
  return serviceAccount() !== null;
}

async function accessToken(sa: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(sa.private_key, "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/firebase.messaging" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Firebase auth ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

export type PushMessage = { userId: string; title: string; body: string; url: string };

/**
 * Sends each message to every device of its user. Tokens Firebase no longer
 * knows (app uninstalled, data cleared) are deleted. Returns how many were sent.
 */
export async function sendPush(messages: PushMessage[]) {
  const sa = serviceAccount();
  if (!sa || messages.length === 0) return 0;

  const userIds = [...new Set(messages.map((m) => m.userId))];
  const tokens = await db
    .select({ token: schema.pushTokens.token, userId: schema.pushTokens.userId })
    .from(schema.pushTokens)
    .where(inArray(schema.pushTokens.userId, userIds));
  if (tokens.length === 0) return 0;

  const bearer = await accessToken(sa);
  const endpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
  let sent = 0;

  for (const m of messages) {
    for (const t of tokens.filter((x) => x.userId === m.userId)) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            token: t.token,
            notification: { title: m.title, body: m.body },
            data: { url: m.url },
            android: { priority: "high", notification: { color: "#c9b07a", tag: m.url } },
          },
        }),
        cache: "no-store",
      }).catch(() => null);
      if (res?.ok) sent++;
      else if (res && (res.status === 404 || (await res.text()).includes("UNREGISTERED"))) {
        await db.delete(schema.pushTokens).where(eq(schema.pushTokens.token, t.token));
      }
    }
  }
  return sent;
}
