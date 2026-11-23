// ======================================================
// Team Builder RPPLF — API des règles (Cloudflare Worker)
// Stocke rules.json dans Cloudflare KV. Lecture publique,
// écriture protégée par le mot de passe staff (secret STAFF_PASSWORD).
//
//   GET  /rules  -> les règles (utilisé par le site)
//   GET  /state  -> { version, updatedAt, rules } (utilisé par l'admin)
//   POST /login  -> vérifie le mot de passe
//   PUT  /rules  -> { version, rules } enregistre si version à jour (sinon 409)
// ======================================================

const GENS = ["7", "8", "9"];
const HISTORY_TTL = 60 * 60 * 24 * 180; // anciennes versions gardées 180 jours

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

async function sha256(s) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}

// comparaison à temps constant (sur les hash)
async function isStaff(req, env) {
  const given = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!given || !env.STAFF_PASSWORD) return false;
  const [a, b] = await Promise.all([sha256(given), sha256(env.STAFF_PASSWORD)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function isValidRules(rules) {
  if (!rules || typeof rules !== "object") return false;
  return GENS.every((g) => {
    const r = rules[g];
    return r && typeof r === "object" &&
      r.points && typeof r.points === "object" && !Array.isArray(r.points) &&
      Object.values(r.points).every((v) => Number.isInteger(v) && v >= 0 && v <= 99) &&
      Array.isArray(r.banned) && r.banned.every((x) => typeof x === "string") &&
      r.frNames && typeof r.frNames === "object" && !Array.isArray(r.frNames) &&
      Object.values(r.frNames).every((v) => typeof v === "string");
  });
}

const getState = (env) => env.RULES.get("state", "json");

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    if (req.method === "GET" && pathname === "/rules") {
      const state = await getState(env);
      return state ? json(state.rules) : json({ error: "no rules" }, 404);
    }

    if (req.method === "GET" && pathname === "/state") {
      const state = await getState(env);
      return state ? json(state) : json({ error: "no rules" }, 404);
    }

    if (req.method === "POST" && pathname === "/login") {
      return (await isStaff(req, env)) ? json({ ok: true }) : json({ error: "bad password" }, 401);
    }

    if (req.method === "PUT" && pathname === "/rules") {
      if (!(await isStaff(req, env))) return json({ error: "bad password" }, 401);

      let body;
      try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
      if (!isValidRules(body.rules)) return json({ error: "invalid rules" }, 400);

      const current = await getState(env);
      const currentVersion = current ? current.version : 0;
      if (body.version !== currentVersion) return json({ error: "conflict", version: currentVersion }, 409);

      const next = { version: currentVersion + 1, updatedAt: new Date().toISOString(), rules: body.rules };
      if (current) {
        await env.RULES.put(`history:${String(current.version).padStart(6, "0")}`, JSON.stringify(current), { expirationTtl: HISTORY_TTL });
      }
      await env.RULES.put("state", JSON.stringify(next));
      return json({ version: next.version, updatedAt: next.updatedAt });
    }

    return json({ error: "not found" }, 404);
  },
};
