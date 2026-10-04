import type { ContentType } from "@/db/schema";

/**
 * Sample catalog used when no TMDB token is configured, so the whole product
 * (search, title pages, cards, export) can be developed and previewed.
 * Posters are generated as SVG art by /api/mock-poster/[id].
 */
export type MockMotif =
  | "sun"
  | "stripes"
  | "orbit"
  | "grid"
  | "peaks"
  | "waves"
  | "door"
  | "eye"
  | "crown"
  | "tower";

export type MockTitle = {
  type: ContentType;
  id: number;
  name: string;
  originalName?: string;
  overview: string;
  firstAirYear: number;
  lastAirYear?: number;
  /** Series only */
  seasons?: number;
  episodes?: number;
  /** Movies only, minutes */
  runtime?: number;
  contentRating?: string;
  genres: string[];
  networks: string[];
  status: string;
  /** [background, mid, highlight] */
  colors: [string, string, string];
  motif: MockMotif;
};

type MockSeries = Omit<MockTitle, "type">;

const MOCK_SERIES: MockSeries[] = [
  { id: 1396, name: "Breaking Bad", overview: "Um professor de química com câncer terminal passa a produzir metanfetamina para garantir o futuro da família e descobre quem realmente é.", firstAirYear: 2008, lastAirYear: 2013, seasons: 5, episodes: 62, genres: ["Drama", "Crime"], networks: ["AMC"], status: "Ended", colors: ["#1c2a14", "#6f8a2a", "#e8d36a"], motif: "sun" },
  { id: 1399, name: "Game of Thrones", overview: "Famílias nobres disputam o Trono de Ferro enquanto uma ameaça antiga desperta além da Muralha.", firstAirYear: 2011, lastAirYear: 2019, seasons: 8, episodes: 73, genres: ["Drama", "Fantasia", "Aventura"], networks: ["HBO"], status: "Ended", colors: ["#0f1418", "#3c4f5c", "#c9d6df"], motif: "crown" },
  { id: 95396, name: "Severance", overview: "Funcionários da Lumon passam por um procedimento que separa suas memórias do trabalho das memórias da vida pessoal.", firstAirYear: 2022, seasons: 2, episodes: 19, genres: ["Drama", "Mistério", "Ficção científica"], networks: ["Apple TV+"], status: "Returning Series", colors: ["#0b1f2a", "#1f5c6e", "#d9eef2"], motif: "grid" },
  { id: 87108, name: "Chernobyl", overview: "A história da explosão nuclear de 1986 e dos homens e mulheres que se sacrificaram para salvar a Europa.", firstAirYear: 2019, seasons: 1, episodes: 5, genres: ["Drama", "História"], networks: ["HBO"], status: "Ended", colors: ["#141812", "#4d5a3a", "#d8e0a0"], motif: "tower" },
  { id: 66732, name: "Stranger Things", overview: "Em uma pequena cidade dos anos 80, o desaparecimento de um garoto revela experimentos secretos e um mundo paralelo.", firstAirYear: 2016, lastAirYear: 2025, seasons: 5, episodes: 42, genres: ["Drama", "Mistério", "Ficção científica"], networks: ["Netflix"], status: "Ended", colors: ["#16070a", "#8a1c24", "#ff6b5a"], motif: "door" },
  { id: 76479, name: "The Boys", overview: "Um grupo de justiceiros enfrenta super-heróis corruptos que abusam da fama e do poder.", firstAirYear: 2019, seasons: 5, episodes: 40, genres: ["Ação", "Comédia", "Crime"], networks: ["Prime Video"], status: "Ended", colors: ["#100d0d", "#7a1a1a", "#f0c8a0"], motif: "eye" },
  { id: 100088, name: "The Last of Us", overview: "Vinte anos após o colapso da civilização, um sobrevivente endurecido é contratado para tirar uma garota de uma zona de quarentena.", firstAirYear: 2023, seasons: 2, episodes: 16, genres: ["Drama", "Ação", "Aventura"], networks: ["HBO"], status: "Returning Series", colors: ["#121a14", "#4a6b4c", "#e6c98a"], motif: "peaks" },
  { id: 136315, name: "The Bear", overview: "Um jovem chef de alta gastronomia volta a Chicago para assumir a lanchonete da família após uma tragédia.", firstAirYear: 2022, seasons: 4, episodes: 38, genres: ["Drama", "Comédia"], networks: ["FX"], status: "Returning Series", colors: ["#1a1410", "#2f5a8a", "#f2e6d0"], motif: "stripes" },
  { id: 1100, name: "How I Met Your Mother", overview: "Em 2030, Ted conta aos filhos a longa história de como conheceu a mãe deles.", firstAirYear: 2005, lastAirYear: 2014, seasons: 9, episodes: 208, genres: ["Comédia"], networks: ["CBS"], status: "Ended", colors: ["#1a1020", "#a0466a", "#ffd1a8"], motif: "sun" },
  { id: 60059, name: "Better Call Saul", overview: "A transformação do advogado Jimmy McGill no inescrupuloso Saul Goodman.", firstAirYear: 2015, lastAirYear: 2022, seasons: 6, episodes: 63, genres: ["Drama", "Crime"], networks: ["AMC"], status: "Ended", colors: ["#1e1608", "#b8862a", "#f6e2a8"], motif: "stripes" },
  { id: 46648, name: "True Detective", overview: "Investigações policiais que expõem os segredos e as obsessões de quem as conduz.", firstAirYear: 2014, seasons: 4, episodes: 30, genres: ["Drama", "Crime", "Mistério"], networks: ["HBO"], status: "Returning Series", colors: ["#100c08", "#6a4a2a", "#e0b070"], motif: "eye" },
  { id: 70523, name: "Dark", originalName: "Dark", overview: "O desaparecimento de duas crianças expõe as relações entre quatro famílias e um ciclo que se repete a cada 33 anos.", firstAirYear: 2017, lastAirYear: 2020, seasons: 3, episodes: 26, genres: ["Drama", "Mistério", "Ficção científica"], networks: ["Netflix"], status: "Ended", colors: ["#0a0d10", "#3a4a58", "#b8c8d4"], motif: "orbit" },
  { id: 1438, name: "The Wire", overview: "Um retrato da cidade de Baltimore através do tráfico, da polícia, do porto, da política, das escolas e da imprensa.", firstAirYear: 2002, lastAirYear: 2008, seasons: 5, episodes: 60, genres: ["Drama", "Crime"], networks: ["HBO"], status: "Ended", colors: ["#0e1012", "#2e4a6a", "#d4dce4"], motif: "grid" },
  { id: 1668, name: "Friends", overview: "Seis amigos atravessam os anos 90 em Nova York entre amores, empregos e um sofá laranja.", firstAirYear: 1994, lastAirYear: 2004, seasons: 10, episodes: 236, genres: ["Comédia"], networks: ["NBC"], status: "Ended", colors: ["#20140c", "#c8602a", "#ffe0b0"], motif: "door" },
  { id: 76331, name: "Succession", overview: "A família Roy disputa o controle de um dos maiores conglomerados de mídia do mundo.", firstAirYear: 2018, lastAirYear: 2023, seasons: 4, episodes: 39, genres: ["Drama"], networks: ["HBO"], status: "Ended", colors: ["#0c0e10", "#5a5446", "#e8dcc0"], motif: "tower" },
  { id: 42009, name: "Black Mirror", overview: "Histórias independentes sobre o lado sombrio da tecnologia e da natureza humana.", firstAirYear: 2011, seasons: 7, episodes: 33, genres: ["Drama", "Ficção científica"], networks: ["Netflix"], status: "Returning Series", colors: ["#08090a", "#2a2e34", "#9ad0ff"], motif: "orbit" },
  { id: 1408, name: "House", overview: "Um médico genial e misantropo lidera uma equipe de diagnóstico em casos que ninguém consegue resolver.", firstAirYear: 2004, lastAirYear: 2012, seasons: 8, episodes: 177, genres: ["Drama", "Mistério"], networks: ["FOX"], status: "Ended", colors: ["#0c1418", "#2a6a7a", "#c8f0f0"], motif: "waves" },
  { id: 93405, name: "Round 6", originalName: "오징어 게임", overview: "Centenas de pessoas endividadas aceitam participar de jogos infantis com um prêmio bilionário e regras mortais.", firstAirYear: 2021, lastAirYear: 2025, seasons: 3, episodes: 22, genres: ["Drama", "Ação", "Mistério"], networks: ["Netflix"], status: "Ended", colors: ["#140a10", "#c23a6a", "#3ac2a0"], motif: "grid" },
  { id: 84958, name: "Loki", overview: "Após roubar o Tesseract, o deus da trapaça é levado pela Autoridade de Variância Temporal.", firstAirYear: 2021, lastAirYear: 2023, seasons: 2, episodes: 12, genres: ["Ficção científica", "Fantasia"], networks: ["Disney+"], status: "Ended", colors: ["#0e1408", "#4a7a20", "#e0c040"], motif: "orbit" },
  { id: 2316, name: "The Office", overview: "O cotidiano dos funcionários de uma filial de uma empresa de papel em Scranton, Pensilvânia.", firstAirYear: 2005, lastAirYear: 2013, seasons: 9, episodes: 201, genres: ["Comédia"], networks: ["NBC"], status: "Ended", colors: ["#141618", "#5a6a7a", "#f0f0e8"], motif: "stripes" },
  { id: 71912, name: "The Witcher", overview: "Geralt de Rívia, um caçador de monstros mutante, luta para encontrar seu lugar num mundo onde pessoas são mais perversas que feras.", firstAirYear: 2019, seasons: 4, episodes: 32, genres: ["Drama", "Fantasia", "Ação"], networks: ["Netflix"], status: "Returning Series", colors: ["#0c0c10", "#4a4a6a", "#d0d0e8"], motif: "peaks" },
  { id: 67744, name: "Mindhunter", overview: "No fim dos anos 70, dois agentes do FBI entrevistam assassinos em série para entender como eles pensam.", firstAirYear: 2017, lastAirYear: 2019, seasons: 2, episodes: 19, genres: ["Drama", "Crime"], networks: ["Netflix"], status: "Ended", colors: ["#121410", "#5a6a3a", "#e8e0b0"], motif: "eye" },
  { id: 125988, name: "Silo", overview: "Os últimos dez mil sobreviventes vivem num silo gigante, sem saber quem o construiu nem o que existe lá fora.", firstAirYear: 2023, seasons: 2, episodes: 20, genres: ["Drama", "Ficção científica"], networks: ["Apple TV+"], status: "Returning Series", colors: ["#0e0c0a", "#6a5a40", "#f0d8a0"], motif: "tower" },
  { id: 94997, name: "House of the Dragon", overview: "Duzentos anos antes de Game of Thrones, a casa Targaryen se divide numa guerra civil.", firstAirYear: 2022, seasons: 2, episodes: 18, genres: ["Drama", "Fantasia"], networks: ["HBO"], status: "Returning Series", colors: ["#140808", "#8a2a1a", "#f0a060"], motif: "crown" },
  { id: 4607, name: "Lost", overview: "Sobreviventes de um acidente aéreo numa ilha misteriosa precisam aprender a conviver e a sobreviver.", firstAirYear: 2004, lastAirYear: 2010, seasons: 6, episodes: 118, genres: ["Drama", "Mistério", "Aventura"], networks: ["ABC"], status: "Ended", colors: ["#081410", "#1a6a5a", "#e0f0c0"], motif: "waves" },
  { id: 1405, name: "Dexter", overview: "Um perito forense da polícia de Miami leva uma vida dupla como assassino de assassinos.", firstAirYear: 2006, lastAirYear: 2013, seasons: 8, episodes: 96, genres: ["Drama", "Crime", "Mistério"], networks: ["Showtime"], status: "Ended", colors: ["#160808", "#9a1a1a", "#f8d8d0"], motif: "waves" },
  { id: 110316, name: "Alice in Borderland", overview: "Um jovem e seus amigos se veem numa Tóquio deserta, obrigados a vencer jogos perigosos para sobreviver.", firstAirYear: 2020, seasons: 3, episodes: 22, genres: ["Ação", "Mistério", "Ficção científica"], networks: ["Netflix"], status: "Ended", colors: ["#0c0a14", "#5a3a9a", "#f0d0ff"], motif: "door" },
  { id: 90462, name: "Chucky", overview: "Um boneco assassino ressurge numa venda de garagem e espalha caos numa cidadezinha americana.", firstAirYear: 2021, lastAirYear: 2024, seasons: 3, episodes: 24, genres: ["Crime", "Mistério"], networks: ["SYFY"], status: "Ended", colors: ["#140c06", "#c2501a", "#ffd890"], motif: "sun" },
];

// Movies use the network field for the studio/distributor shown on the generated poster
const MOCK_MOVIES: MockSeries[] = [
  { id: 603, name: "Matrix", originalName: "The Matrix", overview: "Um hacker descobre que a realidade em que vive é uma simulação e é recrutado para a guerra contra as máquinas que a controlam.", firstAirYear: 1999, runtime: 136, contentRating: "14", genres: ["Ação", "Ficção científica"], networks: ["Warner Bros."], status: "Released", colors: ["#06120a", "#1f6a3a", "#9af0b0"], motif: "grid" },
  { id: 27205, name: "A Origem", originalName: "Inception", overview: "Um ladrão que invade sonhos recebe a missão inversa: plantar uma ideia na mente de alguém.", firstAirYear: 2010, runtime: 148, contentRating: "14", genres: ["Ação", "Ficção científica", "Aventura"], networks: ["Warner Bros."], status: "Released", colors: ["#0c1016", "#3a5a7a", "#e0d0b0"], motif: "tower" },
  { id: 496243, name: "Parasita", originalName: "기생충", overview: "Uma família pobre se infiltra, um a um, na casa de uma família rica, até que um segredo no porão muda tudo.", firstAirYear: 2019, runtime: 133, contentRating: "16", genres: ["Comédia", "Thriller", "Drama"], networks: ["CJ Entertainment"], status: "Released", colors: ["#121410", "#5a6a4a", "#f0e8c8"], motif: "stripes" },
  { id: 157336, name: "Interestelar", originalName: "Interstellar", overview: "Com a Terra morrendo, um grupo de exploradores atravessa um buraco de minhoca em busca de um novo lar para a humanidade.", firstAirYear: 2014, runtime: 169, contentRating: "10", genres: ["Aventura", "Drama", "Ficção científica"], networks: ["Paramount"], status: "Released", colors: ["#0a0a0e", "#3a3a5a", "#f0e0c0"], motif: "orbit" },
  { id: 238, name: "O Poderoso Chefão", originalName: "The Godfather", overview: "O patriarca de uma dinastia do crime organizado transfere o controle do seu império ao filho relutante.", firstAirYear: 1972, runtime: 175, contentRating: "14", genres: ["Drama", "Crime"], networks: ["Paramount"], status: "Released", colors: ["#100a06", "#6a3a1a", "#e8c080"], motif: "crown" },
  { id: 129, name: "A Viagem de Chihiro", originalName: "千と千尋の神隠し", overview: "Uma menina entra num mundo de espíritos e precisa trabalhar numa casa de banhos para salvar os pais.", firstAirYear: 2001, runtime: 125, contentRating: "L", genres: ["Animação", "Família", "Fantasia"], networks: ["Studio Ghibli"], status: "Released", colors: ["#0a1418", "#2a7a8a", "#ffd0a0"], motif: "waves" },
  { id: 680, name: "Pulp Fiction", overview: "Histórias de crime em Los Angeles se cruzam numa narrativa fora de ordem, entre gângsteres, boxeadores e uma maleta misteriosa.", firstAirYear: 1994, runtime: 154, contentRating: "18", genres: ["Thriller", "Crime"], networks: ["Miramax"], status: "Released", colors: ["#140a08", "#b8401a", "#ffd060"], motif: "sun" },
  { id: 872585, name: "Oppenheimer", overview: "A história do físico que liderou o projeto que criou a bomba atômica, e do peso que isso deixou.", firstAirYear: 2023, runtime: 180, contentRating: "16", genres: ["Drama", "História"], networks: ["Universal"], status: "Released", colors: ["#140a04", "#a04a10", "#ffd890"], motif: "sun" },
  { id: 438631, name: "Duna", originalName: "Dune", overview: "O herdeiro de uma casa nobre chega ao planeta mais perigoso do universo, fonte da substância mais valiosa que existe.", firstAirYear: 2021, runtime: 155, contentRating: "14", genres: ["Ficção científica", "Aventura"], networks: ["Legendary"], status: "Released", colors: ["#1a1008", "#a0703a", "#f8e0b0"], motif: "peaks" },
  { id: 13, name: "Forrest Gump", overview: "Um homem simples atravessa décadas da história americana sem perder a bondade nem o amor de infância.", firstAirYear: 1994, runtime: 142, contentRating: "12", genres: ["Comédia", "Drama", "Romance"], networks: ["Paramount"], status: "Released", colors: ["#0e1418", "#5a7a9a", "#f0f0e0"], motif: "door" },
  { id: 550, name: "Clube da Luta", originalName: "Fight Club", overview: "Um homem insone e um vendedor de sabão carismático fundam um clube clandestino que sai do controle.", firstAirYear: 1999, runtime: 139, contentRating: "18", genres: ["Drama", "Thriller"], networks: ["20th Century Fox"], status: "Released", colors: ["#140c10", "#8a2a4a", "#f0b0c0"], motif: "eye" },
  { id: 19995, name: "Avatar", overview: "Um ex-fuzileiro paraplégico é enviado a uma lua habitada e se divide entre cumprir ordens e proteger o mundo que aprende a amar.", firstAirYear: 2009, runtime: 162, contentRating: "12", genres: ["Ação", "Aventura", "Fantasia"], networks: ["20th Century Fox"], status: "Released", colors: ["#06101a", "#1a5a8a", "#a0f0ff"], motif: "waves" },
];

export const MOCK_CATALOG: MockTitle[] = [
  ...MOCK_SERIES.map((m) => ({ ...m, type: "series" as const })),
  ...MOCK_MOVIES.map((m) => ({ ...m, type: "movie" as const })),
];

export function findMock(type: ContentType, id: number) {
  return MOCK_CATALOG.find((s) => s.type === type && s.id === id);
}

/** Poster path stored for sample titles: "mock:1396" (series) or "mock:m603" (movie). */
export function mockImagePath(m: Pick<MockTitle, "type" | "id">) {
  return `mock:${m.type === "movie" ? "m" : ""}${m.id}`;
}

/** Inverse of mockImagePath's id segment ("1396" / "m603"). */
export function findMockByImageKey(key: string) {
  return key.startsWith("m") ? findMock("movie", Number(key.slice(1))) : findMock("series", Number(key));
}

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function searchMock(query: string, type: ContentType | "all" = "all") {
  const q = normalize(query.trim());
  if (!q) return [];
  return MOCK_CATALOG.filter(
    (s) =>
      (type === "all" || s.type === type) &&
      (normalize(s.name).includes(q) || normalize(s.originalName ?? "").includes(q)),
  );
}
