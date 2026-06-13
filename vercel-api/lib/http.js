// Shared HTTP helpers: permissive CORS (so end users can call the public
// GET endpoints from any app) plus small response/parse utilities.

export function applyCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-edit-token");
  res.setHeader("Access-Control-Max-Age", "86400");
}

/** Handle preflight. Returns true if the request was an OPTIONS preflight. */
export function handlePreflight(req, res) {
  applyCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

export function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(body));
}

/** Vercel auto-parses JSON bodies, but guard against string/empty cases. */
export function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

export const MAX_BYTES = 256 * 1024; // 256 KB payload cap

export function tooLarge(value) {
  return Buffer.byteLength(JSON.stringify(value), "utf8") > MAX_BYTES;
}
