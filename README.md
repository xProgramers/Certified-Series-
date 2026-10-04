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

## Deploy (Vercel + Turso)

1. Crie o banco: `turso db create certified-series` e um token **com acesso total**: `turso db tokens create certified-series`.
2. Na Vercel, defina `DATABASE_URL` (libsql://…), `DATABASE_AUTH_TOKEN`, `AUTH_SECRET` e, quando tiver, `TMDB_READ_TOKEN`.
   A integração Turso da Vercel também funciona: ela define `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`, que o app lê como alternativa.
3. O build (`vercel.json`) roda `npm run db:migrate` antes do `next build`, então as tabelas são criadas e atualizadas sozinhas.
4. Opcional: `npm run db:seed` com essas variáveis cria a coleção demo.

## Próximos passos sugeridos

- Página pública de um card (`/c/[id]`) com imagem Open Graph gerada a partir do mesmo template.
- Linha do tempo de rewatches na página da série.
- Reordenar/fixar cards favoritos no topo do perfil.
