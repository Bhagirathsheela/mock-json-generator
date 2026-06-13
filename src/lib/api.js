// Client for the Vercel master API. Because the deployment host is listed
// in the manifest's host_permissions, these cross-origin requests from the
// extension are not subject to CORS preflight failures.

import { store } from "./storage.js";

async function req(path, { method = "GET", body, editToken } = {}) {
  const base = await store.getApiBase();
  const headers = { "Content-Type": "application/json" };
  if (editToken) headers["x-edit-token"] = editToken;

  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }

  if (!res.ok) {
    // Build a typed error so callers can react to specific conditions
    // (rate limiting, missing/invalid token, payload too large, …).
    const retryAfter = Number(res.headers.get("Retry-After")) || 0;
    let message = json?.error || `Request failed (${res.status})`;
    if (res.status === 429) {
      message = retryAfter
        ? `You're going too fast — try again in ${retryAfter}s.`
        : "You're going too fast — please wait a moment and retry.";
    }
    const err = new Error(message);
    err.status = res.status;
    err.retryAfter = retryAfter;
    throw err;
  }
  return json;
}

export const api = {
  /** Publish a new mock collection. Returns { id, url, editToken, count }. */
  publish({ data, name, wrap }) {
    return req("/api/mock", { method: "POST", body: { data, name, wrap } });
  },

  /** Replace the entire collection (owner-only, needs editToken). */
  replace(id, data, editToken) {
    return req(`/api/mock/${id}`, { method: "PUT", body: { data }, editToken });
  },

  /** Delete the entire collection (owner-only, needs editToken). */
  destroy(id, editToken) {
    return req(`/api/mock/${id}`, { method: "DELETE", editToken });
  },

  /** Read the whole collection (public). */
  read(id) {
    return req(`/api/mock/${id}`);
  },
};
