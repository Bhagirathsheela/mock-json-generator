import { nanoid } from "nanoid";
import { writeCollection } from "../../lib/redis.js";
import { handlePreflight, json, parseBody, tooLarge } from "../../lib/http.js";
import { makeEditToken, hashToken, normalizeItems } from "../../lib/collection.js";
import { enforce } from "../../lib/ratelimit.js";

// POST /api/mock  →  create a new mock collection
export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!(await enforce(req, res, "create"))) return;

  const body = parseBody(req);
  const { data, name, wrap } = body;
  if (data == null) return json(res, 400, { error: "Missing 'data'" });
  if (tooLarge(data)) return json(res, 413, { error: "Payload too large (max 256 KB)" });

  const { items, seq } = normalizeItems(data);
  if (items.length === 0) return json(res, 400, { error: "'data' must contain at least one object" });

  const id = nanoid(8);
  const editToken = makeEditToken();
  const now = Date.now();

  const collection = {
    meta: {
      name: typeof name === "string" ? name.slice(0, 120) : "Mock collection",
      wrap: wrap === "object" ? "object" : "array",
      editTokenHash: hashToken(editToken),
      seq,
      createdAt: now,
      updatedAt: now,
    },
    items,
  };

  await writeCollection(id, collection);

  const proto = req.headers["x-forwarded-proto"] || "https";
  const url = `${proto}://${req.headers.host}/api/mock/${id}`;

  return json(res, 201, {
    id,
    url,
    editToken, // returned ONCE — the extension stores it in chrome.storage
    name: collection.meta.name,
    count: items.length,
  });
}
