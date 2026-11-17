# Certified Series

> Seu repertório, em cartaz.

Cada série ou filme vira um **card**: o pôster, a sua nota e o que a obra significou para você.
O perfil é uma coleção cinematográfica desses cards. **O card é o produto.**

```
buscar → adicionar à coleção → em andamento (card em preto e branco)
       → concluir → nota + reflexão → o card ganha cor
       → nota ≥ 5.0: ✓ CERTIFIED   ·   nota < 5.0: ✕ NOT CERTIFIED
```

## Rodando localmente

```bash
npm install
cp .env.example .env.local      # defina AUTH_SECRET (openssl rand -base64 48)
npm run db:migrate              # cria o banco SQLite em ./data
npm run db:seed                 # opcional: coleção demo  → usuário "luan", senha "certified"
npm run dev                     # http://localhost:3000
```

### TMDB

Coloque o **API Read Access Token** (themoviedb.org → Settings → API) em `TMDB_READ_TOKEN` no `.env.local`.
Sem token, o app usa um catálogo de exemplo com ~28 séries, 12 filmes e pôsteres gerados em SVG, então todo o fluxo funciona offline.
A chave fica apenas no servidor: a busca passa por `/api/tmdb/search` e as imagens por `/api/img`.

## Stack

| Camada | Escolha |
| --- | --- |
| App | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| Estilo | Tailwind CSS v4 + CSS próprio do card (`src/components/card/content-card.css`) |
| Tipografia | Instrument Serif (títulos, nota, reflexão) · Geist (interface) · Geist Mono (metadados) |
| Banco | Drizzle ORM + libSQL: SQLite local, Turso em produção sem mudar código |
| Auth | Senha com bcrypt, sessão JWT (HS256, `jose`) em cookie httpOnly |
| Validação | zod em todas as Server Actions |
| Exportação | `html-to-image`, 100% no cliente |

## Card Renderer

- `ContentCard.tsx` é um único componente para séries e filmes (`contentType: "series" | "movie"`). HTML/CSS/SVG puro, proporção **5:8**, todo dimensionado em **unidades de container (`cqw`)**.
  O card escala como uma peça gráfica única: a mesma composição a 220px na grade, 420px no lightbox ou 1080px no PNG.
- **Tratamento do pôster:** crop por `object-position`, escurecimento no topo (legibilidade do N°), fade para a cor-base,
  vinheta radial, brilho atmosférico na junção, grão de filme e filete interno.
- **Cores dinâmicas** (`src/lib/palette.ts`): o pôster é reduzido para 48×72 num canvas, os pixels viram um histograma de matiz
  ponderado por saturação, e a cor vencedora é **domada**: acento com saturação 38–62% e luminosidade fixa, base quase preta
  com um toque do matiz. Pôsteres sem cor caem na paleta da casa (dourado). A paleta é salva no registro quando o card é criado.
- **Selo COMPLETED** circular em SVG (`textPath`), número da coleção `N° 0047`, nota em numerais serifados com régua de 10 segmentos
  (aceita meio ponto), reflexão em itálico com aspas no acento, rodapé com nome e data.
- **Estados:** *em andamento* é o mesmo card com `filter: grayscale(1)`, sem nota e sem certificação (selo `IN PROGRESS`);
  ao concluir, a cor volta numa transição de 1.8s. Concluído com nota ≥ 5.0 recebe `✓ CERTIFIED`; abaixo de 5.0, `✕ NOT CERTIFIED`
  (mesmo selo, outro glifo). A regra usa o valor exato salvo (`certificationFor` em `card-types.ts`), nunca arredondado.
- **Séries x filmes:** séries mostram temporadas; filmes mostram duração (`2H 16M`). O resto do card é idêntico.
- **Favoritos:** filete dourado duplo e `✦ FAV`, discreto.
- **Rewatch:** o selo vira `REWATCHED · 2×`.
- **Exportação** (`CardExport.tsx`): o card é renderizado de novo fora da tela num tamanho fixo e rasterizado em 2×.
  *Card*: 1080×1728. *Stories*: 1080×1920, com o pôster desfocado ao fundo. Fontes e imagens são embutidas
  (todas servidas pela mesma origem).

## Banco de dados

```
users          id, username, display_name, email, password_hash, bio, timestamps
titles         (type, id) — type "series" | "movie", id do TMDB; name, overview, poster_path, backdrop_path,
               start_year, end_year, temporadas, episódios, runtime, genres[], networks[], content_rating
               → cache compartilhado; nenhum dado da obra é duplicado por usuário
watch_entries  id, user_id, content_type, content_id, collection_number, status ("in_progress" | "completed"),
               rating_halves (0–20, null em andamento), certification_status ("certified" | "not_certified" | null),
               reflection, is_public, viewing_number, palette, added_at, completed_at, timestamps
               → uma linha por visualização: rewatch já suportado; no máximo uma em andamento por obra
favorites      (user_id, content_type, content_id), created_at
```

Nota e reflexão ficam em `watch_entries` porque pertencem a uma visualização (num rewatch, a reflexão é outra).

## Estrutura

```
src/app/                 páginas (home, search, series/[id], movies/[id], u/[username], login, signup) e rotas de API
src/app/actions/         Server Actions: auth e coleção (concluir, editar, favoritar, remover)
src/components/card/     ContentCard, CSS do card, exportação PNG
src/components/          CollectionView, CardLightbox, CompleteDialog, EntryForm, RatingInput, SearchClient…
src/lib/                 tmdb, palette, data, auth, images, catálogo de exemplo
src/db/                  schema Drizzle e cliente
scripts/seed.ts          coleção demo
```

## Anúncios (AdMob, só no app Android)

AdMob é um SDK nativo: não roda no navegador. O app Android (casca Capacitor que carrega este site) instala
`@capacitor-community/admob`, e o site conversa com ele por `window.Capacitor.Plugins.AdMob` (`src/lib/admob.ts`).
No navegador nada disso aparece.

- **Consentimento (UMP):** a cada abertura do app o Google diz se precisa pedir consentimento; se sim, mostra o formulário dele
  e guarda a resposta no aparelho. Só depois disso o SDK inicia e pede anúncios. O botão **Privacidade dos anúncios**, em Configurações e no rodapé,
  reabre o formulário (aparece só no app, quando o Google exige).
- **Banner:** no fim da página de coleção (`/u/…`), preso embaixo da tela (logo acima da barra de abas) até sair da página.
  A altura dele vira `--ad-inset` (espaço extra no fim da página) e `--ad-bottom` (onde os modais terminam).
- **IDs:** sem `NEXT_PUBLIC_ADMOB_BANNER_ID`, o app usa o banner de teste do Google e simula estar na Europa para o formulário de
  consentimento sempre aparecer. Com o ID real, tudo passa a valer de verdade.
- **app-ads.txt:** `/app-ads.txt` é gerado a partir de `ADMOB_PUBLISHER_ID` (404 enquanto não estiver definido).
- **Prévia no navegador:** `NEXT_PUBLIC_ADS_PREVIEW=1` mostra um bloco "Anúncio de teste" onde o banner ficaria.
- **No projeto Android:** o App ID (`ca-app-pub-…~…`) fica em `mobile/android/app/build.gradle` e pode ser trocado por `ADMOB_APP_ID` no build (veja `mobile/README.md`).

## Deploy (Cloudflare Workers + Turso)

O site roda num Worker do Cloudflare, montado pelo [OpenNext](https://opennext.js.org/cloudflare) (`@opennextjs/cloudflare`).
O banco continua no Turso.

- `wrangler.jsonc`: nome do Worker, bindings (`ASSETS`, `IMAGES`, `WORKER_SELF_REFERENCE`) e o cron diário (12:00 UTC).
- `worker.ts`: o Worker de verdade. Repassa as requisições ao site e, no cron, chama `/api/cron/episodes` em lotes
  (o plano grátis só deixa 50 subrequisições por requisição).
- `open-next.config.ts`: sem cache incremental (não precisa de R2).

**Variáveis.** As `NEXT_PUBLIC_*` entram no código na hora do build; as outras são lidas em tempo de execução.

| Onde | Variáveis |
| --- | --- |
| Build (Settings → Build → Variables and secrets) | `DATABASE_URL`, `DATABASE_AUTH_TOKEN` (para a migração), `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMOB_BANNER_ID` |
| Worker (Settings → Variables and Secrets) | `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `AUTH_SECRET`, `TMDB_READ_TOKEN`, `CRON_SECRET`, `FIREBASE_SERVICE_ACCOUNT`, `ADMOB_PUBLISHER_ID` |

**Deploy pelo GitHub (Workers Builds).** Em Workers & Pages → Create → Import a repository, com:
- Build command: `npm run db:migrate && npx opennextjs-cloudflare build`
- Deploy command: `npx opennextjs-cloudflare deploy`

Cada push na `main` publica. A migração roda antes do build, então as tabelas se atualizam sozinhas.

**Deploy pela máquina:** `npx wrangler login` e depois `npm run cf:deploy` (com as variáveis de build no `.env.local`).

**Testar no runtime do Cloudflare:** copie `.dev.vars.example` para `.dev.vars` e rode `npm run cf:preview`.
O Worker não abre arquivo local, então use a URL do Turso ou `turso dev`.

## Próximos passos sugeridos

- Página pública de um card (`/c/[id]`) com imagem Open Graph gerada a partir do mesmo template.
- Linha do tempo de rewatches na página da série.
- Reordenar/fixar cards favoritos no topo do perfil.
