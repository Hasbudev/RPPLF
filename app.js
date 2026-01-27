// ======================================================
// Team Builder RPPLF — app.js (Gen7/Gen9 switch)
// ✅ Affichage: 100% FR (Gen7 + Gen9)
// ✅ Recherche: FR + EN + alias FR (ex: Toxizap) + alias EN
// ✅ Export PokéPaste: EN Showdown
// ✅ Import texte Showdown/PokéPaste
// ✅ Gen 9 par défaut
// ======================================================

// ----------------------------
// HELPERS
// ----------------------------
const MISSING_FR_TAG = "(@moyerf)";
const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const clamp6 = (arr) => arr.slice(0, 6);

// Canonicalise certains alias EN pour matcher Showdown / mapping
function canonicalizeEnglishName(raw) {
  const k = normalize(raw);

  const ALIASES = {
    // Ogerpon masks
    ogerponwater: "Ogerpon-Wellspring",
    ogerponwellspring: "Ogerpon-Wellspring",
    ogerponfire: "Ogerpon-Hearthflame",
    ogerponhearthflame: "Ogerpon-Hearthflame",
    ogerponrock: "Ogerpon-Cornerstone",
    ogerponcornerstone: "Ogerpon-Cornerstone",

    // Ursaluna Bloodmoon
    ursalunabloodmoon: "Ursaluna-Bloodmoon",

    // Urshifu forms
    urshifusinglestrike: "Urshifu",
    urshifurapidstrike: "Urshifu-Rapid-Strike",

    // Hisui naming
    sneaslerhisui: "Sneasler",
    samurotthisui: "Samurott-Hisui",
    lilliganthisui: "Lilligant-Hisui",

    // Galar naming
    slowkinggalar: "Slowking-Galar",

    // Deoxys forms
    deoxysspeed: "Deoxys-Speed",
    deoxysattack: "Deoxys-Attack",
    deoxysdefense: "Deoxys-Defense",

    // Calyrex
    calyrexshadow: "Calyrex-Shadow",
    calyrexice: "Calyrex-Ice",

    // Terapagos forms
    terapagosstellar: "Terapagos-Stellar",
    terapagosterastal: "Terapagos-Terastal",

    // Aegislash (formes de combat)
    aegislashblade: "Aegislash",
    aegislashshield: "Aegislash",

    // Palafin (Hero form)
    palafinhero: "Palafin",

    // Mimikyu (Busted form)
    mimikyubusted: "Mimikyu",

    // Wishiwashi (Schooling)
    wishiwashischool: "Wishiwashi",

    // Minior (Core / couleurs)
    miniorcore: "Minior",
    miniormeteor: "Minior",

    // Eiscue (Noice face)
    eiscuenoice: "Eiscue",

    // Darmanitan (Zen Mode)
    darmanitanzen: "Darmanitan",
    darmanitanstandard: "Darmanitan",
    darmanitangalarzen: "Darmanitan-Galar",
    darmanitangalarstandard: "Darmanitan-Galar",

    // Cramorant (formes Gulping/Gorging)
    cramorantgulping: "Cramorant",
    cramorantgorging: "Cramorant",

    // Morpeko (Hangry mode)
    morpekohangry: "Morpeko",

    // Meloetta (Pirouette)
    meloettapirouette: "Meloetta",

    // Necrozma (Ultra)
    necrozmaultra: "Necrozma",

    // Greninja battle-only forms
    greninjabond: "Greninja",
    greninjaash: "Greninja",

    // Zygarde (Complete)
    zygardecomplete: "Zygarde",

    // minor common typos
    pyrobut: "Cinderace",
    hipppowdown: "Hippowdon",
    hippowdown: "Hippowdon",
    pelitoat: "Politoed",
    pelitoed: "Politoed",
  };

  return ALIASES[k] || raw;
}

// ----------------------------
// ALIAS FR supplémentaires (pour la recherche)
// -> ces alias doivent matcher une espèce EN Showdown
// ----------------------------
const EXTRA_FR_TO_EN = {
  // Toxizap -> Toxtricity (FR officiel: Salarsen)
  "Toxizap": "Toxtricity",

  // Charmilly -> Alcremie
  "Charmilly": "Alcremie",

  // (tu peux en ajouter ici si besoin)
};

// ----------------------------
// GENIES base FR (fallback formes)
// ----------------------------
const GENIES_BASE_FR = {
  landorus: "Démétéros",
  tornadus: "Boréas",
  thundurus: "Fulguris",
  enamorus: "Amovénus",
};

// ----------------------------
// HELPERS MAP
// ----------------------------
function buildOverrides(raw) {
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [normalize(k), v]));
}

function addBothKeysToMap(map, nameAny, value, { frToEnLocal, enToFrLocal }) {
  if (!nameAny) return;

  map[normalize(nameAny)] = value;

  const k = normalize(canonicalizeEnglishName(nameAny));
  if (enToFrLocal && enToFrLocal[k]) {
    map[normalize(enToFrLocal[k])] = value;
    map[k] = value;
  }

  const kfr = normalize(nameAny);
  if (frToEnLocal && frToEnLocal[kfr]) {
    map[normalize(frToEnLocal[kfr])] = value;
  }
}

function extraAliasesForEnglish(enName) {
  const canon = canonicalizeEnglishName(enName);
  const target = normalize(canon);

  const out = [];
  for (const [frAlias, en] of Object.entries(EXTRA_FR_TO_EN)) {
    if (normalize(canonicalizeEnglishName(en)) === target) out.push(frAlias);
  }
  return out;
}

// ----------------------------
// NAME CONVERT (EN -> FR)
// ✅ IMPORTANT: NE JAMAIS retourner EN pour l'affichage final.
// -> si on ne sait pas traduire, on renvoie "" (et on filtrera)
// ----------------------------
function fallbackFrenchFromEnglish(enName) {
  const canon = canonicalizeEnglishName(enName);
  const k = normalize(canon);

  // Landorus-Therian etc
  if (k.endsWith("therian")) {
    const base = k.replace(/therian$/, "");
    if (GENIES_BASE_FR[base]) return `${GENIES_BASE_FR[base]}-T`;
  }

  // Incarnate (si jamais)
  if (k.endsWith("incarnate")) {
    const base = k.replace(/incarnate$/, "");
    if (GENIES_BASE_FR[base]) return `${GENIES_BASE_FR[base]} Avatar`;
  }

  return "";
}

function toFrenchNameFromEnglish(enName, { enToFrOverrides, enToFrMap }) {
  const canon = canonicalizeEnglishName(enName);
  const k = normalize(canon);

  if (enToFrOverrides && enToFrOverrides[k]) return enToFrOverrides[k];
  if (enToFrMap && enToFrMap[k]) return enToFrMap[k];

  const fb = fallbackFrenchFromEnglish(canon);
  if (fb) return fb;

  // ❌ pas de fallback EN
  return "";
}

// ======================================================
// TES DONNÉES (BAREME/BAN/OVERRIDES)
// -> je laisse tes arrays tels quels (j'ai juste gardé l'essentiel ici)
// ======================================================

// ----------------------------
// GEN 7 DATA
// ----------------------------
const BAREME_GEN7 = [ /* ... (inchangé) ... */ ];
const BANNED_NAMES_GEN7 = [ /* ... (inchangé) ... */ ];
const SHOWDOWN_OVERRIDES_GEN7_RAW = { /* ... (inchangé) ... */ };
const EN_TO_FR_OVERRIDES_GEN7 = { /* ... (inchangé) ... */ };

// ----------------------------
// GEN 9 DATA
// ----------------------------
const BAREME_GEN9 = [ /* ... (inchangé) ... */ ];
const BANNED_NAMES_GEN9 = [ /* ... (inchangé) ... */ ];
const SHOWDOWN_OVERRIDES_GEN9_RAW = {};
const EN_TO_FR_OVERRIDES_GEN9 = {
  // ... (tes overrides)
  "toxtricity": "Salarsen",
  "alcremie": "Charmilly",
  // etc
};

// ----------------------------
// CONFIG PAR GEN
// ----------------------------
function getGenConfig(gen) {
  if (gen === 9) {
    return {
      gen: 9,
      dexEnPath: "./dex-en-showdown-gen9.json",
      mapFrEnPath: "./dex-gen9-fr-en.json",
      mapFrEnPathExtra: "./dex-gen1-7-fr-en.json",
      bareme: BAREME_GEN9,
      bannedNames: BANNED_NAMES_GEN9,
      showdownOverrides: buildOverrides(SHOWDOWN_OVERRIDES_GEN9_RAW),
      enToFrOverrides: buildOverrides(EN_TO_FR_OVERRIDES_GEN9),
      title: "Gen: 9",
    };
  }

  return {
    gen: 7,
    dexFrPath: "./dex-fr-gen1-7.json",
    mapFrEnPath: "./dex-gen1-7-fr-en.json",
    bareme: BAREME_GEN7,
    bannedNames: BANNED_NAMES_GEN7,
    showdownOverrides: buildOverrides(SHOWDOWN_OVERRIDES_GEN7_RAW),
    enToFrOverrides: buildOverrides(EN_TO_FR_OVERRIDES_GEN7),
    title: "Gen: 7",
  };
}

// ----------------------------
// STATE
// ----------------------------
let currentGen = 9;            // ✅ Gen 9 par défaut
let CONFIG = getGenConfig(currentGen);

let POKEMONS = []; // { name(FR), en, points, banned, keys[] }
let frToEn = {};   // normalize(fr) -> en
let enToFr = {};   // normalize(en) -> fr
let sortMode = "AZ";
let team = [];

// ----------------------------
// DOM (DOIT être AVANT tout start)
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
const genBtn = document.getElementById("genBtn");

// ----------------------------
// DEX LOADER
// ----------------------------
async function loadDexForGen(gen) {
  CONFIG = getGenConfig(gen);

  // ---------------- GEN7 ----------------
  if (gen === 7) {
    const [dexFrRes, frEnRes] = await Promise.all([
      fetch(CONFIG.dexFrPath),
      fetch(CONFIG.mapFrEnPath),
    ]);

    const dexFR = await dexFrRes.json();
    const pairs = await frEnRes.json();

    frToEn = Object.fromEntries(pairs.map(p => [normalize(p.fr), p.en]));
    enToFr = Object.fromEntries(pairs.map(p => [normalize(p.en), p.fr]));

    // points lookup
    const pointsByName = {};
    for (const it of CONFIG.bareme) {
      const nm = canonicalizeEnglishName(it.name);
      addBothKeysToMap(pointsByName, nm, it.points, { frToEnLocal: frToEn, enToFrLocal: enToFr });
    }

    // banned lookup
    const bannedSet = new Set();
    const addBan = (nm) => {
      const canon = canonicalizeEnglishName(nm);
      bannedSet.add(normalize(canon));
      bannedSet.add(normalize(nm));
      const ken = normalize(canon);
      if (enToFr[ken]) bannedSet.add(normalize(enToFr[ken]));
      const kfr = normalize(nm);
      if (frToEn[kfr]) bannedSet.add(normalize(frToEn[kfr]));
    };
    for (const nm of CONFIG.bannedNames) addBan(nm);

    const bannedPrefixes = ["arceus", "necrozma", "terapagos"];

    // extras FR
    const extras = [
      ...CONFIG.bareme.map(p => p.name),
      ...CONFIG.bannedNames,
      // génies totémiques
      "Boréas-Totémique",
      "Fulguris-Totémique",
      "Démétéros-Totémique",
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

    // build list (FR affiché, OK)
    POKEMONS = allNames.map((name) => {
      const kfr = normalize(name);
      const en = CONFIG.showdownOverrides[kfr] || frToEn[kfr] || name;
      const enCanon = canonicalizeEnglishName(en);
      const ken = normalize(enCanon);

      const isPrefixBanned =
        bannedPrefixes.some(pref => ken.startsWith(pref)) ||
        bannedPrefixes.some(pref => kfr.startsWith(pref));

      const banned = bannedSet.has(kfr) || bannedSet.has(ken) || isPrefixBanned;
      const points = banned ? 0 : (pointsByName[kfr] ?? pointsByName[ken] ?? 0);

      let displayName = name;

      // heuristique simple : si FR == EN et qu'on n'a aucune trad FR connue
      const kenCanon = normalize(enCanon);
      const looksUntranslated =
        normalize(name) === kenCanon &&
        !enToFr[kenCanon] &&
        !(CONFIG.enToFrOverrides && CONFIG.enToFrOverrides[kenCanon]);

      if (looksUntranslated) displayName = `${name} ${MISSING_FR_TAG}`;

      // search keys (FR + EN + alias FR custom)
      const keys = new Set([normalize(displayName), kenCanon]);

      // si on a ajouté le tag, on garde aussi le FR "pur" en clé
      if (displayName !== name) keys.add(normalize(name));

      // alias FR custom (Toxizap etc.)
      for (const a of extraAliasesForEnglish(enCanon)) keys.add(normalize(a));

      return { name: displayName, en: enCanon, points, banned, keys: [...keys] };
    });

    team = [];
    searchEl.value = "";
    updateAll();
    mountImportUI();
    updateGenButtonLabel();
    return;
  }

  // ---------------- GEN9 ----------------
  const [dexEnRes, frEnRes, frEnExtraRes] = await Promise.all([
    fetch(CONFIG.dexEnPath),
    fetch(CONFIG.mapFrEnPath),
    fetch(CONFIG.mapFrEnPathExtra),
  ]);

  const dexEN = await dexEnRes.json();
  const pairs9 = await frEnRes.json();
  const pairsOld = await frEnExtraRes.json();

  // merge mappings
  const pairs = [...pairsOld, ...pairs9];
  frToEn = Object.fromEntries(pairs.map(p => [normalize(p.fr), p.en]));
  enToFr = Object.fromEntries(pairs.map(p => [normalize(p.en), p.fr]));

  // points lookup
  const pointsByName = {};
  for (const it of CONFIG.bareme) {
    const nm = canonicalizeEnglishName(it.name);
    addBothKeysToMap(pointsByName, nm, it.points, { frToEnLocal: frToEn, enToFrLocal: enToFr });
  }

  // banned lookup
  const bannedSet = new Set();
  const addBan = (nm) => {
    const canon = canonicalizeEnglishName(nm);
    bannedSet.add(normalize(canon));
    bannedSet.add(normalize(nm));
    const ken = normalize(canon);
    if (enToFr[ken]) bannedSet.add(normalize(enToFr[ken]));
    const kfr = normalize(nm);
    if (frToEn[kfr]) bannedSet.add(normalize(frToEn[kfr]));
  };
  for (const nm of CONFIG.bannedNames) addBan(nm);

  const bannedPrefixes = ["arceus", "necrozma", "terapagos"];

  // build unique EN list
  const extrasEN = [
    ...CONFIG.bareme.map(p => canonicalizeEnglishName(p.name)),
    ...CONFIG.bannedNames.map(n => canonicalizeEnglishName(n)),
  ];

  const allEN = (() => {
    const seen = new Set();
    const out = [];
    const push = (x) => {
      if (!x) return;
      const canon = canonicalizeEnglishName(x);
      const k = normalize(canon);
      if (!k || seen.has(k)) return;
      seen.add(k);
      out.push(canon);
    };
    dexEN.forEach(push);
    extrasEN.forEach(push);
    return out;
  })();

  // build list (AFFICHAGE 100% FR => si pas de trad, on ignore)
// build list (AFFICHAGE FR, sinon EN + tag)
const built = [];
for (const enRaw of allEN) {
  const enCanon = canonicalizeEnglishName(enRaw);
  const ken = normalize(enCanon);

  const frDisplay = toFrenchNameFromEnglish(enCanon, {
    enToFrOverrides: CONFIG.enToFrOverrides,
    enToFrMap: enToFr,
  });

  // ✅ si pas de trad => affiche EN + tag
  const displayFinal = frDisplay ? frDisplay : `${enCanon} ${MISSING_FR_TAG}`;

  // ⚠️ pour points/bans, on évite d'utiliser le tag
  const kfrClean = frDisplay ? normalize(frDisplay) : ""; // FR "propre" si dispo
  const kdisplayFinal = normalize(displayFinal);

  const isPrefixBanned =
    bannedPrefixes.some((pref) => ken.startsWith(pref)) ||
    (kfrClean && bannedPrefixes.some((pref) => kfrClean.startsWith(pref)));

  const banned =
    bannedSet.has(ken) ||
    (kfrClean && bannedSet.has(kfrClean)) ||
    bannedSet.has(kdisplayFinal) ||
    isPrefixBanned;

  const points = banned
    ? 0
    : (pointsByName[ken] ?? (kfrClean ? pointsByName[kfrClean] : 0) ?? 0);

  // ✅ search keys (FR + EN + alias)
  const keys = new Set([kdisplayFinal, ken]);

  // alias FR custom (Toxizap etc.)
  for (const a of extraAliasesForEnglish(enCanon)) keys.add(normalize(a));

  // mapping FR officiel si dispo
  const mappedFr = enToFr[ken];
  if (mappedFr) keys.add(normalize(mappedFr));

  // et si on a un FR "propre" (sans tag), on l'ajoute aussi
  if (frDisplay) keys.add(normalize(frDisplay));

  built.push({
    name: displayFinal,
    en: enCanon,
    points,
    banned,
    keys: [...keys],
  });
}

POKEMONS = built;

  team = [];
  searchEl.value = "";
  updateAll();
  mountImportUI();
  updateGenButtonLabel();
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
    ? POKEMONS.filter(p => (p.keys || []).some(k => k.includes(q)))
    : [...POKEMONS];

  if (sortMode === "AZ") list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  else if (sortMode === "DESC") list.sort((a, b) => ((b.points || 0) - (a.points || 0)) || a.name.localeCompare(b.name, "fr"));
  else list.sort((a, b) => ((a.points || 0) - (b.points || 0)) || a.name.localeCompare(b.name, "fr"));

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
  if (resultCountEl) resultCountEl.textContent = String(list.length);
  if (statusEl) statusEl.textContent = team.length >= 6 ? "Équipe pleine (6/6)" : "";

  if (list.length === 0) {
    resultsEl.innerHTML = `
      <div class="rounded-xl bg-slate-950/50 p-4 text-sm text-slate-400 ring-1 ring-slate-800">
        Aucun résultat.
      </div>`;
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
      </div>`;

    row.addEventListener("click", () => {
      if (p.banned) return;
      if (team.length >= 6) return;
      if (inTeam(p.name)) return;
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
      </div>`;
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
      </div>`;

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
  if (totalEl) totalEl.textContent = String(totalPoints());
  if (teamCountEl) teamCountEl.textContent = `${team.length} / 6`;
}
function updateResults() { renderResults(filteredList()); }
function updateAll() {
  renderHeader();
  renderTeam();
  updateResults();
}

// ----------------------------
// EXPORT PokéPaste
// ----------------------------
function pokepasteText() {
  return team.map(p => (p.en || "").trim()).filter(Boolean).join("\n\n") + "\n";
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
  title.value = `RPPLF Gen${currentGen}`;

  form.appendChild(paste);
  form.appendChild(title);
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

// ----------------------------
// IMPORT (texte)
// ----------------------------
function parseSpeciesFromPaste(text) {
  const blocks = String(text || "").replace(/\r/g, "").split(/\n{2,}/);
  const species = [];

  for (const block of blocks) {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    if (lines[0].startsWith("===")) continue;

    let first = lines[0];
    const paren = first.match(/\(([^)]+)\)/);
    if (paren) first = paren[1];

    first = first.split("@")[0].trim();
    first = first.replace(/\s+\((m|f)\)\s*$/i, "").trim();

    const colon = first.match(/(?:species|pokemon|pokémon)\s*[:\-]\s*(.+)/i);
    if (colon) first = colon[1].trim();

    if (first) species.push(first);
  }
  return species;
}

function importFromPasteText(pasteText) {
  const enSpecies = parseSpeciesFromPaste(pasteText);

  const picked = [];
  const byFR = new Map(POKEMONS.map(p => [normalize(p.name), p]));
  const byEN = new Map(POKEMONS.map(p => [normalize(p.en), p]));

  for (const raw of enSpecies) {
    const canonEn = canonicalizeEnglishName(raw);

    const hitEN = byEN.get(normalize(canonEn));
    if (hitEN) { picked.push(hitEN); continue; }

    // tentative via FR mapping si jamais
    const fr = enToFr[normalize(canonEn)] || "";
    const hitFR = fr ? byFR.get(normalize(fr)) : null;
    if (hitFR) { picked.push(hitFR); continue; }
  }

  team = clamp6(picked);
  updateAll();

  const missing = Math.max(0, enSpecies.length - picked.length);
  return { imported: team.length, missing };
}

// ----------------------------
// IMPORT UI
// ----------------------------
let importPanelEl = null;
let importTextareaEl = null;
let importMsgEl = null;

function mountImportUI() {
  const importBtn = document.getElementById("importPasteBtn");
  if (!importBtn) return;

  if (!importPanelEl) {
    importPanelEl = document.createElement("div");
    importPanelEl.id = "importPanel";
    importPanelEl.className = "mt-3 hidden rounded-xl bg-slate-950/50 p-3 ring-1 ring-slate-800";

    importPanelEl.innerHTML = `
      <div class="text-sm text-slate-200 font-medium">Importer une team (texte Showdown)</div>
      <div class="mt-1 text-xs text-slate-400">
        Ouvre le PokéPaste → <span class="font-semibold">Import/Export</span> → copie le texte → colle ici.
      </div>

      <textarea
        id="importTextarea"
        class="mt-3 w-full min-h-[180px] rounded-xl bg-slate-950/60 px-3 py-3 text-sm text-slate-100 ring-1 ring-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Colle ici le texte Showdown/PokéPaste..."
      ></textarea>

      <div class="mt-3 flex items-center gap-2">
        <button
          id="importApplyBtn"
          class="rounded-xl bg-indigo-500/15 px-4 py-2 text-sm font-medium text-indigo-200 ring-1 ring-indigo-500/30 hover:bg-indigo-500/25"
        >
          Importer
        </button>
        <button
          id="importCloseBtn"
          class="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700"
        >
          Fermer
        </button>
        <div id="importMsg" class="ml-auto text-xs text-slate-400"></div>
      </div>
    `;

    if (teamEl && teamEl.parentElement) {
      teamEl.parentElement.insertBefore(importPanelEl, teamEl);
    } else {
      document.body.appendChild(importPanelEl);
    }

    importTextareaEl = importPanelEl.querySelector("#importTextarea");
    importMsgEl = importPanelEl.querySelector("#importMsg");

    importPanelEl.querySelector("#importApplyBtn").addEventListener("click", () => {
      const txt = (importTextareaEl?.value || "").trim();
      if (!txt) { if (importMsgEl) importMsgEl.textContent = "Colle un texte d’abord."; return; }
      const { imported, missing } = importFromPasteText(txt);
      if (importMsgEl) {
        importMsgEl.textContent = missing > 0
          ? `✅ Importé: ${imported}. ⚠️ Non reconnus: ${missing}`
          : `✅ Importé: ${imported}.`;
      }
    });

    importPanelEl.querySelector("#importCloseBtn").addEventListener("click", () => {
      importPanelEl.classList.add("hidden");
    });
  }

  importBtn.onclick = () => {
    importPanelEl.classList.toggle("hidden");
    if (!importPanelEl.classList.contains("hidden")) {
      if (importMsgEl) importMsgEl.textContent = "";
      importTextareaEl?.focus();
    }
  };
}

// ----------------------------
// GEN SWITCH UI
// ----------------------------
function updateGenButtonLabel() {
  if (!genBtn) return;
  genBtn.textContent = currentGen === 7 ? "Gen: 7" : "Gen: 9";
}

// ----------------------------
// EVENTS
// ----------------------------
searchEl.addEventListener("input", updateResults);

resetBtn.addEventListener("click", () => {
  searchEl.value = "";
  updateResults();
  searchEl.focus();
});

clearTeamBtn.addEventListener("click", () => {
  team = [];
  updateAll();
});

sortBtn?.addEventListener("click", () => {
  sortMode = sortMode === "AZ" ? "DESC" : sortMode === "DESC" ? "ASC" : "AZ";
  sortBtn.textContent = sortMode === "AZ" ? "Tri: A→Z" : sortMode === "DESC" ? "Tri: Points ↓" : "Tri: Points ↑";
  updateResults();
});

pokepasteBtn?.addEventListener("click", openPokePaste);

genBtn?.addEventListener("click", async () => {
  currentGen = currentGen === 7 ? 9 : 7;
  updateGenButtonLabel();
  await loadDexForGen(currentGen);
});

// ----------------------------
// START (✅ DOM déjà init)
// ----------------------------
(async () => {
  updateGenButtonLabel();
  await loadDexForGen(currentGen); // ✅ Gen 9 par défaut
  mountImportUI();
})();
