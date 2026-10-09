/**
 * Credits and franchises for the sample catalog (see mock-catalog.ts), so the
 * title page's cast and "more of this franchise" sections work without TMDB.
 */
export type MockCredits = {
  directors: string[];
  /** [actor, character] in billing order */
  cast: [string, string][];
};

export const MOCK_COLLECTIONS: { id: number; name: string; parts: number[] }[] = [
  { id: 2344, name: "Matrix", parts: [603, 604, 605, 624860] },
  { id: 726871, name: "Duna", parts: [438631, 693134] },
  { id: 87096, name: "Avatar", parts: [19995, 76600] },
  { id: 9485, name: "Velozes e Furiosos", parts: [9799, 584, 9615, 13804, 51497, 82992, 168259, 337339, 385128, 385687] },
];

const WACHOWSKIS = ["Lana Wachowski", "Lilly Wachowski"];
const DOM: [string, string] = ["Vin Diesel", "Dominic Toretto"];
const BRIAN: [string, string] = ["Paul Walker", "Brian O'Conner"];
const LETTY: [string, string] = ["Michelle Rodriguez", "Letty Ortiz"];
const MIA: [string, string] = ["Jordana Brewster", "Mia Toretto"];
const ROMAN: [string, string] = ["Tyrese Gibson", "Roman Pearce"];
const TEJ: [string, string] = ["Ludacris", "Tej Parker"];
const HOBBS: [string, string] = ["Dwayne Johnson", "Luke Hobbs"];
const SHAW: [string, string] = ["Jason Statham", "Deckard Shaw"];

/** Keyed by movie id. */
export const MOCK_CREDITS: Record<number, MockCredits> = {
  603: { directors: WACHOWSKIS, cast: [["Keanu Reeves", "Neo"], ["Laurence Fishburne", "Morpheus"], ["Carrie-Anne Moss", "Trinity"], ["Hugo Weaving", "Agente Smith"], ["Joe Pantoliano", "Cypher"], ["Gloria Foster", "Oráculo"]] },
  604: { directors: WACHOWSKIS, cast: [["Keanu Reeves", "Neo"], ["Laurence Fishburne", "Morpheus"], ["Carrie-Anne Moss", "Trinity"], ["Hugo Weaving", "Agente Smith"], ["Jada Pinkett Smith", "Niobe"], ["Monica Bellucci", "Persephone"]] },
  605: { directors: WACHOWSKIS, cast: [["Keanu Reeves", "Neo"], ["Laurence Fishburne", "Morpheus"], ["Carrie-Anne Moss", "Trinity"], ["Hugo Weaving", "Agente Smith"], ["Jada Pinkett Smith", "Niobe"], ["Mary Alice", "Oráculo"]] },
  624860: { directors: ["Lana Wachowski"], cast: [["Keanu Reeves", "Neo / Thomas Anderson"], ["Carrie-Anne Moss", "Trinity / Tiffany"], ["Yahya Abdul-Mateen II", "Morpheus"], ["Jessica Henwick", "Bugs"], ["Jonathan Groff", "Smith"], ["Neil Patrick Harris", "O Analista"]] },
  27205: { directors: ["Christopher Nolan"], cast: [["Leonardo DiCaprio", "Cobb"], ["Joseph Gordon-Levitt", "Arthur"], ["Elliot Page", "Ariadne"], ["Tom Hardy", "Eames"], ["Ken Watanabe", "Saito"], ["Cillian Murphy", "Robert Fischer"]] },
  496243: { directors: ["Bong Joon-ho"], cast: [["Song Kang-ho", "Kim Ki-taek"], ["Lee Sun-kyun", "Park Dong-ik"], ["Cho Yeo-jeong", "Choi Yeon-gyo"], ["Choi Woo-shik", "Kim Ki-woo"], ["Park So-dam", "Kim Ki-jung"], ["Lee Jung-eun", "Moon-gwang"]] },
  157336: { directors: ["Christopher Nolan"], cast: [["Matthew McConaughey", "Cooper"], ["Anne Hathaway", "Brand"], ["Jessica Chastain", "Murph"], ["Michael Caine", "Professor Brand"], ["Mackenzie Foy", "Murph (jovem)"], ["Matt Damon", "Dr. Mann"]] },
  238: { directors: ["Francis Ford Coppola"], cast: [["Marlon Brando", "Vito Corleone"], ["Al Pacino", "Michael Corleone"], ["James Caan", "Sonny Corleone"], ["Robert Duvall", "Tom Hagen"], ["Diane Keaton", "Kay Adams"], ["John Cazale", "Fredo Corleone"]] },
  129: { directors: ["Hayao Miyazaki"], cast: [["Rumi Hiiragi", "Chihiro (voz)"], ["Miyu Irino", "Haku (voz)"], ["Mari Natsuki", "Yubaba (voz)"], ["Bunta Sugawara", "Kamaji (voz)"], ["Takashi Naitō", "Pai de Chihiro (voz)"], ["Yasuko Sawaguchi", "Mãe de Chihiro (voz)"]] },
  680: { directors: ["Quentin Tarantino"], cast: [["John Travolta", "Vincent Vega"], ["Samuel L. Jackson", "Jules Winnfield"], ["Uma Thurman", "Mia Wallace"], ["Bruce Willis", "Butch Coolidge"], ["Ving Rhames", "Marsellus Wallace"], ["Tim Roth", "Pumpkin"]] },
  872585: { directors: ["Christopher Nolan"], cast: [["Cillian Murphy", "J. Robert Oppenheimer"], ["Emily Blunt", "Kitty Oppenheimer"], ["Matt Damon", "Leslie Groves"], ["Robert Downey Jr.", "Lewis Strauss"], ["Florence Pugh", "Jean Tatlock"], ["Josh Hartnett", "Ernest Lawrence"]] },
  438631: { directors: ["Denis Villeneuve"], cast: [["Timothée Chalamet", "Paul Atreides"], ["Rebecca Ferguson", "Lady Jessica"], ["Oscar Isaac", "Duque Leto Atreides"], ["Zendaya", "Chani"], ["Josh Brolin", "Gurney Halleck"], ["Jason Momoa", "Duncan Idaho"]] },
  693134: { directors: ["Denis Villeneuve"], cast: [["Timothée Chalamet", "Paul Atreides"], ["Zendaya", "Chani"], ["Rebecca Ferguson", "Lady Jessica"], ["Javier Bardem", "Stilgar"], ["Austin Butler", "Feyd-Rautha"], ["Florence Pugh", "Princesa Irulan"]] },
  13: { directors: ["Robert Zemeckis"], cast: [["Tom Hanks", "Forrest Gump"], ["Robin Wright", "Jenny Curran"], ["Gary Sinise", "Tenente Dan"], ["Sally Field", "Sra. Gump"], ["Mykelti Williamson", "Bubba"], ["Haley Joel Osment", "Forrest Jr."]] },
  550: { directors: ["David Fincher"], cast: [["Brad Pitt", "Tyler Durden"], ["Edward Norton", "O Narrador"], ["Helena Bonham Carter", "Marla Singer"], ["Meat Loaf", "Robert Paulson"], ["Jared Leto", "Angel Face"], ["Zach Grenier", "Richard Chesler"]] },
  19995: { directors: ["James Cameron"], cast: [["Sam Worthington", "Jake Sully"], ["Zoe Saldaña", "Neytiri"], ["Sigourney Weaver", "Grace Augustine"], ["Stephen Lang", "Coronel Quaritch"], ["Michelle Rodriguez", "Trudy Chacón"], ["Giovanni Ribisi", "Parker Selfridge"]] },
  76600: { directors: ["James Cameron"], cast: [["Sam Worthington", "Jake Sully"], ["Zoe Saldaña", "Neytiri"], ["Sigourney Weaver", "Kiri"], ["Stephen Lang", "Coronel Quaritch"], ["Kate Winslet", "Ronal"], ["Cliff Curtis", "Tonowari"]] },
  9799: { directors: ["Rob Cohen"], cast: [DOM, BRIAN, LETTY, MIA, ["Rick Yune", "Johnny Tran"], ["Chad Lindberg", "Jesse"]] },
  584: { directors: ["John Singleton"], cast: [BRIAN, ROMAN, TEJ, ["Eva Mendes", "Monica Fuentes"], ["Cole Hauser", "Carter Verone"], ["Devon Aoki", "Suki"]] },
  9615: { directors: ["Justin Lin"], cast: [["Lucas Black", "Sean Boswell"], ["Bow Wow", "Twinkie"], ["Sung Kang", "Han"], ["Nathalie Kelley", "Neela"], ["Brian Tee", "Takashi"], DOM] },
  13804: { directors: ["Justin Lin"], cast: [DOM, BRIAN, LETTY, MIA, ["John Ortiz", "Arturo Braga"], ["Gal Gadot", "Gisele"]] },
  51497: { directors: ["Justin Lin"], cast: [DOM, BRIAN, HOBBS, MIA, ROMAN, TEJ] },
  82992: { directors: ["Justin Lin"], cast: [DOM, BRIAN, HOBBS, LETTY, MIA, ["Luke Evans", "Owen Shaw"]] },
  168259: { directors: ["James Wan"], cast: [DOM, BRIAN, HOBBS, SHAW, LETTY, MIA] },
  337339: { directors: ["F. Gary Gray"], cast: [DOM, HOBBS, SHAW, LETTY, ["Charlize Theron", "Cipher"], ROMAN] },
  385128: { directors: ["Justin Lin"], cast: [DOM, LETTY, MIA, ["John Cena", "Jakob Toretto"], ROMAN, TEJ] },
  385687: { directors: ["Louis Leterrier"], cast: [DOM, LETTY, ["Jason Momoa", "Dante Reyes"], ROMAN, TEJ, ["Brie Larson", "Tess"]] },
};

/**
 * Where each sample title streams in Brazil (brand keys from providers.ts),
 * keyed "series:<id>" / "movie:<id>". Illustrative only: catalogues change
 * monthly. A title left out has no streaming option.
 */
export const MOCK_PROVIDERS: Record<string, { stream: string[]; store?: string[] }> = {
  "series:1396": { stream: ["netflix"] },
  "series:1399": { stream: ["max"], store: ["apple", "google"] },
  "series:95396": { stream: ["appletv"] },
  "series:87108": { stream: ["max"] },
  "series:66732": { stream: ["netflix"] },
  "series:76479": { stream: ["prime"] },
  "series:100088": { stream: ["max"] },
  "series:136315": { stream: ["disney"] },
  "series:1100": { stream: ["disney", "prime"] },
  "series:60059": { stream: ["netflix"] },
  "series:46648": { stream: ["max"] },
  "series:70523": { stream: ["netflix"] },
  "series:1438": { stream: ["max"] },
  "series:1668": { stream: ["max"], store: ["apple", "google"] },
  "series:76331": { stream: ["max"] },
  "series:42009": { stream: ["netflix"] },
  "series:1408": { stream: ["prime", "globoplay"] },
  "series:93405": { stream: ["netflix"] },
  "series:84958": { stream: ["disney"] },
  "series:2316": { stream: ["prime"] },
  "series:71912": { stream: ["netflix"] },
  "series:67744": { stream: ["netflix"] },
  "series:125988": { stream: ["appletv"] },
  "series:94997": { stream: ["max"] },
  "series:4607": { stream: ["disney"] },
  "series:1405": { stream: ["paramount", "globoplay"] },
  "series:110316": { stream: ["netflix"] },
  "movie:603": { stream: ["max"], store: ["apple", "google", "amazon"] },
  "movie:27205": { stream: ["max", "netflix"], store: ["apple", "google"] },
  "movie:496243": { stream: ["prime", "mubi"], store: ["apple"] },
  "movie:157336": { stream: ["prime", "paramount"], store: ["apple", "google"] },
  "movie:238": { stream: ["paramount"], store: ["apple", "google"] },
  "movie:129": { stream: ["netflix"] },
  "movie:680": { stream: ["paramount", "telecine"], store: ["apple"] },
  "movie:872585": { stream: ["prime", "telecine"], store: ["apple", "google", "amazon"] },
  "movie:438631": { stream: ["max"], store: ["apple", "google"] },
  "movie:13": { stream: ["paramount", "netflix"], store: ["apple"] },
  "movie:550": { stream: ["disney"], store: ["apple", "google"] },
  "movie:19995": { stream: ["disney"] },
  "movie:604": { stream: ["max"], store: ["apple"] },
  "movie:605": { stream: ["max"], store: ["apple"] },
  "movie:624860": { stream: ["max"] },
  "movie:693134": { stream: ["max"], store: ["apple", "google", "amazon"] },
  "movie:76600": { stream: ["disney"] },
  "movie:9799": { stream: ["netflix", "telecine"] },
  "movie:584": { stream: ["telecine"], store: ["apple"] },
  "movie:51497": { stream: ["netflix"], store: ["apple", "google"] },
  "movie:385687": { stream: ["prime"], store: ["apple", "google", "amazon"] },
};
