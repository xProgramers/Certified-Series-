import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Criar conta" };

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(`/u/${user.username}`);
  return (
    <AuthShell title="Comece seu repertório." subtitle="Cada série que você terminar vira um card na sua coleção.">
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
