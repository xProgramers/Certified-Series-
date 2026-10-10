"use server";

import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { createSession, destroySession } from "@/lib/auth";
import { PUSH_COOKIE } from "@/lib/notifications";

export type AuthState = { error?: string; fields?: Record<string, string> } | undefined;

const signupSchema = z.object({
  displayName: z.string().trim().min(1, "Diga como quer ser chamado.").max(40),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, "Use de 3 a 24 letras, números ou _."),
  email: z.string().trim().toLowerCase().email("E-mail inválido.").max(200),
  password: z.string().min(8, "A senha precisa de pelo menos 8 caracteres.").max(200),
});

// Compared against when the account doesn't exist, so response time doesn't reveal it
const DUMMY_HASH = bcrypt.hashSync("certified-series-dummy", 12);

const RESERVED = new Set(["admin", "api", "login", "signup", "search", "series", "profile", "settings", "u"]);

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const raw = Object.fromEntries(form) as Record<string, string>;
  const parsed = signupSchema.safeParse(raw);
  const fields = { displayName: raw.displayName ?? "", username: raw.username ?? "", email: raw.email ?? "" };
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields };
  const { displayName, username, email, password } = parsed.data;
  if (RESERVED.has(username)) return { error: "Esse nome de usuário não está disponível.", fields };

  const existing = await db.query.users.findFirst({
    where: or(eq(schema.users.username, username), eq(schema.users.email, email)),
    columns: { username: true },
  });
  if (existing) {
    return {
      error: existing.username === username ? "Esse nome de usuário já existe." : "Já existe uma conta com esse e-mail.",
      fields,
    };
  }

  const id = crypto.randomUUID();
  await db.insert(schema.users).values({
    id,
    username,
    displayName,
    email,
    passwordHash: await bcrypt.hash(password, 12),
  });
  await createSession(id);
  redirect("/search?welcome=1");
}

const loginSchema = z.object({
  login: z.string().trim().toLowerCase().min(1).max(200),
  password: z.string().min(1).max(200),
});

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const raw = Object.fromEntries(form) as Record<string, string>;
  const parsed = loginSchema.safeParse(raw);
  const fields = { login: raw.login ?? "" };
  if (!parsed.success) return { error: "Preencha usuário e senha.", fields };
  const { login: who, password } = parsed.data;

  const user = await db.query.users.findFirst({
    where: or(eq(schema.users.username, who), eq(schema.users.email, who)),
  });
  // Always run bcrypt so timing doesn't reveal which accounts exist
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { error: "Usuário ou senha incorretos.", fields };

  await createSession(user.id);
  const next = typeof raw.next === "string" && raw.next.startsWith("/") && !raw.next.startsWith("//") ? raw.next : "/";
  redirect(next);
}

export async function logout() {
  // This device stops getting the account's push notifications
  const jar = await cookies();
  const pushToken = jar.get(PUSH_COOKIE)?.value;
  if (pushToken) {
    await db.delete(schema.pushTokens).where(eq(schema.pushTokens.token, pushToken));
    jar.delete(PUSH_COOKIE);
  }
  await destroySession();
  redirect("/");
}
