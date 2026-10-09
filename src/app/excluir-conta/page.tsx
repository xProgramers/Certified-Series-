import type { Metadata } from "next";
import Link from "next/link";
import { DeleteAccountForm } from "@/components/DeleteAccountForm";
import { LegalPage, Section } from "@/components/LegalPage";
import { getCurrentUser } from "@/lib/auth";
import { computeStats, getCollection } from "@/lib/data";
import { CONTACT_EMAIL, mailto } from "@/lib/site";

export const metadata: Metadata = {
  title: "Excluir conta",
  description: "Como apagar sua conta do Certified Series e todos os seus dados.",
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Also the public account-deletion URL given to Google Play, so it explains the
// process to signed-out visitors as well
export default async function DeleteAccountPage({ searchParams }: PageProps<"/excluir-conta">) {
  const { ok } = await searchParams;
  if (ok === "1") {
    return (
      <LegalPage eyebrow="Conta excluída" title="Sua coleção foi apagada." updated={false}>
        <p>Sua conta, seus cards e seus favoritos foram excluídos. Obrigado por ter passado por aqui.</p>
        <p>
          <Link href="/">Voltar ao início</Link>
        </p>
      </LegalPage>
    );
  }

  const user = await getCurrentUser();
  const total = user ? computeStats(await getCollection(user.id, { includePrivate: true })).total : 0;

  return (
    <LegalPage eyebrow="Certified Series" title="Excluir conta" updated={false}>
      <Section title="O que é apagado">
        <ul>
          <li>Sua conta: nome, nome de usuário, e-mail e senha.</li>
          <li>Todos os cards da coleção, com notas, reflexões e temporadas marcadas.</li>
          <li>Favoritos e conquistas.</li>
          <li>Seu perfil público deixa de existir na hora.</li>
        </ul>
        <p>
          A exclusão é imediata e não pode ser desfeita. Cópias de segurança dos provedores são sobrescritas em até 30
          dias. Não guardamos nenhum dado seu depois disso.
        </p>
      </Section>

      {user ? (
        <Section title={`Excluir @${user.username}`}>
          <p>
            {total > 0
              ? `Sua coleção tem ${plural(total, "obra", "obras")}. Se quiser guardar algum card, exporte antes como imagem.`
              : "Sua coleção está vazia."}
          </p>
          <DeleteAccountForm username={user.username} />
        </Section>
      ) : (
        <Section title="Como excluir">
          <ul>
            <li>
              No site ou no aplicativo: <Link href="/login?next=/excluir-conta">entre na sua conta</Link> e volte a esta
              página, ou toque em <strong>Excluir conta</strong> no rodapé.
            </li>
            <li>
              Sem acesso à conta: escreva para{" "}
              <a href={mailto("Excluir minha conta — Certified Series")}>{CONTACT_EMAIL}</a> a partir do e-mail cadastrado,
              informando seu nome de usuário. Excluímos em até 7 dias.
            </li>
          </ul>
        </Section>
      )}
    </LegalPage>
  );
}
