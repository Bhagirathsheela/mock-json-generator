import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis.js";
import { json } from "./http.js";

// Sliding-window limiters, keyed by client IP. Tiers:
//   read   — generous (public GETs are cheap)
//   write  — moderate (item-level CRUD)
//   create — strict   (one collection per request; prevents spam)
//
// An ephemeral in-memory cache lets a warm function short-circuit repeat
// callers without a Redis round-trip on every request.
const limiters = {
  read: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(120, "60 s"),
    prefix: "rl:read",
    ephemeralCache: new Map(),
    analytics: false,
  }),
  write: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(40, "60 s"),
    prefix: "rl:write",
    ephemeralCache: new Map(),
    analytics: false,
  }),
  create: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    prefix: "rl:create",
    ephemeralCache: new Map(),
    analytics: false,
  }),
};

function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "anonymous";
}

/**
 * Enforce a rate-limit tier. Sets X-RateLimit-* headers and, if the caller
 * is over the limit, sends a 429 and returns false. Handlers should:
 *   if (!(await enforce(req, res, "write"))) return;
 *
 * Fails open: if Redis is unreachable, requests are allowed through so a
 * limiter outage never takes the whole API down.
 */
export async function enforce(req, res, kind = "read") {
  const limiter = limiters[kind] || limiters.read;
  try {
    const { success, limit, remaining, reset } = await limiter.limit(`${kind}:${clientIp(req)}`);
    res.setHeader("X-RateLimit-Limit", String(limit));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, remaining)));
    res.setHeader("X-RateLimit-Reset", String(reset));
    if (!success) {
      const retryMs = reset - Date.now();
      if (retryMs > 0) res.setHeader("Retry-After", String(Math.ceil(retryMs / 1000)));
      json(res, 429, { error: "Rate limit exceeded. Please slow down." });
      return false;
    }
    return true;
  } catch {
    return true; // fail open
  }
}
