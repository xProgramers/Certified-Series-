"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthState } from "@/app/actions/auth";

const input =
  "mt-2 w-full rounded-xl border border-line bg-ink-0/60 px-4 py-3 text-paper placeholder:text-dim focus:border-gold/50 focus:outline-none";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : signup, undefined);
  const f = state?.fields ?? {};

  return (
    <form action={action} className="space-y-5" noValidate={false}>
      {mode === "signup" ? (
        <>
          <Field label="Nome no card" hint="Aparece nos seus cards. Ex.: Luan">
            <input name="displayName" required maxLength={40} defaultValue={f.displayName} className={input} autoComplete="name" />
          </Field>
          <Field label="Nome de usuário" hint="Seu perfil: /u/usuario">
            <input
              name="username"
              required
              pattern="[a-zA-Z0-9_]{3,24}"
              defaultValue={f.username}
              className={`${input} font-mono`}
              autoComplete="username"
              autoCapitalize="none"
            />
          </Field>
          <Field label="E-mail">
            <input name="email" type="email" required defaultValue={f.email} className={input} autoComplete="email" />
          </Field>
          <Field label="Senha" hint="Mínimo de 8 caracteres">
            <input name="password" type="password" required minLength={8} className={input} autoComplete="new-password" />
          </Field>
        </>
      ) : (
        <>
          {next && <input type="hidden" name="next" value={next} />}
          <Field label="Usuário ou e-mail">
            <input name="login" required defaultValue={f.login} className={input} autoComplete="username" autoCapitalize="none" />
          </Field>
          <Field label="Senha">
            <input name="password" type="password" required className={input} autoComplete="current-password" />
          </Field>
        </>
      )}

      <p role="alert" aria-live="assertive" className="min-h-5 text-sm text-danger">
        {state?.error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-paper py-3.5 text-sm font-medium text-ink-0 transition-colors hover:bg-white disabled:opacity-60"
      >
        {pending ? "Um momento…" : mode === "login" ? "Entrar" : "Criar minha coleção"}
      </button>

      <p className="text-center text-sm text-dim">
        {mode === "login" ? (
          <>
            Ainda não tem coleção?{" "}
            <Link href="/signup" className="text-paper underline-offset-4 hover:underline">
              Criar conta
            </Link>
          </>
        ) : (
          <>
            Já tem conta?{" "}
            <Link href="/login" className="text-paper underline-offset-4 hover:underline">
              Entrar
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="eyebrow">{label}</span>
        {hint && <span className="text-[11px] text-dim">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
