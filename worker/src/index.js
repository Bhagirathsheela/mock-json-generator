// =====================================================================
// Mock JSON Generator — Cloudflare Worker backend (single file).
//
// One platform, one deploy. Storage is the KV namespace bound as
// `MOCK_KV` in wrangler.toml — no external database, no token-copying.
//
// Routes (mirrors the original Vercel API):
//   POST   /api/mock                 create a collection            (public)
//   GET    /api/mock/:id             read whole collection          (public)
//   POST   /api/mock/:id             add a record                   (public)
//   PUT    /api/mock/:id             replace whole collection       (OWNER)
//   DELETE /api/mock/:id             delete whole collection        (OWNER)
//   GET    /api/mock/:id/:itemId     read one record                (public)
//   PUT    /api/mock/:id/:itemId     replace one record             (public)
//   PATCH  /api/mock/:id/:itemId     merge fields into a record     (public)
//   DELETE /api/mock/:id/:itemId     delete one record              (public)
// =====================================================================

const TTL_SECONDS = 60 * 60 * 24 * 30; // collections expire 30 days after last write
const MAX_BYTES = 256 * 1024;          // 256 KB payload cap
const keyOf = (id) => `mock:${id}`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-edit-token",
  "Access-Control-Max-Age": "86400",
};

function json(status, body, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS, ...extra },
  });
}

// ---- id / token helpers (Web Crypto, available in Workers) ----
const ALPHA = "abcdefghijklmnopqrstuvwxyz0123456789";
function shortId(n = 8) {
  const b = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(b, (x) => ALPHA[x % ALPHA.length]).join("");
}
function makeEditToken() {
  const b = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function sha256hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
async function verifyToken(req, collection) {
  const provided = req.headers.get("x-edit-token");
  if (!provided || !collection?.meta?.editTokenHash) return false;
  return (await sha256hex(provided)) === collection.meta.editTokenHash;
}

// ---- collection helpers ----
function normalizeItems(data, startSeq = 0) {
  const arr = Array.isArray(data) ? data : data && Array.isArray(data.data) ? data.data : [data];
  let seq = startSeq;
  const items = arr
    .filter((x) => x && typeof x === "object")
    .map((rec) => {
      if (rec.id != null) {
        const n = Number(rec.id);
        if (Number.isFinite(n)) seq = Math.max(seq, n);
        return { ...rec, id: String(rec.id) };
      }
      return { ...rec, id: String(++seq) };
    });
  return { items, seq };
}
const publicView = (c) => (c.meta.wrap === "object" ? { data: c.items } : c.items);
const tooLarge = (v) => new TextEncoder().encode(JSON.stringify(v)).length > MAX_BYTES;

async function readBody(req) {
  try { return await req.json(); } catch { return null; }
}

// ---- best-effort in-isolate rate limit (no KV writes) ----
// For production-grade limits, enable Cloudflare WAF rate-limiting rules
// in the dashboard — no code required.
const buckets = new Map();
function rateLimited(ip, kind) {
  const limits = { read: [120, 60000], write: [40, 60000], create: [10, 60000] };
  const [max, windowMs] = limits[kind] || limits.read;
  const now = Date.now();
  const k = `${kind}:${ip}`;
  const hits = (buckets.get(k) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) return true;
  hits.push(now);
  buckets.set(k, hits);
  return false;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (!env.MOCK_KV) return json(500, { error: "KV namespace 'MOCK_KV' is not bound" });

    const url = new URL(request.url);
    const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/"); // ["api","mock", id?, itemId?]
    const ip = request.headers.get("cf-connecting-ip") || "anonymous";

    if (parts[0] !== "api" || parts[1] !== "mock") {
      return json(404, { error: "Not found" });
    }

    const id = parts[2];
    const itemId = parts[3];
    const method = request.method;

    // --- POST /api/mock : create a collection ---
    if (!id) {
      if (method !== "POST") return json(405, { error: "Method not allowed" });
      if (rateLimited(ip, "create")) return json(429, { error: "Rate limit exceeded. Please slow down." }, { "Retry-After": "60" });

      const body = await readBody(request);
      if (!body || body.data == null) return json(400, { error: "Missing 'data'" });
      if (tooLarge(body.data)) return json(413, { error: "Payload too large (max 256 KB)" });

      const { items, seq } = normalizeItems(body.data);
      if (items.length === 0) return json(400, { error: "'data' must contain at least one object" });

      const newId = shortId(8);
      const token = makeEditToken();
      const now = Date.now();
      const collection = {
        meta: {
          name: typeof body.name === "string" ? body.name.slice(0, 120) : "Mock collection",
          wrap: body.wrap === "object" ? "object" : "array",
          editTokenHash: await sha256hex(token),
          seq, createdAt: now, updatedAt: now,
        },
        items,
      };
      await env.MOCK_KV.put(keyOf(newId), JSON.stringify(collection), { expirationTtl: TTL_SECONDS });

      return json(201, {
        id: newId,
        url: `${url.origin}/api/mock/${newId}`,
        editToken: token,
        name: collection.meta.name,
        count: items.length,
      });
    }

    // Load the collection for all id-scoped routes.
    const collection = await env.MOCK_KV.get(keyOf(id), "json");
    if (!collection) return json(404, { error: "Collection not found" });
    if (rateLimited(ip, method === "GET" ? "read" : "write"))
      return json(429, { error: "Rate limit exceeded. Please slow down." }, { "Retry-After": "60" });

    const save = () => env.MOCK_KV.put(keyOf(id), JSON.stringify(collection), { expirationTtl: TTL_SECONDS });

    // --- /api/mock/:id (collection-level) ---
    if (!itemId) {
      switch (method) {
        case "GET":
          return json(200, publicView(collection));

        case "POST": {
          const body = await readBody(request);
          if (!body || typeof body !== "object") return json(400, { error: "Body must be a JSON object" });
          const nextSeq = collection.meta.seq + 1;
          const item = { ...body, id: body.id != null ? String(body.id) : String(nextSeq) };
          collection.items.push(item);
          collection.meta.seq = Math.max(nextSeq, collection.meta.seq);
          collection.meta.updatedAt = Date.now();
          if (tooLarge(collection)) return json(413, { error: "Collection size limit reached" });
          await save();
          return json(201, item);
        }

        case "PUT": {
          if (!(await verifyToken(request, collection))) return json(403, { error: "Valid x-edit-token required" });
          const body = await readBody(request);
          const payload = body?.data ?? body;
          if (tooLarge(payload)) return json(413, { error: "Payload too large (max 256 KB)" });
          const { items, seq } = normalizeItems(payload);
          collection.items = items;
          collection.meta.seq = seq;
          collection.meta.updatedAt = Date.now();
          await save();
          return json(200, publicView(collection));
        }

        case "DELETE":
          if (!(await verifyToken(request, collection))) return json(403, { error: "Valid x-edit-token required" });
          await env.MOCK_KV.delete(keyOf(id));
          return json(200, { deleted: true, id });

        default:
          return json(405, { error: "Method not allowed" });
      }
    }

    // --- /api/mock/:id/:itemId (item-level, all public) ---
    const idx = collection.items.findIndex((it) => String(it.id) === String(itemId));
    if (idx === -1 && method !== "GET") return json(404, { error: "Record not found" });

    switch (method) {
      case "GET":
        if (idx === -1) return json(404, { error: "Record not found" });
        return json(200, collection.items[idx]);

      case "PUT": {
        const body = await readBody(request);
        collection.items[idx] = { ...body, id: String(itemId) };
        collection.meta.updatedAt = Date.now();
        if (tooLarge(collection)) return json(413, { error: "Collection size limit reached" });
        await save();
        return json(200, collection.items[idx]);
      }

      case "PATCH": {
        const body = await readBody(request);
        collection.items[idx] = { ...collection.items[idx], ...body, id: String(itemId) };
        collection.meta.updatedAt = Date.now();
        if (tooLarge(collection)) return json(413, { error: "Collection size limit reached" });
        await save();
        return json(200, collection.items[idx]);
      }

      case "DELETE": {
        const [removed] = collection.items.splice(idx, 1);
        collection.meta.updatedAt = Date.now();
        await save();
        return json(200, { deleted: true, id: removed.id });
      }

      default:
        return json(405, { error: "Method not allowed" });
    }
  },
};
