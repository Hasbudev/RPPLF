// ======================================================
// Team Builder RPPLF — admin.js
// Édite rules.json et l'enregistre via l'API GitHub (commit direct).
// ======================================================

const DEFAULT_REPO = "Hasbudev/RPPLF";
const DEFAULT_BRANCH = "main";
const RULES_FILE = "rules.json";
const STORAGE_KEY = "rpplf-admin";

// ----------------------------
// STATE
// ----------------------------
let baseline = null;  // rules tels que chargés (ou dernier enregistrement)
let working = null;   // rules en cours d'édition
let remoteSha = null; // sha du fichier sur GitHub (null = fichier absent)
let canSave = false;  // false si on n'a pas pu lire GitHub
let DEXES = {};       // gen -> dex data
let currentGen = 9;
let rows = [];        // lignes affichées pour la gen courante

const clone = (x) => JSON.parse(JSON.stringify(x));

// ----------------------------
// DOM
// ----------------------------
const $ = (id) => document.getElementById(id);
const repoInput = $("repoInput");
const branchInput = $("branchInput");
const tokenInput = $("tokenInput");
const rememberInput = $("rememberInput");
const loadBtn = $("loadBtn");
const sourceStatus = $("sourceStatus");
const genTabs = $("genTabs");
const searchEl = $("search");
const filterSelect = $("filterSelect");
const rowsEl = $("rows");
const resultCountEl = $("resultCount");
const addForm = $("addForm");
const addName = $("addName");
const addPoints = $("addPoints");
const addHint = $("addHint");
const changesBtn = $("changesBtn");
const changesCount = $("changesCount");
const changesPanel = $("changesPanel");
const discardBtn = $("discardBtn");
const saveBtn = $("saveBtn");
const saveStatus = $("saveStatus");

// ----------------------------
// SETTINGS (localStorage)
// ----------------------------
function loadSettings() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch {}
  repoInput.value = s.repo || DEFAULT_REPO;
  branchInput.value = s.branch || DEFAULT_BRANCH;
  tokenInput.value = s.token || "";
  rememberInput.checked = !!s.token;
}

function saveSettings() {
  const s = { repo: repoInput.value.trim(), branch: branchInput.value.trim() };
  if (rememberInput.checked && tokenInput.value.trim()) s.token = tokenInput.value.trim();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

// ----------------------------
// GITHUB API
// ----------------------------
function b64EncodeUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function b64DecodeUtf8(b64) {
  const bin = atob(b64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

function ghHeaders() {
  const h = { Accept: "application/vnd.github+json" };
  const token = tokenInput.value.trim();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function contentsUrl() {
  const repo = repoInput.value.trim() || DEFAULT_REPO;
  return `https://api.github.com/repos/${repo}/contents/${RULES_FILE}`;
}

// -> { rules, sha } | { missing: true }
async function ghGetRules() {
  const branch = branchInput.value.trim() || DEFAULT_BRANCH;
  const r = await fetch(`${contentsUrl()}?ref=${encodeURIComponent(branch)}`, { headers: ghHeaders(), cache: "no-store" });
  if (r.status === 404) return { missing: true };
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  const data = await r.json();
  return { rules: JSON.parse(b64DecodeUtf8(data.content)), sha: data.sha };
}

async function ghPutRules(rules, message, sha) {
  const body = {
    message,
    content: b64EncodeUtf8(serializeRules(rules)),
    branch: branchInput.value.trim() || DEFAULT_BRANCH,
  };
  if (sha) body.sha = sha;
  const r = await fetch(contentsUrl(), {
    method: "PUT",
    headers: { ...ghHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const err = new Error(`GitHub ${r.status}`);
    err.status = r.status;
    throw err;
  }
  return r.json();
}

// ----------------------------
// LOAD
// ----------------------------
async function loadAll() {
  if (hasChanges() && !confirmDiscard()) return;
  saveSettings();
  sourceStatus.textContent = "Chargement…";
  saveStatus.textContent = "";

  try {
    if (!Object.keys(DEXES).length) {
      const [d7, d9] = await Promise.all([loadDexData(7), loadDexData(9)]);
      DEXES = { 7: d7, 8: { ...d9, gen: 8 }, 9: d9 };
    }

    let rules;
    try {
      const res = await ghGetRules();
      if (res.missing) {
        rules = await loadRules();
        remoteSha = null;
        sourceStatus.textContent = `⚠️ ${RULES_FILE} n'existe pas encore sur GitHub, il sera créé au premier enregistrement.`;
      } else {
        rules = res.rules;
        remoteSha = res.sha;
        sourceStatus.textContent = `✅ Chargé depuis GitHub (${repoInput.value.trim()}@${branchInput.value.trim()}, ${res.sha.slice(0, 7)})`;
      }
      canSave = true;
    } catch (e) {
      rules = await loadRules();
      remoteSha = null;
      canSave = false;
      sourceStatus.textContent = `⚠️ GitHub inaccessible (${e.message}) — copie locale en lecture seule. Vérifie le dépôt / token puis « Recharger ».`;
    }

    baseline = rules;
    working = clone(rules);
    render();
  } catch (e) {
    console.error(e);
    sourceStatus.textContent = `❌ Erreur de chargement : ${e.message}`;
  }
}

// ----------------------------
// RULE HELPERS
// ----------------------------
// Clé d'identité d'un Pokémon dans une gen (même logique que core.js)
const keyCache = new Map();
function keyOf(gen, name) {
  const c = `${gen === 7 ? 7 : 9}|${name}`;
  if (!keyCache.has(c)) keyCache.set(c, gen === 7 ? normalize(name) : normalize(canonicalizeEnglishName(name)));
  return keyCache.get(c);
}

// Index clé -> valeur, mis en cache par objet (les set* remplacent toujours l'objet)
const indexCache = new WeakMap();
function indexed(gen, objOrArr) {
  if (!objOrArr) return new Map();
  let m = indexCache.get(objOrArr);
  if (!m) {
    const entries = Array.isArray(objOrArr) ? objOrArr.map(x => [x, true]) : Object.entries(objOrArr);
    m = new Map(entries.map(([x, v]) => [keyOf(gen, x), v]));
    indexCache.set(objOrArr, m);
  }
  return m;
}

function stateOf(gen, rules, key) {
  const r = rules[gen] || {};
  const k = keyOf(gen, key);
  const name = gen === 7 ? key : frenchNameFor(key, r, DEXES[gen]);
  return {
    points: indexed(gen, r.points).get(k) ?? 0,
    banned: indexed(gen, r.banned).has(k),
    name,
    missingFr: name.endsWith(MISSING_FR_TAG),
  };
}

function setPoints(gen, key, value) {
  const r = working[gen];
  const k = keyOf(gen, key);
  r.points = Object.fromEntries(Object.entries(r.points || {}).filter(([x]) => keyOf(gen, x) !== k));
  if (value > 0) r.points[key] = value;
}

function setBanned(gen, key, banned) {
  const r = working[gen];
  const k = keyOf(gen, key);
  r.banned = (r.banned || []).filter(x => keyOf(gen, x) !== k);
  if (banned) r.banned.push(key);
}

function setFrName(gen, key, value) {
  const r = working[gen];
  const k = keyOf(gen, key);
  r.frNames = Object.fromEntries(Object.entries(r.frNames || {}).filter(([x]) => keyOf(gen, x) !== k));
  const fallback = frenchNameFor(key, { frNames: {} }, DEXES[gen]);
  const v = value.trim();
  if (v && v !== fallback) r.frNames[key] = v;
}

// ----------------------------
// ROWS
// ----------------------------
// Liste de la gen courante + les Pokémon retirés depuis le chargement (pour pouvoir annuler)
function buildRows(gen) {
  const list = buildPokemons(working[gen], DEXES[gen]);
  const seen = new Set(list.map(p => keyOf(gen, p.key)));
  for (const p of buildPokemons(baseline[gen] || {}, DEXES[gen])) {
    if (!seen.has(keyOf(gen, p.key))) list.push(p);
  }
  return list.map(p => ({ key: p.key, en: p.en }));
}

function isModified(gen, key) {
  const a = stateOf(gen, baseline, key), b = stateOf(gen, working, key);
  return a.points !== b.points || a.banned !== b.banned || a.name !== b.name;
}

function filteredRows() {
  const q = normalize(searchEl.value.trim());
  const f = filterSelect.value;
  return rows
    .map((row, i) => ({ row, i, st: stateOf(currentGen, working, row.key) }))
    .filter(({ row, st }) => !q || normalize(st.name).includes(q) || normalize(row.en).includes(q))
    .filter(({ row, st }) =>
      f === "points" ? st.points > 0 && !st.banned :
      f === "banned" ? st.banned :
      f === "modified" ? isModified(currentGen, row.key) :
      f === "missingFr" ? st.missingFr :
      true)
    .sort((a, b) => a.st.name.localeCompare(b.st.name, "fr"));
}

// ----------------------------
// RENDER
// ----------------------------
function render() {
  if (!working) return;
  renderTabs();
  rows = buildRows(currentGen);
  addName.placeholder = currentGen === 7 ? "Nom FR (ex: Méga-Lucario)" : "Nom EN Showdown (ex: Iron Bundle)";
  addHint.textContent = currentGen === 7
    ? "Gen 7 : la liste est en français, ajoute le nom FR exact."
    : "Gen 8/9 : ajoute le nom anglais (Showdown). Le nom FR se règle ensuite dans la colonne « Nom affiché ».";
  filterSelect.querySelector('[value="missingFr"]').hidden = currentGen === 7;
  if (currentGen === 7 && filterSelect.value === "missingFr") filterSelect.value = "all";
  renderRows();
  renderChanges();
}

function renderTabs() {
  genTabs.innerHTML = "";
  for (const g of GENS) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = `Gen ${g}`;
    b.className = "rounded-lg px-3 py-1.5 text-sm font-medium " +
      (g === currentGen ? "bg-indigo-500/25 text-indigo-100" : "text-slate-400 hover:text-slate-200");
    b.addEventListener("click", () => { currentGen = g; render(); });
    genTabs.appendChild(b);
  }
}

const inputCls = "w-full rounded-lg bg-slate-950/60 px-2 py-1.5 ring-1 ring-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40";

function renderRows() {
  const list = filteredRows();
  resultCountEl.textContent = String(list.length);
  rowsEl.innerHTML = "";

  for (const { row, i, st } of list) {
    const tr = document.createElement("tr");
    tr.dataset.i = i;
    tr.className = "border-t border-slate-800/70";
    tr.innerHTML = `
      <td class="px-3 py-1.5">${currentGen === 7
        ? `<span class="font-medium">${escapeHtml(st.name)}</span>`
        : `<input data-f="name" type="text" class="${inputCls}" />`}</td>
      <td class="px-3 py-1.5 text-slate-400">${escapeHtml(row.en)}</td>
      <td class="px-3 py-1.5"><input data-f="points" type="number" min="0" max="99" class="${inputCls}" /></td>
      <td class="px-3 py-1.5 text-center"><input data-f="banned" type="checkbox" class="h-4 w-4 accent-rose-500" /></td>
      <td class="px-3 py-1.5 text-right">
        <button data-f="reset" type="button" title="Annuler les modifs de cette ligne"
          class="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100">↺</button>
      </td>`;
    rowsEl.appendChild(tr);
    paintRow(tr, row, st);
  }

  if (!list.length) {
    rowsEl.innerHTML = `<tr><td colspan="5" class="px-3 py-6 text-center text-slate-500">Aucun résultat.</td></tr>`;
  }
}

// Met à jour une ligne existante sans la recréer (garde le focus pendant la saisie)
function paintRow(tr, row, st = stateOf(currentGen, working, row.key)) {
  const nameEl = tr.querySelector('[data-f="name"]');
  if (nameEl) {
    // on édite le nom sans le tag "(@moyerf)"
    const shown = st.missingFr ? "" : st.name;
    if (document.activeElement !== nameEl) nameEl.value = shown;
    nameEl.placeholder = st.missingFr ? `${row.en} ${MISSING_FR_TAG}` : "";
  }
  const ptsEl = tr.querySelector('[data-f="points"]');
  if (document.activeElement !== ptsEl) ptsEl.value = String(st.points);
  ptsEl.disabled = st.banned;
  tr.querySelector('[data-f="banned"]').checked = st.banned;

  const modified = isModified(currentGen, row.key);
  tr.classList.toggle("bg-indigo-500/10", modified);
  tr.querySelector('[data-f="reset"]').style.visibility = modified ? "visible" : "hidden";
}

// ----------------------------
// CHANGES
// ----------------------------
function listChanges() {
  if (!baseline || !working) return [];
  const out = [];
  for (const g of GENS) {
    const seen = new Set();
    const keys = [
      ...buildPokemons(baseline[g] || {}, DEXES[g]),
      ...buildPokemons(working[g], DEXES[g]),
    ].map(p => p.key);

    for (const key of keys) {
      const k = keyOf(g, key);
      if (seen.has(k)) continue;
      seen.add(k);
      const a = stateOf(g, baseline, key), b = stateOf(g, working, key);
      const parts = [];
      if (a.points !== b.points) parts.push(`points ${a.points} → ${b.points}`);
      if (a.banned !== b.banned) parts.push(b.banned ? "banni" : "débanni");
      if (a.name !== b.name) parts.push(`nom « ${a.name} » → « ${b.name} »`);
      if (parts.length) out.push(`Gen ${g} · ${key} : ${parts.join(", ")}`);
    }
  }
  return out;
}

const hasChanges = () => listChanges().length > 0;
const confirmDiscard = () => window.confirm("Tu as des modifications non enregistrées. Les abandonner ?");

function renderChanges() {
  const changes = listChanges();
  changesCount.textContent = String(changes.length);
  saveBtn.disabled = !changes.length || !canSave;
  discardBtn.disabled = !changes.length;
  changesPanel.innerHTML = changes.length
    ? `<ul class="space-y-1">${changes.map(c => `<li>${escapeHtml(c)}</li>`).join("")}</ul>`
    : `<div class="text-slate-500">Aucune modification.</div>`;
}

// ----------------------------
// SAVE
// ----------------------------
async function save() {
  const changes = listChanges();
  if (!changes.length) return;
  if (!tokenInput.value.trim()) {
    saveStatus.textContent = "❌ Renseigne un token GitHub pour enregistrer.";
    tokenInput.focus();
    return;
  }

  saveSettings();
  saveBtn.disabled = true;
  saveStatus.textContent = "Enregistrement…";

  const message = `admin: ${changes.length} modification(s) des règles\n\n` +
    changes.slice(0, 50).map(c => `- ${c}`).join("\n") +
    (changes.length > 50 ? `\n- … et ${changes.length - 50} autre(s)` : "");

  try {
    const res = await ghPutRules(working, message, remoteSha);
    remoteSha = res.content.sha;
    baseline = clone(working);
    render();
    saveStatus.textContent = `✅ Enregistré (commit ${res.commit.sha.slice(0, 7)}). Le site sera à jour d'ici 1–2 min.`;
  } catch (e) {
    console.error(e);
    saveStatus.textContent =
      e.status === 401 ? "❌ Token invalide ou expiré." :
      e.status === 403 || e.status === 404 ? "❌ Le token n'a pas l'accès en écriture à ce dépôt (Contents : Read and write)." :
      e.status === 409 || e.status === 422 ? "❌ rules.json a changé sur GitHub depuis le chargement. Note tes modifs, « Recharger », puis refais-les." :
      `❌ Échec de l'enregistrement (${e.message}).`;
    renderChanges();
  }
}

// ----------------------------
// EVENTS
// ----------------------------
rowsEl.addEventListener("input", (e) => {
  const tr = e.target.closest("tr[data-i]");
  if (!tr) return;
  const row = rows[Number(tr.dataset.i)];
  const f = e.target.dataset.f;

  if (f === "points") {
    const v = Math.max(0, Math.min(99, parseInt(e.target.value, 10) || 0));
    setPoints(currentGen, row.key, v);
  } else if (f === "banned") {
    setBanned(currentGen, row.key, e.target.checked);
  } else if (f === "name") {
    setFrName(currentGen, row.key, e.target.value);
  }
  paintRow(tr, row);
  renderChanges();
});

// on remet la valeur "propre" quand on quitte le champ (ex: points vides -> 0)
rowsEl.addEventListener("focusout", (e) => {
  const tr = e.target.closest("tr[data-i]");
  // (la ligne a pu être recréée entre-temps : recherche, changement de gen…)
  if (tr) setTimeout(() => tr.isConnected && paintRow(tr, rows[Number(tr.dataset.i)]));
});

rowsEl.addEventListener("click", (e) => {
  const btn = e.target.closest('[data-f="reset"]');
  if (!btn) return;
  const tr = btn.closest("tr[data-i]");
  const row = rows[Number(tr.dataset.i)];
  const st = stateOf(currentGen, baseline, row.key);
  setPoints(currentGen, row.key, st.points);
  setBanned(currentGen, row.key, st.banned);
  if (currentGen !== 7) setFrName(currentGen, row.key, st.missingFr ? "" : st.name);
  paintRow(tr, row);
  renderChanges();
});

addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!working) return;
  const raw = addName.value.trim();
  if (!raw) return;
  const key = currentGen === 7 ? raw : canonicalizeEnglishName(raw);
  const existing = rows.find(r => keyOf(currentGen, r.key) === keyOf(currentGen, key));
  const pts = Math.max(0, Math.min(99, parseInt(addPoints.value, 10) || 0));

  setPoints(currentGen, existing ? existing.key : key, pts);
  addName.value = "";
  searchEl.value = existing ? existing.en : key;
  filterSelect.value = "all";
  render();
  addHint.textContent = existing
    ? `« ${existing.key} » existait déjà : points mis à ${pts}.`
    : `« ${key} » ajouté avec ${pts} pts.`;
});

searchEl.addEventListener("input", renderRows);
filterSelect.addEventListener("change", renderRows);
loadBtn.addEventListener("click", loadAll);
saveBtn.addEventListener("click", save);
changesBtn.addEventListener("click", () => changesPanel.classList.toggle("hidden"));
discardBtn.addEventListener("click", () => {
  if (!hasChanges() || !confirmDiscard()) return;
  working = clone(baseline);
  saveStatus.textContent = "";
  render();
});
rememberInput.addEventListener("change", saveSettings);

window.addEventListener("beforeunload", (e) => {
  if (hasChanges()) { e.preventDefault(); e.returnValue = ""; }
});

// ----------------------------
// START
// ----------------------------
loadSettings();
loadAll();
