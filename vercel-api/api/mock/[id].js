import { readCollection, writeCollection, deleteCollection } from "../../lib/redis.js";
import { handlePreflight, json, parseBody, tooLarge } from "../../lib/http.js";
import { verifyToken, normalizeItems, publicView } from "../../lib/collection.js";
import { enforce } from "../../lib/ratelimit.js";

// Collection-level routes for /api/mock/:id
//   GET    → read whole collection           (public)
//   POST   → append a record                 (public)
//   PUT    → replace whole collection         (OWNER, x-edit-token)
//   DELETE → delete whole collection          (OWNER, x-edit-token)
export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  if (!(await enforce(req, res, req.method === "GET" ? "read" : "write"))) return;

  const { id } = req.query;
  const collection = await readCollection(id);
  if (!collection) return json(res, 404, { error: "Collection not found" });

  switch (req.method) {
    case "GET":
      return json(res, 200, publicView(collection));

    case "POST": {
      // Public: add one record to the collection.
      const body = parseBody(req);
      if (body == null || typeof body !== "object")
        return json(res, 400, { error: "Body must be a JSON object" });

      const nextSeq = collection.meta.seq + 1;
      const item = { ...body, id: body.id != null ? String(body.id) : String(nextSeq) };
      collection.items.push(item);
      collection.meta.seq = Math.max(nextSeq, collection.meta.seq);
      collection.meta.updatedAt = Date.now();

      if (tooLarge(collection)) return json(res, 413, { error: "Collection size limit reached" });
      await writeCollection(id, collection);
      return json(res, 201, item);
    }

    case "PUT": {
      // Owner-only: replace all records.
      if (!verifyToken(req, collection))
        return json(res, 403, { error: "Valid x-edit-token required" });

      const body = parseBody(req);
      if (tooLarge(body.data ?? body)) return json(res, 413, { error: "Payload too large (max 256 KB)" });
      const { items, seq } = normalizeItems(body.data ?? body);
      collection.items = items;
      collection.meta.seq = seq;
      collection.meta.updatedAt = Date.now();
      await writeCollection(id, collection);
      return json(res, 200, publicView(collection));
    }

    case "DELETE":
      // Owner-only: destroy the whole collection.
      if (!verifyToken(req, collection))
        return json(res, 403, { error: "Valid x-edit-token required" });
      await deleteCollection(id);
      return json(res, 200, { deleted: true, id });

    default:
      return json(res, 405, { error: "Method not allowed" });
  }
}
