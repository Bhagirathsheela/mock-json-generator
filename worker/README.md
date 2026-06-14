# Mock JSON Generator — Cloudflare Worker backend

One platform, one deploy. Storage is a KV namespace bound as `MOCK_KV` —
no external database, no tokens to copy between services.

## Deploy (3 steps)

```bash
cd worker
npm install
npx wrangler login                         # opens browser, ~once

# Create the KV namespace, then paste the printed id into wrangler.toml
npx wrangler kv namespace create MOCK_KV

npm run deploy                             # prints https://<name>.<you>.workers.dev
```

That URL is your API base. Set it as `DEFAULT_API_BASE` in
`../src/lib/storage.js` (and rebuild the extension) so every install uses it.

## Smoke test

```bash
node ../scripts/test-crud.mjs https://<name>.<you>.workers.dev
```

## Routes

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| POST   | /api/mock            | public | create a collection |
| GET    | /api/mock/:id        | public | list all records |
| POST   | /api/mock/:id        | public | add a record |
| PUT    | /api/mock/:id        | owner  | replace whole collection (x-edit-token) |
| DELETE | /api/mock/:id        | owner  | delete whole collection (x-edit-token) |
| GET    | /api/mock/:id/:itemId| public | read one record |
| PUT    | /api/mock/:id/:itemId| public | replace one record |
| PATCH  | /api/mock/:id/:itemId| public | merge fields into a record |
| DELETE | /api/mock/:id/:itemId| public | delete one record |

## Notes

- Collections expire 30 days after the last write; payloads capped at 256 KB.
- Rate limiting is best-effort in-isolate. For production-grade limits, add a
  Cloudflare **WAF rate-limiting rule** in the dashboard (no code needed).
- Free tier: 100k Worker requests/day; KV 100k reads + 1k writes/day, 1 GB.
