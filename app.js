// ======================================================
// Team Builder RPPLF — app.js (FULL)
// - Dex FR gen1-7 + extras formes
// - Recherche FR + EN
// - Tri A→Z / Points ↓ / Points ↑
// - BANNI (rouge, non cliquable)
// - Export PokéPaste (EN Showdown)
// - Import: colle TEXTE Showdown, ou un lien PokéPaste (demande le texte car CORS sur GitHub Pages)
// ======================================================

// ----------------------------
// HELPERS
// ----------------------------
const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

// ----------------------------
// BARÈME (points)
// ----------------------------
const BAREME = [
  // 10
  { name: "Méga-Kangourex", points: 10 },
  { name: "Deoxys-Vitesse", points: 10 },
  { name: "Genesect", points: 10 },
  { name: "Méga-Lucario", points: 10 },
  { name: "Démétéros Avatar", points: 10 },
  { name: "Zygarde 50%", points: 10 },

  // 8
  { name: "Braségali", points: 8 },
  { name: "Méga-Ténéfix", points: 8 },
  { name: "Méga-Métalosse", points: 8 },
  { name: "Mandrillon", points: 8 },

  // 6
  { name: "Pyrax", points: 6 },
  { name: "Méga-Mysdibule", points: 6 },
  { name: "Méga-Diancie", points: 6 },
  { name: "Sachanobi", points: 6 },
  { name: "Katagami", points: 6 },
  { name: "Exagide", points: 6 },
  { name: "Magearna", points: 6 },
  { name: "Tokopiyon", points: 6 },
  { name: "Méga-Alakazam", points: 6 },

  // 5
  { name: "Kyurem Noir", points: 5 },
  { name: "Méga-Léviator", points: 5 },
  { name: "Méga-Laggron", points: 5 },
  { name: "Méga Dracaufeu X", points: 5 },
  { name: "Méga-Dracaufeu Y", points: 5 },
  { name: "Méga-Lockpin", points: 5 },
  { name: "Pierroteknik", points: 5 },
  { name: "Tokorico", points: 5 },

  // 4
  { name: "Méga-Scarabrute", points: 4 },
  { name: "Méga-Cizayox", points: 4 },
  { name: "Manaphy", points: 4 },
  { name: "Méga-Charmina", points: 4 },
  { name: "Scorvol", points: 4 },
  { name: "Minotaupe", points: 4 },
  { name: "Amphinobi", points: 4 },
  { name: "Heatran", points: 4 },
  { name: "Démétéros-T", points: 4 },
  { name: "Maraiste", points: 4 },
  { name: "Prédastérie", points: 4 },
  { name: "Electhor", points: 4 },
  { name: "Brutalibré", points: 4 },
  { name: "Keldeo", points: 4 },
  { name: "Méga-Latios", points: 4 },
  { name: "Méga-Tyranocif", points: 4 },
  { name: "Bamboiselle", points: 4 },

  // 3
  { name: "Méga-Florizarre", points: 3 },
  { name: "Bekipan", points: 3 },
  { name: "Chartor", points: 3 },
  { name: "Feunard", points: 3 },
  { name: "Feunard-Alola", points: 3 },
  { name: "Tyranocif", points: 3 },
  { name: "Leveinard", points: 3 },
  { name: "Leuphorie", points: 3 },
  { name: "Mélodelfe", points: 3 },
  { name: "Gaulet", points: 3 },
  { name: "Kyurem", points: 3 },
  { name: "Méga-Latias", points: 3 },
  { name: "Bouleneu", points: 3 },
  { name: "Noacier", points: 3 },
  { name: "Victini", points: 3 },
  { name: "Majaspic", points: 3 },
  { name: "Tokopisco", points: 3 },
  { name: "Tokotoro", points: 3 },
  { name: "Mouscoto", points: 3 },
  { name: "Boréas T", points: 3 },
  { name: "Ekaïser", points: 3 },
  { name: "Mew", points: 3 },

  // 2
  { name: "Hoopa Déchaîné", points: 2 },
  { name: "Méga-Gallame", points: 2 },
  { name: "Métamorph", points: 2 },
  { name: "Méga-Élecsprint", points: 2 },
  { name: "Câblifère", points: 2 },
  { name: "Méga Flagadoss", points: 2 },
  { name: "Cresselia", points: 2 },
  { name: "Motisma-Laveuse", points: 2 },
  { name: "Ossatueur-Alola", points: 2 },
  { name: "Méga-Scarinho", points: 2 },
  { name: "Latios", points: 2 },
  { name: "Carchacrok", points: 2 },
  { name: "Méga-Carchacrok", points: 2 },
  { name: "Ama-Ama", points: 2 },
  { name: "Airmure", points: 2 },
  { name: "Hyporoi", points: 2 },
  { name: "Crapustule", points: 2 },
  { name: "Azumarill", points: 2 },
  { name: "Crustabri", points: 2 },
  { name: "Léviator", points: 2 },
  { name: "Scalproie", points: 2 },
  { name: "Alakazam", points: 2 },
  { name: "Jirachi", points: 2 },
  { name: "Togekiss", points: 2 },
  { name: "Zeraora", points: 2 },
  { name: "Zeroid", points: 2 },
  { name: "Chapignon", points: 2 },
  { name: "Magnézone", points: 2 },
  { name: "Florizarre", points: 2 },
  { name: "Porygon-Z", points: 2 },
  { name: "Mimiqui", points: 2 },

  // 1
  { name: "Méga-Gardevoir", points: 1 },
  { name: "Méga-Ptéra", points: 1 },
  { name: "Méga-Altaria", points: 1 },
  { name: "Hippodocus", points: 1 },
  { name: "Rubombelle", points: 1 },
  { name: "Dracolosse", points: 1 },
  { name: "Caratroc", points: 1 },
  { name: "Latias", points: 1 },
  { name: "Suicune", points: 1 },
  { name: "Cizayox", points: 1 },
  { name: "Drattak", points: 1 },
  { name: "Dimoret", points: 1 },
  { name: "Ectoplasma", points: 1 },
  { name: "Volcanion", points: 1 },
];

// ----------------------------
// BANNIS (rouge, non ajoutables)
// ⚠️ Deoxys-Vitesse N'EST PAS banni (il est à 10 pts)
// ----------------------------
const BANNED_NAMES = [
  "Mewtwo",
  "Lugia",
  "Ho-Oh",
  "Groudon",
  "Kyogre",
  "Rayquaza",
  "Deoxys-Attaque",
  "Deoxys-Défense",
  "Palkia",
  "Dialga",
  "Giratina",
  "Giratina-Originel",
  "Darkrai",
  "Shaymin-Céleste",
  "Arceus",
  "Kyurem-Blanc",
  "Reshiram",
  "Zekrom",
  "Xerneas",
  "Yveltal",
  "Zygarde-Complète",
  "Mouscoto", // Pheromosa (ton barème FR)
  "Solgaleo",
  "Lunala",
  "Necrozma-Crinière du Couchant",
  "Marshadow",
  "Gothitelle",
  "Méga-Braségali",
  "Méga-Ectoplasma",
  "Méga-Drattak",
];

const BANNED = new Set(BANNED_NAMES.map(normalize));

// ----------------------------
// Overrides Showdown (FR -> EN) pour formes/megAs
// ----------------------------
const SHOWDOWN_OVERRIDES_RAW = {
  // Megas
  "Méga-Kangourex": "Kangaskhan-Mega",
  "Méga-Lucario": "Lucario-Mega",
  "Méga-Ténéfix": "Sableye-Mega",
  "Méga-Métalosse": "Metagross-Mega",
  "Méga-Mysdibule": "Mawile-Mega",
  "Méga-Diancie": "Diancie-Mega",
  "Méga-Alakazam": "Alakazam-Mega",
  "Méga-Léviator": "Gyarados-Mega",
  "Méga-Laggron": "Swampert-Mega",
  "Méga Dracaufeu X": "Charizard-Mega-X",
  "Méga-Dracaufeu X": "Charizard-Mega-X",
  "Méga Dracaufeu Y": "Charizard-Mega-Y",
  "Méga-Dracaufeu Y": "Charizard-Mega-Y",
  "Méga-Lockpin": "Lopunny-Mega",
  "Méga-Scarabrute": "Pinsir-Mega",
  "Méga-Cizayox": "Scizor-Mega",
  "Méga-Charmina": "Medicham-Mega",
  "Méga-Latios": "Latios-Mega",
  "Méga-Tyranocif": "Tyranitar-Mega",
  "Méga-Florizarre": "Venusaur-Mega",
  "Méga-Latias": "Latias-Mega",
  "Méga-Gallame": "Gallade-Mega",
  "Méga-Élecsprint": "Manectric-Mega",
  "Méga Flagadoss": "Slowbro-Mega",
  "Méga-Scarinho": "Heracross-Mega",
  "Méga-Carchacrok": "Garchomp-Mega",
  "Méga-Gardevoir": "Gardevoir-Mega",
  "Méga-Ptéra": "Aerodactyl-Mega",
  "Méga-Altaria": "Altaria-Mega",
  "Méga-Braségali": "Blaziken-Mega",
  "Méga-Ectoplasma": "Gengar-Mega",
  "Méga-Drattak": "Salamence-Mega",

  // Formes
  "Sachanobi": "Greninja-Ash",
  "Deoxys-Vitesse": "Deoxys-Speed",
  "Deoxys-Attaque": "Deoxys-Attack",
  "Deoxys-Défense": "Deoxys-Defense",
  "Démétéros Avatar": "Landorus",
  "Démétéros-T": "Landorus-Therian",
  "Hoopa Déchaîné": "Hoopa-Unbound",
  "Motisma-Laveuse": "Rotom-Wash",
  "Ossatueur-Alola": "Marowak-Alola",
  "Feunard-Alola": "Ninetales-Alola",
  "Kyurem Noir": "Kyurem-Black",
  "Kyurem-Blanc": "Kyurem-White",
  "Shaymin-Céleste": "Shaymin-Sky",
  "Giratina-Originel": "Giratina-Origin",
  "Zygarde-Complète": "Zygarde-Complete",
  "Necrozma-Crinière du Couchant": "Necrozma-Dusk-Mane",

  // Ton barème écrit "Zeroid"
  "Zeroid": "Nihilego",
};

const SHOWDOWN_OVERRIDES = Object.fromEntries(
  Object.entries(SHOWDOWN_OVERRIDES_RAW).map(([k, v]) => [normalize(k), v])
);

// ----------------------------
// IMPORT: EN -> FR overrides (formes Showdown)
// ----------------------------
const EN_TO_FR_OVERRIDES = {
  "kangaskhan-mega": "Méga-Kangourex",
  "lucario-mega": "Méga-Lucario",
  "sableye-mega": "Méga-Ténéfix",
  "metagross-mega": "Méga-Métalosse",
  "mawile-mega": "Méga-Mysdibule",
  "diancie-mega": "Méga-Diancie",
  "alakazam-mega": "Méga-Alakazam",
  "gyarados-mega": "Méga-Léviator",
  "swampert-mega": "Méga-Laggron",
  "charizard-mega-x": "Méga Dracaufeu X",
  "charizard-mega-y": "Méga-Dracaufeu Y",
  "lopunny-mega": "Méga-Lockpin",
  "pinsir-mega": "Méga-Scarabrute",
  "scizor-mega": "Méga-Cizayox",
  "medicham-mega": "Méga-Charmina",
  "latios-mega": "Méga-Latios",
  "tyranitar-mega": "Méga-Tyranocif",
  "venusaur-mega": "Méga-Florizarre",
  "latias-mega": "Méga-Latias",
  "gallade-mega": "Méga-Gallame",
  "manectric-mega": "Méga-Élecsprint",
  "slowbro-mega": "Méga Flagadoss",
  "heracross-mega": "Méga-Scarinho",
  "garchomp-mega": "Méga-Carchacrok",
  "gardevoir-mega": "Méga-Gardevoir",
  "aerodactyl-mega": "Méga-Ptéra",
  "altaria-mega": "Méga-Altaria",
  "greninja-ash": "Sachanobi",
  "deoxys-speed": "Deoxys-Vitesse",
  "deoxys-attack": "Deoxys-Attaque",
  "deoxys-defense": "Deoxys-Défense",
  "landorus": "Démétéros Avatar",
  "landorus-therian": "Démétéros-T",
  "hoopa-unbound": "Hoopa Déchaîné",
  "rotom-wash": "Motisma-Laveuse",
  "marowak-alola": "Ossatueur-Alola",
  "ninetales-alola": "Feunard-Alola",
  "zygarde-50%": "Zygarde 50%",
  "kyurem-black": "Kyurem Noir",
  "kyurem-white": "Kyurem Blanc",
  "tornadus-therian": "Boréas T",
  "nihilego": "Zeroid",
  "necrozma-dusk-mane": "Necrozma Dusk Mane",
  "giratina-origin": "Giratina Origin",
  "shaymin-sky": "Shaymin Sky",
  "blaziken-mega": "Braségali-Méga",
  "gengar-mega": "Ectoplasma-Méga",
  "salamence-mega": "Drattak-Méga",
};

// ----------------------------
// STATE
// ----------------------------
let POKEMONS = []; // { name(fr), en, points, banned }
let frToEn = {};   // normalize(fr) -> en
let enToFr = {};   // normalize(en) -> fr
let sortMode = "AZ"; // "AZ" | "DESC" | "ASC"
let team = []; // {name,en,points,banned}

// ----------------------------
// DOM
// ----------------------------
const resultsEl = document.getElementById("results");
const teamEl = document.getElementById("team");
const totalEl = document.getElementById("totalPoints");
const resultCountEl = document.getElementById("resultCount");
const searchEl = document.getElementById("search");
const statusEl = document.getElementById("status");
const teamCountEl = document.getElementById("teamCount");

const resetBtn = document.getElementById("resetBtn");
const clearTeamBtn = document.getElementById("clearTeamBtn");
const sortBtn = document.getElementById("sortBtn");
const pokepasteBtn = document.getElementById("pokepasteBtn");
const importPasteBtn = document.getElementById("importPasteBtn");

// ----------------------------
// INIT DEX
// ----------------------------
async function initDex() {
  const [dexFrRes, frEnRes] = await Promise.all([
    fetch("./dex-fr-gen1-7.json"),
    fetch("./dex-gen1-7-fr-en.json"),
  ]);

  const dexFR = await dexFrRes.json(); // ["Bulbizarre", ...]
  const pairs = await frEnRes.json();  // [{fr,en}, ...]

  frToEn = Object.fromEntries(pairs.map(p => [normalize(p.fr), p.en]));
  enToFr = Object.fromEntries(pairs.map(p => [normalize(p.en), p.fr]));

  const pointsByName = Object.fromEntries(
    BAREME.map(p => [normalize(p.name), p.points])
  );

  // extras pour afficher formes (mega, avatar, etc.) + bannis
  const extras = [
    ...BAREME.map(p => p.name),
    ...BANNED_NAMES,
    "Deoxys-Vitesse",
    "Deoxys-Attaque",
    "Deoxys-Défense",
    "Démétéros Avatar",
    "Démétéros-T",
    "Sachanobi",
    "Méga-Ectoplasma",
    "Méga-Braségali",
    "Méga-Drattak",
  ];

  const existing = new Set(dexFR.map(n => normalize(n)));
  const allNames = [...dexFR];

  for (const name of extras) {
    const k = normalize(name);
    if (!existing.has(k)) {
      existing.add(k);
      allNames.push(name);
    }
  }

  POKEMONS = allNames.map((name) => {
    const k = normalize(name);
    const banned = BANNED.has(k);
    const points = banned ? 0 : (pointsByName[k] ?? 0);
    const en = SHOWDOWN_OVERRIDES[k] || frToEn[k] || name;
    return { name, en, points, banned };
  });

  updateAll();
}

// ----------------------------
// TEAM HELPERS
// ----------------------------
const totalPoints = () => team.reduce((sum, p) => sum + (p.points || 0), 0);
const inTeam = (name) => team.some(p => normalize(p.name) === normalize(name));

// ----------------------------
// FILTER + SORT
// ----------------------------
function filteredList() {
  const q = normalize(searchEl.value.trim());

  let list = q
    ? POKEMONS.filter(p => normalize(p.name).includes(q) || normalize(p.en).includes(q))
    : [...POKEMONS];

  if (sortMode === "AZ") {
    list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  } else if (sortMode === "DESC") {
    list.sort((a, b) => ((b.points || 0) - (a.points || 0)) || a.name.localeCompare(b.name, "fr"));
  } else {
    list.sort((a, b) => ((a.points || 0) - (b.points || 0)) || a.name.localeCompare(b.name, "fr"));
  }

  return list;
}

// ----------------------------
// BADGES
// ----------------------------
function badgeClass(points, banned) {
  if (banned) return "bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/40";
  if (points >= 8) return "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30";
  if (points >= 5) return "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/30";
  if (points >= 3) return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30";
  if (points >= 1) return "bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/30";
  return "bg-slate-500/10 text-slate-300 ring-1 ring-slate-700/60";
}

// ----------------------------
// RENDER RESULTS
// ----------------------------
function renderResults(list) {
  resultsEl.innerHTML = "";
  resultCountEl.textContent = String(list.length);
  statusEl.textContent = team.length >= 6 ? "Équipe pleine (6/6)" : "";

  if (list.length === 0) {
    resultsEl.innerHTML = `
      <div class="rounded-xl bg-slate-950/50 p-4 text-sm text-slate-400 ring-1 ring-slate-800">
        Aucun résultat.
      </div>
    `;
    return;
  }

  for (const p of list) {
    const disabled = p.banned || inTeam(p.name) || team.length >= 6;

    const row = document.createElement("button");
    row.type = "button";
    row.disabled = disabled;

    row.className =
      "w-full text-left rounded-xl bg-slate-950/40 p-3 ring-1 ring-slate-800 transition " +
      (disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-800/60");

    const smallText = p.banned
      ? "Banni"
      : disabled
        ? (inTeam(p.name) ? "Déjà dans l’équipe" : "Max 6")
        : "Clique pour ajouter";

    row.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="font-medium">${p.name}</div>
          <div class="text-xs text-slate-500">${smallText}</div>
        </div>
        <div class="shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${badgeClass(p.points, p.banned)}">
          ${p.banned ? "BANNI" : `${p.points} pts`}
        </div>
      </div>
    `;

    row.addEventListener("click", () => {
      if (p.banned) return;
      team.push(p);
      updateAll();
    });

    resultsEl.appendChild(row);
  }
}

// ----------------------------
// RENDER TEAM
// ----------------------------
function renderTeam() {
  teamEl.innerHTML = "";

  if (team.length === 0) {
    teamEl.innerHTML = `
      <div class="sm:col-span-2 rounded-xl bg-slate-950/50 p-4 text-sm text-slate-400 ring-1 ring-slate-800">
        Ajoute des Pokémon depuis la liste à gauche.
      </div>
    `;
    return;
  }

  for (const p of team) {
    const card = document.createElement("div");
    card.className = "rounded-xl bg-slate-950/40 p-3 ring-1 ring-slate-800";

    card.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="font-medium">${p.name}</div>
          <div class="text-sm text-slate-400">${p.points} pts</div>
        </div>
        <button class="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700">
          Supprimer
        </button>
      </div>
    `;

    card.querySelector("button").addEventListener("click", () => {
      team = team.filter(x => normalize(x.name) !== normalize(p.name));
      updateAll();
    });

    teamEl.appendChild(card);
  }
}

// ----------------------------
// HEADER + UPDATE
// ----------------------------
function renderHeader() {
  totalEl.textContent = String(totalPoints());
  teamCountEl.textContent = `${team.length} / 6`;
}

function updateResults() {
  renderResults(filteredList());
}

function updateAll() {
  renderHeader();
  renderTeam();
  updateResults();
}

// ----------------------------
// POKÉPASTE EXPORT
// ----------------------------
function pokepasteText() {
  return team
    .map(p => (p.en || p.name).trim())
    .filter(Boolean)
    .join("\n\n") + "\n";
}

function openPokePaste() {
  const text = pokepasteText().trim();
  if (!text) return;

  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://pokepast.es/create";
  form.target = "_blank";

  const paste = document.createElement("input");
  paste.type = "hidden";
  paste.name = "paste";
  paste.value = text;

  const title = document.createElement("input");
  title.type = "hidden";
  title.name = "title";
  title.value = "RPPLF";

  form.appendChild(paste);
  form.appendChild(title);

  document.body.appendChild(form);
  form.submit();
  form.remove();
}

// ----------------------------
// POKÉPASTE IMPORT (GH Pages compatible)
// ----------------------------
function extractPokePasteId(input) {
  const s = (input || "").trim();
  const m = s.match(/pokepast\.es\/([a-f0-9]+)/i);
  if (m) return m[1];
  if (/^[a-f0-9]{16}$/i.test(s)) return s;
  return null;
}

// Parse Showdown blocks => species EN
function parseSpeciesFromPaste(text) {
  const blocks = String(text || "").replace(/\r/g, "").split(/\n{2,}/);
  const species = [];

  for (const block of blocks) {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    if (lines[0].startsWith("===")) continue;

    let first = lines[0];

    // Nick (Species) @ Item  -> Species (sauf (M)/(F))
    const paren = first.match(/\(([^)]+)\)/);
    if (paren) {
      const inside = paren[1].trim();
      if (!/^(m|f)$/i.test(inside)) first = inside;
    }

    // enlever item
    first = first.split("@")[0].trim();

    // enlever (M)/(F) n'importe où
    first = first.replace(/\s*\((M|F)\)\s*/gi, " ").trim();

    // cleanup
    first = first.replace(/\s{2,}/g, " ").trim();

    if (first) species.push(first);
  }

  return species;
}

function toFrenchNameFromEnglish(enName) {
  const k = normalize(enName);
  if (EN_TO_FR_OVERRIDES[k]) return EN_TO_FR_OVERRIDES[k];
  if (enToFr[k]) return enToFr[k];
  return enName;
}

function importFromPasteText(pasteText) {
  const enSpecies = parseSpeciesFromPaste(pasteText);

  const byFr = new Map(POKEMONS.map(p => [normalize(p.name), p]));
  const byEn = new Map(POKEMONS.map(p => [normalize(p.en), p]));

  const picked = [];
  for (const en of enSpecies) {
    const fr = toFrenchNameFromEnglish(en);

    const a = byFr.get(normalize(fr));
    if (a) { picked.push(a); continue; }

    const b = byEn.get(normalize(en));
    if (b) { picked.push(b); continue; }

    console.warn("Import non reconnu:", en, "->", fr);
  }

  team = picked.slice(0, 6);
  updateAll();

  const missing = Math.max(0, enSpecies.length - picked.length);
  if (missing > 0) alert(`Import OK (${team.length}). ${missing} non reconnus (voir console).`);
}

function importFromPokePasteOrText(input) {
  const id = extractPokePasteId(input);

  // GH Pages: impossible de fetch pokepast.es => on demande le TEXTE
  if (id) {
    const txt = prompt(
      "Sur GitHub Pages, l'import par lien est bloqué (CORS).\n" +
      "Ouvre ton PokéPaste, copie le texte (Import/Export Showdown), puis colle-le ici :"
    );
    if (!txt) return;
    importFromPasteText(txt);
    return;
  }

  // Sinon: c'est du texte Showdown direct
  importFromPasteText(input);
}

// ----------------------------
// EVENTS
// ----------------------------
searchEl.addEventListener("input", updateResults);

resetBtn?.addEventListener("click", () => {
  searchEl.value = "";
  updateResults();
  searchEl.focus();
});

clearTeamBtn?.addEventListener("click", () => {
  team = [];
  updateAll();
});

sortBtn?.addEventListener("click", () => {
  sortMode = sortMode === "AZ" ? "DESC" : sortMode === "DESC" ? "ASC" : "AZ";
  sortBtn.textContent =
    sortMode === "AZ" ? "Tri: A→Z" :
    sortMode === "DESC" ? "Tri: Points ↓" :
    "Tri: Points ↑";
  updateResults();
});

pokepasteBtn?.addEventListener("click", openPokePaste);

importPasteBtn?.addEventListener("click", () => {
  const input = prompt("Colle un lien PokéPaste OU le texte Showdown :");
  if (!input) return;
  importFromPokePasteOrText(input);
});

// ----------------------------
// START
// ----------------------------
initDex();
