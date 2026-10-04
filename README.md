# Certified Series

> Seu repertório, em cartaz.

Cada série que você termina vira um **card**: o pôster, a sua nota e o que a obra significou para você.
O perfil é uma coleção cinematográfica desses cards. **O card é o produto.**

## Rodando localmente

```bash
npm install
cp .env.example .env.local      # defina AUTH_SECRET (openssl rand -base64 48)
npm run db:push                 # cria o banco SQLite em ./data
npm run db:seed                 # opcional: coleção demo  → usuário "luan", senha "certified"
npm run dev                     # http://localhost:3000
```

### TMDB

Coloque o **API Read Access Token** (themoviedb.org → Settings → API) em `TMDB_READ_TOKEN` no `.env.local`.
Sem token, o app usa um catálogo de exemplo com ~28 séries e pôsteres gerados em SVG, então todo o fluxo funciona offline.
A chave fica apenas no servidor: a busca passa por `/api/tmdb/search` e as imagens por `/api/img`.

## Stack

| Camada | Escolha |
| --- | --- |
| App | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| Estilo | Tailwind CSS v4 + CSS próprio do card (`src/components/card/series-card.css`) |
| Tipografia | Instrument Serif (títulos, nota, reflexão) · Geist (interface) · Geist Mono (metadados) |
| Banco | Drizzle ORM + libSQL: SQLite local, Turso em produção sem mudar código |
| Auth | Senha com bcrypt, sessão JWT (HS256, `jose`) em cookie httpOnly |
| Validação | zod em todas as Server Actions |
| Exportação | `html-to-image`, 100% no cliente |

## Card Renderer

- `SeriesCard.tsx` é HTML/CSS/SVG puro, proporção **5:8**, todo dimensionado em **unidades de container (`cqw`)**.
  O card escala como uma peça gráfica única: a mesma composição a 220px na grade, 420px no lightbox ou 1080px no PNG.
- **Tratamento do pôster:** crop por `object-position`, escurecimento no topo (legibilidade do N°), fade para a cor-base,
  vinheta radial, brilho atmosférico na junção, grão de filme e filete interno.
- **Cores dinâmicas** (`src/lib/palette.ts`): o pôster é reduzido para 48×72 num canvas, os pixels viram um histograma de matiz
  ponderado por saturação, e a cor vencedora é **domada**: acento com saturação 38–62% e luminosidade fixa, base quase preta
  com um toque do matiz. Pôsteres sem cor caem na paleta da casa (dourado). A paleta é salva no registro quando o card é criado.
- **Selo COMPLETED** circular em SVG (`textPath`), número da coleção `N° 0047`, nota em numerais serifados com régua de 10 segmentos
  (aceita meio ponto), reflexão em itálico com aspas no acento, rodapé com nome e data.
- **Favoritos:** filete dourado duplo e `✦ FAV`, discreto.
- **Rewatch:** o selo vira `REWATCHED · 2×`.
- **Exportação** (`CardExport.tsx`): o card é renderizado de novo fora da tela num tamanho fixo e rasterizado em 2×.
  *Card*: 1080×1728. *Stories*: 1080×1920, com o pôster desfocado ao fundo. Fontes e imagens são embutidas
  (todas servidas pela mesma origem).

## Banco de dados

```
users          id, username, display_name, email, password_hash, bio, timestamps
series         id (TMDB), name, overview, poster_path, backdrop_path, anos, temporadas, episódios, genres[], networks[]
               → cache compartilhado; nenhum dado da série é duplicado por usuário
watch_entries  id, user_id, series_id, collection_number, rating_halves (0–20), reflection, is_public,
               viewing_number, palette, watched_at, timestamps
               → uma linha por visualização: rewatch já suportado
favorites      (user_id, series_id), created_at
```

Nota e reflexão ficam em `watch_entries` porque pertencem a uma visualização (num rewatch, a reflexão é outra).

## Estrutura

```
src/app/                 páginas (home, search, series/[id], u/[username], login, signup) e rotas de API
src/app/actions/         Server Actions: auth e coleção (concluir, editar, favoritar, remover)
src/components/card/     SeriesCard, CSS do card, exportação PNG
src/components/          CollectionView, CardLightbox, CompleteDialog, EntryForm, RatingInput, SearchClient…
src/lib/                 tmdb, palette, data, auth, images, catálogo de exemplo
src/db/                  schema Drizzle e cliente
scripts/seed.ts          coleção demo
```

## Deploy (Vercel + Turso)

1. `turso db create certified-series` e gere um token.
2. Na Vercel, defina `DATABASE_URL` (libsql://…), `DATABASE_AUTH_TOKEN`, `AUTH_SECRET` e `TMDB_READ_TOKEN`.
3. `npm run db:push` apontando para o Turso.

## Próximos passos sugeridos

- Página pública de um card (`/c/[id]`) com imagem Open Graph gerada a partir do mesmo template.
- Linha do tempo de rewatches na página da série.
- Reordenar/fixar cards favoritos no topo do perfil.
