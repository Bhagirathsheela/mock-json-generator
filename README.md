# Mock JSON Generator — Fake Data & Live REST API

A Chrome extension (Manifest V3) that generates realistic mock JSON from any
template, and can **publish it as a live, shareable REST API with full CRUD** —
backed by a single Cloudflare Worker + KV.

- **UI:** React + Tailwind, bundled with Vite + CRXJS (CSP-safe — no inline scripts).
- **Backend:** one Cloudflare Worker (`worker/`) storing collections in KV. No database to manage, no tokens to copy between services.
- **No login.** Item-level CRUD is public (so your app-under-development can read/write freely); replacing or deleting a whole collection requires the per-collection edit token the extension stores for you.

---

## Repository layout

```
mock-json-generator/
├── manifest.config.js        # MV3 manifest (CRXJS defineManifest)
├── vite.config.js            # Vite + React + CRXJS
├── tailwind.config.js / postcss.config.js
├── index.html  options.html  # popup + options entry points
├── src/
│   ├── popup/                # Popup.jsx — generate / preview / publish
│   ├── options/              # Options.jsx — "My Endpoints" + settings
│   ├── components/           # Button, Toast
│   └── lib/
│       ├── generator.js      # mock-data engine
│       ├── api.js            # client for the Worker API
│       └── storage.js        # chrome.storage wrapper (holds default API URL)
├── icons/                    # icon.svg + generated PNGs (16/32/48/128/256)
├── scripts/
│   ├── generate-icons.mjs    # rasterize icon.svg to exact-size PNGs
│   └── test-crud.mjs         # end-to-end CRUD smoke test against a live URL
└── worker/                   # ← Cloudflare Worker backend (deploy this)
    ├── src/index.js
    └── wrangler.toml
```

---

## Part 1 — Build & load the extension

```bash
npm install
npm run build        # outputs dist/
```

In Chrome: `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select `dist/`.

Dev mode with HMR: `npm run dev`.

> CSP-safe by construction: CRXJS references every script via `<script src=…>` —
> no inline code, no `eval`.

---

## Part 2 — Deploy the live-endpoint backend (Cloudflare Worker + KV)

```bash
cd worker
npm install
npx wrangler login                      # opens browser, ~once
npx wrangler kv namespace create MOCK_KV  # paste the printed id into wrangler.toml
npm run deploy                          # prints https://<name>.<you>.workers.dev
```

Then set the deployed URL as the extension's default in `src/lib/storage.js`
(`DEFAULT_API_BASE`) and rebuild — that's the URL every install talks to.
Individual users can override it in the **Options** page if they self-host.

Smoke-test the deployment any time:

```bash
node scripts/test-crud.mjs https://<your-worker-url>
```

---

## How publish works

```
Popup ──POST /api/mock {data,name,wrap}──▶ Worker ──▶ KV (mock:<id>)
  ◀────────── { id, url, editToken } ──────────┘
   │
   └─ stores { id, url, editToken } in chrome.storage.local  (Options → "My Endpoints")
```

The extension's requests to its own API aren't subject to CORS (the host is in
`host_permissions`). The public `GET /api/mock/:id` returns
`Access-Control-Allow-Origin: *`, so anyone can call it from any app or `curl`.

### REST / CRUD reference

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| `POST` | `/api/mock` | public | create a collection |
| `GET` | `/api/mock/:id` | public | list all records |
| `GET` | `/api/mock/:id/:itemId` | public | read one record |
| `POST` | `/api/mock/:id` | public | add a record |
| `PUT` | `/api/mock/:id/:itemId` | public | replace a record |
| `PATCH` | `/api/mock/:id/:itemId` | public | merge fields into a record |
| `DELETE` | `/api/mock/:id/:itemId` | public | delete a record |
| `PUT` | `/api/mock/:id` | **owner** | replace the whole collection |
| `DELETE` | `/api/mock/:id` | **owner** | delete the whole collection |

Owner-only ops need the header `x-edit-token: <token>` (sent automatically by the
extension; also visible per-endpoint on the Options page). Collections expire 30
days after the last write; payloads are capped at 256 KB.

---

## Regenerating the icons

`icons/icon.svg` uses strict `0 0 128 128` bounds (no filters/shadows/bleeding
strokes). After editing it:

```bash
npm run icons
```

The script downscales with a Lanczos kernel and asserts exact integer dimensions,
so a stray sub-pixel can't push 128 → 129 and get the icon rejected or blurred.

> **Security note:** anonymous public writes are convenient for development but
> mean anyone with a collection URL can add/edit/delete its records. Don't store
> anything sensitive. For production-grade abuse protection add a Cloudflare WAF
> rate-limiting rule (no code needed) on top of the Worker's built-in best-effort limiter.
