// ======================================================
// Team Builder RPPLF — app.js (Gen7/Gen9 switch)
// Gen7: ton dex FR + mapping FR<->EN
// Gen9: dex "comme Showdown teambuilder" (EN complet) + affichage FR si dispo
// - Recherche FR + EN
// - Tri A→Z / Points ↓ / Points ↑
// - BANNI (rouge, non ajoutable)
// - Export PokéPaste (EN Showdown)
// - Import via texte Showdown/PokéPaste
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
// GEN 7 DATA
// ----------------------------
const BAREME_GEN7 = [
  { name: "Méga-Kangourex", points: 10 },
  { name: "Deoxys-Vitesse", points: 10 },
  { name: "Genesect", points: 10 },
  { name: "Méga-Lucario", points: 10 },
  { name: "Démétéros Avatar", points: 10 },
  { name: "Zygarde 50%", points: 10 },

  { name: "Braségali", points: 8 },
  { name: "Méga-Ténéfix", points: 8 },
  { name: "Méga-Métalosse", points: 8 },
  { name: "Mandrillon", points: 8 },

  { name: "Pyrax", points: 6 },
  { name: "Méga-Mysdibule", points: 6 },
  { name: "Méga-Diancie", points: 6 },
  { name: "Sachanobi", points: 6 },
  { name: "Katagami", points: 6 },
  { name: "Exagide", points: 6 },
  { name: "Magearna", points: 6 },
  { name: "Tokopiyon", points: 6 },
  { name: "Méga-Alakazam", points: 6 },

  { name: "Kyurem Noir", points: 5 },
  { name: "Méga-Léviator", points: 5 },
  { name: "Méga-Laggron", points: 5 },
  { name: "Méga Dracaufeu X", points: 5 },
  { name: "Méga-Dracaufeu Y", points: 5 },
  { name: "Méga-Lockpin", points: 5 },
  { name: "Pierroteknik", points: 5 },
  { name: "Tokorico", points: 5 },

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

const BANNED_NAMES_GEN7 = [
  "Mewtwo","Lugia","Ho-Oh","Groudon","Kyogre","Rayquaza",
  "Deoxys-Attaque","Deoxys-Défense",
  "Palkia","Dialga","Giratina","Giratina-Originel","Darkrai",
  "Shaymin-Céleste","Arceus","Kyurem-Blanc","Reshiram","Zekrom",
  "Xerneas","Yveltal","Zygarde-Complète","Mouscoto","Solgaleo","Lunala",
  "Necrozma-Crinière du Couchant","Marshadow","Gothitelle",
  "Méga-Braségali","Méga-Ectoplasma","Méga-Drattak",
];

const SHOWDOWN_OVERRIDES_GEN7_RAW = {
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
  "Zygarde 50%": "Zygarde-50%",
  "Zeroid": "Nihilego",
};

const EN_TO_FR_OVERRIDES_GEN7 = {
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
  "kyurem-black": "Kyurem Noir",
  "kyurem-white": "Kyurem-Blanc",
  "shaymin-sky": "Shaymin-Céleste",
  "giratina-origin": "Giratina-Originel",
  "zygarde-complete": "Zygarde-Complète",
  "nihilego": "Zeroid",
};

// ----------------------------
// GEN 9 DATA (barème + bans donnés par toi)
// ----------------------------
const BAREME_GEN9 = [
  { name: "Shaymin-Sky", points: 10 },
  { name: "Urshifu Single Strike", points: 10 },
  { name: "Palafin", points: 10 },
  { name: "Chien-Pao", points: 10 },
  { name: "Iron Bundle", points: 10 },

  { name: "Zamazenta", points: 8 },
  { name: "Landorus", points: 8 },

  { name: "Darkrai", points: 6 },
  { name: "Urshifu Rapid Strike", points: 6 },
  { name: "Baxcalibur", points: 6 },
  { name: "Iron Valiant", points: 6 },
  { name: "Walking Wake", points: 6 },
  { name: "Ursaluna Bloodmoon", points: 6 },
  { name: "Gouging Fire", points: 6 },
  { name: "Deoxys-Speed", points: 6 },

  { name: "Kyurem", points: 5 },
  { name: "Sneasler Hisui", points: 5 },
  { name: "Dondozo", points: 5 },
  { name: "Kingambit", points: 5 },
  { name: "Great Tusk", points: 5 },
  { name: "Roaring Moon", points: 5 },
  { name: "Archaludon", points: 5 },

  { name: "Volcarona", points: 4 },
  { name: "Hawlucha", points: 4 },
  { name: "Dragapult", points: 4 },
  { name: "Ursaluna", points: 4 },
  { name: "Enamorus", points: 4 },
  { name: "Espathra", points: 4 },
  { name: "Annihilape", points: 4 },
  { name: "Gholdengo", points: 4 },
  { name: "Ting-Lu", points: 4 },
  { name: "Ogerpon Water", points: 4 },
  { name: "Ogerpon Fire", points: 4 },
  { name: "Raging Bolt", points: 4 },

  { name: "Torkoal", points: 3 },
  { name: "Pelipper", points: 3 },
  { name: "Gliscor", points: 3 },
  { name: "Heatran", points: 3 },
  { name: "Landorus-Therian", points: 3 },
  { name: "Greninja", points: 3 },
  { name: "Rillaboom", points: 3 },
  { name: "Slowking-Galar", points: 3 },
  { name: "Samurott Hisui", points: 3 },
  { name: "Garganacl", points: 3 },
  { name: "Iron Crown", points: 3 },
  { name: "Alomomola", points: 3 },
  { name: "Iron Moth", points: 3 },
  { name: "Iron Boulder", points: 3 },

  { name: "Ninetales", points: 2 },
  { name: "Chansey", points: 2 },
  { name: "Zapdos", points: 2 },
  { name: "Blissey", points: 2 },
  { name: "Tyranitar", points: 2 },
  { name: "Blaziken", points: 2 },
  { name: "Garchomp", points: 2 },
  { name: "Excadrill", points: 2 },
  { name: "Manaphy", points: 2 },
  { name: "Keldeo", points: 2 },
  { name: "Ninetales-Alola", points: 2 },
  { name: "Cinderace", points: 2 },
  { name: "Corviknight", points: 2 },
  { name: "Hatterene", points: 2 },
  { name: "Barraskewda", points: 2 },
  { name: "Meowscarada", points: 2 },
  { name: "Ceruledge", points: 2 },
  { name: "Iron Treads", points: 2 },
  { name: "Ogerpon Rock", points: 2 },
  { name: "Pecharunt", points: 2 },
  { name: "Sinistcha", points: 2 },
  { name: "Moltres", points: 2 },

  { name: "Clefable", points: 1 },
  { name: "Dugtrio", points: 1 },
  { name: "Ditto", points: 1 },
  { name: "Amoonguss", points: 1 },
  { name: "Serperior", points: 1 },
  { name: "Dragonite", points: 1 },
  { name: "Politoed", points: 1 },
  { name: "Latios", points: 1 },
  { name: "Hippowdon", points: 1 },
  { name: "Floatzel", points: 1 },
  { name: "Cresselia", points: 1 },
  { name: "Hoopa-Unbound", points: 1 },
  { name: "Primarina", points: 1 },
  { name: "Ribombee", points: 1 },
  { name: "Toxapex", points: 1 },
  { name: "Indeedee", points: 1 },
  { name: "Lilligant Hisui", points: 1 },
  { name: "Quaquaval", points: 1 },
  { name: "Clodsire", points: 1 },
  { name: "Glimmora", points: 1 },
  { name: "Iron Hands", points: 1 },
  { name: "Tornadus-Therian", points: 1 },
];

const BANNED_NAMES_GEN9 = [
  "Mewtwo","Lugia","Ho-Oh","Groudon","Kyogre","Rayquaza",
  "Deoxys-Attack",
  "Dialga","Dialga-Origin",
  "Palkia","Palkia-Origin",
  "Giratina","Giratina-Origin",
  "Arceus",
  "Kyurem-Black","Kyurem-White",
  "Reshiram","Zekrom",
  "Solgaleo","Lunala",
  "Necrozma",
  "Magearna",
  "Zacian","Zacian-Crowned",
  "Zamazenta-Crowned",
  "Eternatus",
  "Spectrier",
  "Calyrex-Shadow","Calyrex-Ice",
  "Flutter Mane",
  "Chi-Yu",
  "Koraidon","Miraidon",
  "Terapagos",
  "Gothitelle",
];

const SHOWDOWN_OVERRIDES_GEN9_RAW = {};
const EN_TO_FR_OVERRIDES_GEN9 = {
  "ogerpon-wellspring": "Ogerpon-Wellspring",
  "ogerpon-hearthflame": "Ogerpon-Hearthflame",
  "ogerpon-cornerstone": "Ogerpon-Cornerstone",
  "ursaluna-bloodmoon": "Ursaluna-Bloodmoon",
  "urshifu-rapid-strike": "Urshifu-Rapid-Strike",
  "samurott-hisui": "Samurott-Hisui",
  "lilligant-hisui": "Lilligant-Hisui",
  "slowking-galar": "Slowking-Galar",
  "deoxys-speed": "Deoxys-Speed",
  "deoxys-attack": "Deoxys-Attack",
  "deoxys-defense": "Deoxys-Defense",
  "calyrex-shadow": "Calyrex-Shadow",
  "calyrex-ice": "Calyrex-Ice",
  "terapagos-stellar": "Terapagos-Stellar",
  "terapagos-terastal": "Terapagos-Terastal",
};

// ----------------------------
// CONFIG PAR GEN
// ----------------------------
function buildOverrides(raw) {
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [normalize(k), v]));
}

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
      enToFrOverrides: EN_TO_FR_OVERRIDES_GEN9,
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
    enToFrOverrides: EN_TO_FR_OVERRIDES_GEN7,
    title: "Gen: 7",
  };
}

// ----------------------------
// STATE
// ----------------------------
let currentGen = 7;
let CONFIG = getGenConfig(currentGen);

let POKEMONS = []; // { name(display), en, points, banned }
let frToEn = {};   // normalize(fr) -> en
let enToFr = {};   // normalize(en) -> fr
let sortMode = "AZ";
let team = [];

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
const genBtn = document.getElementById("genBtn");

// ----------------------------
// NAME CONVERT (EN -> FR)
// ----------------------------
function toFrenchNameFromEnglish(enName) {
  const canon = canonicalizeEnglishName(enName);
  const k = normalize(canon);

  if (CONFIG.enToFrOverrides && CONFIG.enToFrOverrides[k]) return CONFIG.enToFrOverrides[k];
  if (enToFr && enToFr[k]) return enToFr[k];

  // fallback: on garde EN si on n'a pas la trad
  return canon;
}

// ----------------------------
// DEX LOADER
// ----------------------------
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

async function loadDexForGen(gen) {
  CONFIG = getGenConfig(gen);

  // --- GEN7: comme avant ---
  if (gen === 7) {
    const [dexFrRes, frEnRes] = await Promise.all([
      fetch(CONFIG.dexFrPath),
      fetch(CONFIG.mapFrEnPath),
    ]);

    let dexFR = await dexFrRes.json();
    const pairs = await frEnRes.json();

    frToEn = Object.fromEntries(pairs.map(p => [normalize(p.fr), p.en]));
    enToFr = Object.fromEntries(pairs.map(p => [normalize(p.en), p.fr]));

    const pointsByName = {};
    for (const it of CONFIG.bareme) {
      const nm = canonicalizeEnglishName(it.name);
      addBothKeysToMap(pointsByName, nm, it.points, { frToEnLocal: frToEn, enToFrLocal: enToFr });
    }

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

    // extras (gen7 OK, déjà FR)
    const extras = [
      ...CONFIG.bareme.map(p => p.name),
      ...CONFIG.bannedNames,
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
      const en = CONFIG.showdownOverrides[k] || frToEn[k] || name;

      const ken = normalize(canonicalizeEnglishName(en));
      const isPrefixBanned =
        bannedPrefixes.some(pref => ken.startsWith(pref)) ||
        bannedPrefixes.some(pref => k.startsWith(pref));

      const banned = bannedSet.has(k) || bannedSet.has(ken) || isPrefixBanned;
      const points = banned ? 0 : (pointsByName[k] ?? pointsByName[ken] ?? 0);

      return { name, en, points, banned };
    });

    team = [];
    searchEl.value = "";
    updateAll();
    mountImportUI();
    updateGenButtonLabel();
    return;
  }

  // --- GEN9: liste EN "comme Showdown" + affichage FR si on sait traduire ---
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

  const pointsByName = {};
  for (const it of CONFIG.bareme) {
    const nm = canonicalizeEnglishName(it.name);
    addBothKeysToMap(pointsByName, nm, it.points, { frToEnLocal: frToEn, enToFrLocal: enToFr });
  }

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

  // ✅ on construit la liste depuis EN (pas de doublons FR/EN possibles)
  // ✅ on ajoute quand même les extras au cas où (bans/barème hors dex EN)
  const extrasEN = [
    ...CONFIG.bareme.map(p => canonicalizeEnglishName(p.name)),
    ...CONFIG.bannedNames.map(n => canonicalizeEnglishName(n)),
  ];

  const allEN = (() => {
  const seen = new Set();
  const out = [];
  const push = (x) => {
    if (!x) return;

    // ✅ clé de dédoublonnage basée sur le nom canonicalisé
    const canon = canonicalizeEnglishName(x);
    const k = normalize(canon);
    if (!k || seen.has(k)) return;

    seen.add(k);
    // ✅ on stocke directement la version canonicalisée
    out.push(canon);
  };

  dexEN.forEach(push);
  extrasEN.forEach(push);
  return out;
})();

  POKEMONS = allEN.map((enRaw) => {
    const enCanon = canonicalizeEnglishName(enRaw);
    const ken = normalize(enCanon);

    const display = toFrenchNameFromEnglish(enCanon);
    const kdisplay = normalize(display);

    const isPrefixBanned =
      bannedPrefixes.some(pref => ken.startsWith(pref)) ||
      bannedPrefixes.some(pref => kdisplay.startsWith(pref));

    const banned = bannedSet.has(ken) || bannedSet.has(kdisplay) || isPrefixBanned;
    const points = banned ? 0 : (pointsByName[ken] ?? pointsByName[kdisplay] ?? 0);

    return { name: display, en: enCanon, points, banned };
  });

  team = [];
  searchEl.value = "";
  updateAll();
  mountImportUI();
  updateGenButtonLabel();
  const test = POKEMONS.find(p => normalize(p.en) === "serperior");
console.log("TEST Serperior->", test);
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
  return team.map(p => (p.en || p.name).trim()).filter(Boolean).join("\n\n") + "\n";
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

  for (const rawEn of enSpecies) {
    const canonEn = canonicalizeEnglishName(rawEn);

    const hitEN = byEN.get(normalize(canonEn));
    if (hitEN) { picked.push(hitEN); continue; }

    const fr = toFrenchNameFromEnglish(canonEn);
    const hitFR = byFR.get(normalize(fr));
    if (hitFR) { picked.push(hitFR); continue; }

    const hitEN2 = byEN.get(normalize(rawEn));
    if (hitEN2) picked.push(hitEN2);
  }

  team = clamp6(picked);
  updateAll();

  const missing = Math.max(0, enSpecies.length - picked.length);
  return { imported: team.length, missing };
}

// ----------------------------
// IMPORT UI (panneau)
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

    // insertion: juste avant la grid de team, ou au-dessus de teamEl
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

  // toggle (évite d'empiler des listeners)
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
// START
// ----------------------------
(async () => {
  updateGenButtonLabel();
  await loadDexForGen(7);
  mountImportUI();
})();
