import { readCollection, writeCollection } from "../../../lib/redis.js";
import { handlePreflight, json, parseBody, tooLarge } from "../../../lib/http.js";
import { enforce } from "../../../lib/ratelimit.js";

// Item-level routes for /api/mock/:id/:itemId  (all PUBLIC — sandbox CRUD)
//   GET    → read one record
//   PUT    → replace one record
//   PATCH  → merge fields into one record
//   DELETE → remove one record
export default async function handler(req, res) {
  if (handlePreflight(req, res)) return;
  if (!(await enforce(req, res, req.method === "GET" ? "read" : "write"))) return;

  const { id, itemId } = req.query;
  const collection = await readCollection(id);
  if (!collection) return json(res, 404, { error: "Collection not found" });

  const idx = collection.items.findIndex((it) => String(it.id) === String(itemId));
  if (idx === -1 && req.method !== "GET") return json(res, 404, { error: "Record not found" });

  switch (req.method) {
    case "GET":
      if (idx === -1) return json(res, 404, { error: "Record not found" });
      return json(res, 200, collection.items[idx]);

    case "PUT": {
      const body = parseBody(req);
      collection.items[idx] = { ...body, id: String(itemId) };
      collection.meta.updatedAt = Date.now();
      if (tooLarge(collection)) return json(res, 413, { error: "Collection size limit reached" });
      await writeCollection(id, collection);
      return json(res, 200, collection.items[idx]);
    }

    case "PATCH": {
      const body = parseBody(req);
      collection.items[idx] = { ...collection.items[idx], ...body, id: String(itemId) };
      collection.meta.updatedAt = Date.now();
      if (tooLarge(collection)) return json(res, 413, { error: "Collection size limit reached" });
      await writeCollection(id, collection);
      return json(res, 200, collection.items[idx]);
    }

    case "DELETE": {
      const [removed] = collection.items.splice(idx, 1);
      collection.meta.updatedAt = Date.now();
      await writeCollection(id, collection);
      return json(res, 200, { deleted: true, id: removed.id });
    }

    default:
      return json(res, 405, { error: "Method not allowed" });
  }
}
