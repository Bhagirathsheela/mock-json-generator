import { createHash, randomBytes } from "node:crypto";

export function makeEditToken() {
  return randomBytes(24).toString("base64url"); // ~32 chars, URL-safe
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyToken(req, collection) {
  const provided = req.headers["x-edit-token"];
  if (!provided || !collection?.meta?.editTokenHash) return false;
  return hashToken(provided) === collection.meta.editTokenHash;
}

/** Coerce arbitrary input into an array of record objects with string ids. */
export function normalizeItems(data, startSeq = 0) {
  const arr = Array.isArray(data) ? data : data && Array.isArray(data.data) ? data.data : [data];
  let seq = startSeq;
  const items = arr
    .filter((x) => x && typeof x === "object")
    .map((rec) => {
      const id = rec.id != null ? String(rec.id) : String(++seq);
      return { ...rec, id };
    });
  return { items, seq: Math.max(seq, startSeq) };
}

/** What end users see: a bare array, or { data: [...] } when wrap === "object". */
export function publicView(collection) {
  return collection.meta.wrap === "object" ? { data: collection.items } : collection.items;
}
