// ======================================================
// Team Builder RPPLF — app.js (Gen7/Gen8/Gen9 switch)
// Barèmes, bans et noms FR : rules.json (modifiable via admin.html)
// Helpers + construction de la liste : core.js
// ======================================================

const clamp6 = (arr) => arr.slice(0, 6);

// ----------------------------
// STATE
// ----------------------------
let currentGen = 9;

let RULES = null;  // contenu de rules.json
let DEX = null;    // { gen, list, frToEn, enToFr } de la gen courante
let POKEMONS = []; // { key, name(display), en, points, banned }
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
  return frenchNameFor(enName, RULES[currentGen], DEX);
}

// ----------------------------
// DEX LOADER
// ----------------------------
async function loadDexForGen(gen) {
  try {
    if (!RULES) RULES = await loadRules();
    DEX = await loadDexData(gen);
  } catch (e) {
    if (statusEl) statusEl.textContent = "Erreur de chargement des données.";
    console.error(e);
    return;
  }

  POKEMONS = buildPokemons(RULES[gen], DEX);

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
          <div class="font-medium">${escapeHtml(p.name)}</div>
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
          <div class="font-medium">${escapeHtml(p.name)}</div>
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
  genBtn.textContent = `Gen: ${currentGen}`;
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
  currentGen = currentGen === 7 ? 8 : currentGen === 8 ? 9 : 7;
  updateGenButtonLabel();
  await loadDexForGen(currentGen);
});

// ----------------------------
// START
// ----------------------------
(async () => {
  updateGenButtonLabel();
  await loadDexForGen(currentGen);
  mountImportUI();
})();
