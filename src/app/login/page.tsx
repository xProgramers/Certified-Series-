import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getCurrentUser();
  if (user) redirect(`/u/${user.username}`);
  const { next } = await searchParams;
  return (
    <AuthShell title="De volta à sua coleção." subtitle="Entre para continuar certificando o que você assistiu.">
      <AuthForm mode="login" next={typeof next === "string" ? next : undefined} />
    </AuthShell>
  );
}
