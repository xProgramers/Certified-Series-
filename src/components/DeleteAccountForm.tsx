"use client";

import { useActionState, useState } from "react";
import { deleteAccount, type DeleteAccountState } from "@/app/actions/account";

const input =
  "mt-2 w-full rounded-xl border border-line bg-ink-0/60 px-4 py-3 text-paper placeholder:text-dim focus:border-gold/50 focus:outline-none";

export function DeleteAccountForm({ username }: { username: string }) {
  const [state, action, pending] = useActionState<DeleteAccountState, FormData>(deleteAccount, undefined);
  const [typed, setTyped] = useState("");
  const confirmed = typed.trim().toLowerCase() === username;

  return (
    <form action={action} className="space-y-5 rounded-2xl border border-line p-5 sm:p-6">
      <label className="block">
        <span className="eyebrow">Digite seu usuário para confirmar</span>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={username}
          className={`${input} font-mono`}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
        />
      </label>
      <label className="block">
        <span className="eyebrow">Senha</span>
        <input name="password" type="password" required className={input} autoComplete="current-password" />
      </label>

      <p role="alert" aria-live="assertive" className="min-h-5 text-sm text-danger">
        {state?.error}
      </p>

      <button
        type="submit"
        disabled={!confirmed || pending}
        className="w-full rounded-full bg-danger py-3.5 text-sm font-medium text-ink-0 transition-opacity disabled:opacity-40"
      >
        {pending ? "Excluindo…" : "Excluir minha conta para sempre"}
      </button>
    </form>
  );
}
