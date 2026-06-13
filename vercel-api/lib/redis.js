import { Redis } from "@upstash/redis";

// Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env.
// The REST client is stateless (plain HTTPS), so it's safe to construct
// per-invocation in a serverless function — no connection pooling needed.
export const redis = Redis.fromEnv();

// Collections expire 30 days after the last write, keeping us inside the
// free tier. Every mutating operation refreshes the TTL.
export const TTL_SECONDS = 60 * 60 * 24 * 30;

export const key = (id) => `mock:${id}`;

export async function readCollection(id) {
  // @upstash/redis auto-deserializes JSON values.
  return (await redis.get(key(id))) || null;
}

export async function writeCollection(id, collection) {
  await redis.set(key(id), collection, { ex: TTL_SECONDS });
}

export async function deleteCollection(id) {
  await redis.del(key(id));
}
