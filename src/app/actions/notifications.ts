"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { PUSH_COOKIE } from "@/lib/notifications";

const tokenSchema = z.string().min(20).max(4096);

/** The Android app registered for push: tie this device to the signed-in user. */
export async function savePushToken(token: string) {
  const user = await getCurrentUser();
  if (!user || !tokenSchema.safeParse(token).success) return { ok: false };
  await db
    .insert(schema.pushTokens)
    .values({ token, userId: user.id, platform: "android" })
    .onConflictDoUpdate({ target: schema.pushTokens.token, set: { userId: user.id, updatedAt: new Date() } });
  (await cookies()).set(PUSH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return { ok: true };
}
