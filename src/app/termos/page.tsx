import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section } from "@/components/LegalPage";
import { CONTACT_EMAIL, mailto } from "@/lib/site";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Certified Series" title="Termos de uso">
      <p>
        Ao criar uma conta no Certified Series, no site ou no aplicativo, você concorda com estes termos. Como tratamos
        seus dados está na <Link href="/privacidade">política de privacidade</Link>.
      </p>

      <Section title="Sua conta">
        <p>
          Você precisa ter pelo menos 13 anos. Cuide da sua senha: o que for feito com a sua conta é responsabilidade sua.
          Você pode excluir a conta quando quiser em <Link href="/excluir-conta">Excluir conta</Link>.
        </p>
      </Section>

      <Section title="O que você publica">
        <p>
          Nome, bio e reflexões dos cards públicos ficam visíveis para outras pessoas. Não publique conteúdo ofensivo,
          discriminatório, sexual, violento, spam ou que viole direitos de alguém, nem se passe por outra pessoa. Podemos
          remover conteúdo ou contas que desrespeitem estas regras.
        </p>
        <p>
          Viu um perfil que desrespeita as regras? Use <strong>Denunciar perfil</strong>, no fim da página dele, ou escreva
          para <a href={mailto("Denúncia — Certified Series")}>{CONTACT_EMAIL}</a>.
        </p>
      </Section>

      <Section title="Conteúdo de terceiros">
        <p>
          Títulos, pôsteres, elenco e informações de onde assistir vêm do TMDB e do JustWatch e pertencem aos seus donos. O
          Certified Series não é afiliado a nenhum estúdio, emissora ou serviço de streaming. Este produto usa a API do TMDB,
          mas não é endossado nem certificado pelo TMDB.
        </p>
      </Section>

      <Section title="O serviço">
        <p>
          O Certified Series é oferecido como está, sem garantia de funcionamento contínuo. O aplicativo Android pode
          exibir anúncios. Podemos mudar ou encerrar recursos, avisando com antecedência quando afetarem sua coleção.
        </p>
      </Section>

      <Section title="Contato">
        <p>
          <a href={mailto("Certified Series")}>{CONTACT_EMAIL}</a>
        </p>
      </Section>
    </LegalPage>
  );
}
