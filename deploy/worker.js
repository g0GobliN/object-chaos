// Static asset host for OBJECT CHAOS plus the one bit of server state the game
// needs: a leaderboard of finished rounds in D1. Everything else is prebuilt
// into ./dist-static (see README → Deployment) and served from env.ASSETS.

const MAX_SCORE = 600;
// Every real total is a sum of three rounds paying 150, or 200 for a quick answer.
const ALLOWED_SCORES = new Set([0, 150, 200, 300, 350, 400, 450, 500, 550, 600]);
const MAX_NAME = 16;
const TOP_COUNT = 10;
const MODES = new Set(["find", "roast"]);

// Schema is created lazily on the first API request, once per isolate.
let schemaReady = null;

function ensureSchema(env) {
  if (!schemaReady) {
    schemaReady = env.DB.batch([
      env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS scores (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           name TEXT NOT NULL,
           score INTEGER NOT NULL,
           mode TEXT NOT NULL,
           created_at TEXT NOT NULL DEFAULT (datetime('now'))
         )`,
      ),
      env.DB.prepare(
        `CREATE INDEX IF NOT EXISTS scores_rank ON scores (mode, score DESC, created_at ASC)`,
      ),
    ]).catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function cleanName(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
  return /^[\p{L}\p{N} ._'-]{2,16}$/u.test(trimmed) ? trimmed : "";
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

// One isolate's view of submissions per client, enough to stop trivial spam.
const recent = new Map();

function throttled(request) {
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const now = Date.now();
  const entry = recent.get(ip);
  if (!entry || now - entry.started > 60_000) {
    recent.set(ip, { started: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > 10;
}

async function topScores(env, mode) {
  const { results } = await env.DB.prepare(
    `SELECT name, score, created_at AS createdAt
       FROM scores
      WHERE mode = ?1
      ORDER BY score DESC, created_at ASC
      LIMIT ${TOP_COUNT}`,
  )
    .bind(mode)
    .all();
  return results ?? [];
}

async function leaderboard(request, env) {
  if (!env.DB) return json({ error: "Leaderboard storage is not configured" }, 503);

  if (request.method === "GET") {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") ?? "find";
    if (!MODES.has(mode)) return json({ error: "Unknown mode" }, 400);
    await ensureSchema(env);
    return json({ entries: await topScores(env, mode) });
  }

  // Moderation: remove every entry under a name, for spam and for the owner's own tests.
  if (request.method === "DELETE") {
    const token = request.headers.get("x-board-token") ?? "";
    if (!env.BOARD_TOKEN || token !== env.BOARD_TOKEN) {
      return json({ error: "Not allowed" }, 401);
    }
    const name = cleanName(new URL(request.url).searchParams.get("name") ?? "");
    if (!name) return json({ error: "Name required" }, 400);
    await ensureSchema(env);
    const result = await env.DB.prepare(`DELETE FROM scores WHERE name = ?1`).bind(name).run();
    return json({ deleted: result.meta?.changes ?? 0 });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  if (!sameOrigin(request)) return json({ error: "Cross-origin submission refused" }, 403);
  if (throttled(request)) return json({ error: "Slow down a second" }, 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Expected JSON" }, 400);
  }

  const name = cleanName(body?.name);
  if (!name) return json({ error: "Pick a name with 2–16 letters" }, 400);

  const mode = typeof body?.mode === "string" ? body.mode : "find";
  if (!MODES.has(mode)) return json({ error: "Unknown mode" }, 400);

  const score = Number(body?.score);
  if (!Number.isInteger(score) || !ALLOWED_SCORES.has(score) || score > MAX_SCORE) {
    return json({ error: "That score is not a real round" }, 400);
  }

  await ensureSchema(env);
  await env.DB.prepare(`INSERT INTO scores (name, score, mode) VALUES (?1, ?2, ?3)`)
    .bind(name, score, mode)
    .run();

  return json({ entries: await topScores(env, mode) }, 201);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/leaderboard") {
      try {
        return await leaderboard(request, env);
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Leaderboard failed" }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
