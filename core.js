// ======================================================
// Team Builder RPPLF — core.js
// Logique partagée entre le site (app.js) et l'admin (admin.js).
// Les barèmes / bans / noms FR vivent dans rules.json.
// ======================================================

// ----------------------------
// HELPERS
// ----------------------------
const MISSING_FR_TAG = "(@moyerf)";
const RULES_PATH = "./rules.json";
const GENS = [7, 8, 9];

const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

// Les noms viennent de rules.json (éditable) -> on échappe avant innerHTML
const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

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
  darmanitanstandard: "Darmanitan", // au cas où un dex le liste
  darmanitangalarzen: "Darmanitan-Galar",
  darmanitangalarstandard: "Darmanitan-Galar",

  // Cramorant (formes Gulping/Gorging)
  cramorantgulping: "Cramorant",
  cramorantgorging: "Cramorant",

  // Morpeko (Hangry mode)
  morpekohangry: "Morpeko",

  // Meloetta (Pirouette)
  meloettapirouette: "Meloetta",

  // Necrozma (Ultra) — si jamais un dex le sort séparé (souvent banni chez toi)
  necrozmaultra: "Necrozma",

  // Greninja battle-only forms
  greninjabond: "Greninja",
  greninjaash: "Greninja",

  // Zygarde (Complete) — idem (souvent banni chez toi)
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
// CONFIG PAR GEN (fichiers dex)
// ----------------------------
// Gen 7 : liste FR, la clé d'un Pokémon = son nom FR.
// Gen 8/9 : liste EN Showdown, la clé d'un Pokémon = son nom EN canonique.
function getDexConfig(gen) {
  if (gen === 7) {
    return {
      dexFrPath: "./dex-fr-gen1-7.json",
      mapPaths: ["./dex-gen1-7-fr-en.json"],
    };
  }
  return {
    dexEnPath: "./dex-en-showdown-gen9.json",
    mapPaths: ["./dex-gen1-7-fr-en.json", "./dex-gen9-fr-en.json"],
  };
}

// ----------------------------
// LOADERS
// ----------------------------
async function fetchJson(path) {
  const r = await fetch(path, { cache: "no-cache" });
  if (!r.ok) throw new Error(`Impossible de charger ${path} (${r.status})`);
  return r.json();
}

async function loadRules() {
  return fetchJson(RULES_PATH);
}

// Charge les fichiers dex d'une gen (sans les règles)
async function loadDexData(gen) {
  const cfg = getDexConfig(gen);
  const [list, ...maps] = await Promise.all([
    fetchJson(gen === 7 ? cfg.dexFrPath : cfg.dexEnPath),
    ...cfg.mapPaths.map(fetchJson),
  ]);
  const pairs = maps.flat();
  return {
    gen,
    list,
    frToEn: Object.fromEntries(pairs.map(p => [normalize(p.fr), p.en])),
    enToFr: Object.fromEntries(pairs.map(p => [normalize(p.en), p.fr])),
  };
}

// ----------------------------
// BUILD LIST
// ----------------------------
// mis en cache par objet (l'admin remplace l'objet à chaque modif, jamais en place)
const normalizedMapCache = new WeakMap();
function normalizedMap(obj) {
  if (!obj) return {};
  let m = normalizedMapCache.get(obj);
  if (!m) {
    m = Object.fromEntries(Object.entries(obj).map(([k, v]) => [normalize(k), v]));
    normalizedMapCache.set(obj, m);
  }
  return m;
}

// Nom FR à afficher pour un nom EN (override admin > mapping dex > EN + tag)
function frenchNameFor(enName, genRules, dex) {
  const canon = canonicalizeEnglishName(enName);
  const k = normalize(canon);
  const overrides = normalizedMap(genRules.frNames);
  if (overrides[k]) return overrides[k];
  if (dex.enToFr[k]) return dex.enToFr[k];
  return `${canon} ${MISSING_FR_TAG}`;
}

// Retourne [{ key, name(display), en, points, banned }]
function buildPokemons(genRules, dex) {
  const points = normalizedMap(genRules.points);
  const banned = new Set((genRules.banned || []).map(normalize));
  const extras = [...Object.keys(genRules.points || {}), ...(genRules.banned || [])];

  // Gen 7 : liste FR
  if (dex.gen === 7) {
    const showdown = normalizedMap(genRules.showdownNames);
    // pas de dédoublonnage dans le dex lui-même (Nidoran♂ / Nidoran♀ ont la même clé)
    const seen = new Set(dex.list.map(normalize));
    const out = [];
    for (const [i, name] of [...dex.list, ...extras].entries()) {
      const k = normalize(name);
      if (i >= dex.list.length) {
        if (!k || seen.has(k)) continue;
        seen.add(k);
      }
      const en = showdown[k] || dex.frToEn[k] || name;
      const isBanned = banned.has(k);
      out.push({ key: name, name, en, points: isBanned ? 0 : (points[k] ?? 0), banned: isBanned });
    }
    return out;
  }

  // Gen 8/9 : liste EN "comme Showdown" + affichage FR si on sait traduire
  const seen = new Set();
  const out = [];
  for (const raw of [...dex.list, ...extras]) {
    const en = canonicalizeEnglishName(raw);
    const k = normalize(en);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    const isBanned = banned.has(k);
    out.push({
      key: en,
      name: frenchNameFor(en, genRules, dex),
      en,
      points: isBanned ? 0 : (points[k] ?? 0),
      banned: isBanned,
    });
  }
  return out;
}

// ----------------------------
// SERIALIZE (ordre stable pour des diffs git lisibles)
// ----------------------------
function serializeRules(rules) {
  const byName = (a, b) => a.localeCompare(b, "fr");
  const out = {};
  for (const g of GENS) {
    const r = rules[g] || {};
    const gen = {
      points: Object.fromEntries(
        Object.entries(r.points || {})
          .filter(([, v]) => v > 0)
          .sort(([a, va], [b, vb]) => vb - va || byName(a, b))
      ),
      banned: [...(r.banned || [])].sort(byName),
      frNames: Object.fromEntries(Object.entries(r.frNames || {}).sort(([a], [b]) => byName(a, b))),
    };
    if (r.showdownNames) {
      gen.showdownNames = Object.fromEntries(Object.entries(r.showdownNames).sort(([a], [b]) => byName(a, b)));
    }
    out[g] = gen;
  }
  return JSON.stringify(out, null, 2) + "\n";
}
