import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { ThemePicker } from "@/components/ThemePicker";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Configurações" };

const rowBase = "flex items-center justify-between gap-4 py-4 text-[15px] transition-colors";
const row = `${rowBase} text-paper hover:text-gold`;

function Chevron() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-dim" aria-hidden>
      <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="eyebrow mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-xl px-4 pb-24 pt-10 sm:px-8 sm:pt-16">
      <h1 className="font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">Configurações</h1>

      <Group title="Aparência">
        <ThemePicker />
      </Group>

      {user ? (
        <Group title="Conta">
          <div className="divide-y divide-line border-y border-line">
            <div className="py-4">
              <p className="font-serif text-2xl leading-none">{user.displayName}</p>
              <p className="mt-1.5 font-mono text-xs text-dim">
                @{user.username} · {user.email}
              </p>
            </div>
            <Link href={`/u/${user.username}`} className={row}>
              Minha coleção
              <Chevron />
            </Link>
            <Link href={`/u/${user.username}/conquistas`} className={row}>
              Conquistas
              <Chevron />
            </Link>
            <form action={logout}>
              <button type="submit" className={`${row} w-full text-left`}>
                Sair da conta
                <Chevron />
              </button>
            </form>
          </div>
        </Group>
      ) : (
        <Group title="Conta">
          <div className="flex gap-2">
            <Link href="/login" className="rounded-full border border-line-strong px-5 py-2.5 text-sm text-paper hover:border-gold/50">
              Entrar
            </Link>
            <Link href="/signup" className="rounded-full bg-paper px-5 py-2.5 text-sm text-ink-0 hover:bg-hi">
              Criar conta
            </Link>
          </div>
        </Group>
      )}

      <Group title="Sobre">
        <div className="divide-y divide-line border-y border-line">
          <Link href="/privacidade" className={row}>
            Política de privacidade
            <Chevron />
          </Link>
          <Link href="/termos" className={row}>
            Termos de uso
            <Chevron />
          </Link>
          {user && (
            <Link href="/excluir-conta" className={`${rowBase} text-mute hover:text-danger`}>
              Excluir conta
              <Chevron />
            </Link>
          )}
        </div>
      </Group>
    </div>
  );
}
