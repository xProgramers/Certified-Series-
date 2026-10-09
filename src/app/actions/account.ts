"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { destroySession, getCurrentUser } from "@/lib/auth";

export type DeleteAccountState = { error?: string } | undefined;

/**
 * Deletes the signed-in account and everything it owns. The password is asked
 * again so a borrowed, still signed-in phone can't wipe someone's collection.
 */
export async function deleteAccount(_: DeleteAccountState, form: FormData): Promise<DeleteAccountState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sessão expirada. Entre de novo para excluir a conta." };

  const password = form.get("password");
  if (typeof password !== "string" || !password) return { error: "Digite sua senha para confirmar." };

  const row = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
    columns: { passwordHash: true },
  });
  if (!row || !(await bcrypt.compare(password, row.passwordHash))) return { error: "Senha incorreta." };

  // Explicit deletes instead of relying on ON DELETE CASCADE, which SQLite
  // only honours when foreign_keys is switched on for the connection
  await db.batch([
    db.delete(schema.favorites).where(eq(schema.favorites.userId, user.id)),
    db.delete(schema.userAchievements).where(eq(schema.userAchievements.userId, user.id)),
    db.delete(schema.watchEntries).where(eq(schema.watchEntries.userId, user.id)),
    db.delete(schema.users).where(eq(schema.users.id, user.id)),
  ]);
  await destroySession();
  redirect("/excluir-conta?ok=1");
}
