import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section } from "@/components/LegalPage";
import { CONTACT_EMAIL, mailto } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Quais dados o Certified Series guarda, para quê e como apagar.",
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Certified Series" title="Política de privacidade">
      <p>
        O Certified Series transforma as séries e filmes que você assiste em cards de uma coleção pessoal. Esta política
        explica quais dados guardamos, para quê, com quem compartilhamos e como apagar tudo. Ela vale para o site e para o
        aplicativo Android, e segue a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).
      </p>

      <Section title="Dados que guardamos">
        <ul>
          <li>
            <strong>Conta</strong>: nome no card, nome de usuário, e-mail e senha. A senha é guardada apenas como hash
            (bcrypt); ninguém, nem nós, consegue lê-la.
          </li>
          <li>
            <strong>Sua coleção</strong>: as obras que você adiciona, temporadas marcadas, notas, reflexões, favoritos,
            datas e as cores extraídas dos pôsteres para montar cada card.
          </li>
          <li>
            <strong>Sessão</strong>: um cookie (<code>cs_session</code>) que mantém você conectado por até 30 dias. A
            preferência de tema claro/escuro fica só no seu aparelho.
          </li>
          <li>
            <strong>Anúncios (só no aplicativo Android)</strong>: o Google AdMob pode usar o identificador de publicidade
            do aparelho, endereço IP e dados de uso para exibir e medir anúncios. Você escolhe se aceita anúncios
            personalizados na primeira abertura do app e pode mudar de ideia quando quiser em{" "}
            <strong>Privacidade dos anúncios</strong>, no rodapé do app.
          </li>
        </ul>
        <p>Não pedimos localização, contatos, câmera, microfone nem arquivos do seu aparelho.</p>
      </Section>

      <Section title="Para que usamos">
        <ul>
          <li>Criar e manter sua conta e sua coleção.</li>
          <li>Mostrar seu perfil público em /u/seu-usuario, com os cards que você não marcou como privados.</li>
          <li>Calcular conquistas e estatísticas da coleção.</li>
          <li>Exibir anúncios no aplicativo Android, que mantêm o app gratuito.</li>
          <li>Proteger o serviço contra abuso e responder a pedidos que você nos enviar.</li>
        </ul>
        <p>Não vendemos seus dados.</p>
      </Section>

      <Section title="O que é público">
        <p>
          Seu nome no card, nome de usuário, bio e os cards públicos da sua coleção (obra, nota, reflexão e datas) podem
          ser vistos por qualquer pessoa com o link do seu perfil. Seu e-mail nunca aparece.
        </p>
      </Section>

      <Section title="Com quem compartilhamos">
        <ul>
          <li>
            <strong>Vercel</strong> (hospedagem do site) e <strong>Turso</strong> (banco de dados), que processam os
            dados apenas para fazer o serviço funcionar.
          </li>
          <li>
            <strong>TMDB</strong> (The Movie Database), de onde vêm títulos, pôsteres, elenco e onde assistir. Enviamos ao
            TMDB apenas o que você busca, nunca dados da sua conta.
          </li>
          <li>
            <strong>Google AdMob</strong>, no aplicativo Android, conforme a{" "}
            <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
              política de anúncios do Google
            </a>
            .
          </li>
        </ul>
        <p>Esses serviços podem guardar dados fora do Brasil, com as proteções previstas na LGPD.</p>
      </Section>

      <Section title="Por quanto tempo">
        <p>
          Guardamos os dados enquanto sua conta existir. Quando você exclui a conta, apagamos na hora o perfil, a coleção e
          os favoritos. Cópias de segurança dos provedores são sobrescritas automaticamente em até 30 dias.
        </p>
      </Section>

      <Section title="Seus direitos">
        <p>
          Você pode acessar, corrigir, exportar ou apagar seus dados. Para apagar tudo, use{" "}
          <Link href="/excluir-conta">Excluir conta</Link>, dentro do site ou do aplicativo. Para os demais pedidos, escreva
          para <a href={mailto("Privacidade — Certified Series")}>{CONTACT_EMAIL}</a>.
        </p>
      </Section>

      <Section title="Crianças">
        <p>O Certified Series não é direcionado a menores de 13 anos e não coleta dados deles de propósito.</p>
      </Section>

      <Section title="Mudanças">
        <p>
          Se esta política mudar, a data no topo é atualizada. Mudanças importantes serão avisadas no site ou no aplicativo.
        </p>
      </Section>
    </LegalPage>
  );
}
