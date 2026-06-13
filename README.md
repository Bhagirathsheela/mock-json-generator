# MockAPI Data Generator — v2

Generate realistic mock JSON from a template, then optionally **publish it as a
live, shareable CRUD endpoint** hosted on Vercel.

- **UI:** React + Tailwind, bundled with Vite + CRXJS for Manifest V3 (CSP-safe — no inline scripts).
- **Backend:** A single Vercel serverless project ("master API") that stores collections in Upstash Redis and serves them at `/api/mock/:id` with full REST/CRUD.
- **No login required.** Item-level CRUD is public (so your app-under-development can read/write freely); destroying or replacing a whole collection requires the per-collection edit token the extension keeps for you.

---

## Repository layout

```
MockAPI-Data-Generator/
├── manifest.config.js        # MV3 manifest (CRXJS defineManifest)
├── vite.config.js            # Vite + React + CRXJS
├── tailwind.config.js / postcss.config.js
├── index.html  options.html  # popup + options entry points
├── src/
│   ├── popup/                # Popup.jsx — generate / preview / publish
│   ├── options/              # Options.jsx — "My Endpoints" + settings
│   ├── components/           # Button, Toast
│   └── lib/
│       ├── generator.js      # mock-data engine (ported from v1, unchanged logic)
│       ├── api.js            # client for the Vercel API
│       └── storage.js        # chrome.storage wrapper
├── icons/
│   ├── icon.svg              # master logo (strict 0 0 128 128 bounds)
│   └── icon-16/32/48/128/256.png
├── scripts/generate-icons.mjs
├── vercel-api/               # ← deploy THIS folder to Vercel (separate project)
└── legacy/                   # your original v1 files, kept for reference
```

---

## Part 1 — Build & load the extension

```bash
npm install
npm run build        # outputs dist/
```

Then in Chrome: `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select the `dist/` folder.

For live development with HMR: `npm run dev`, then load the `dist/` folder CRXJS writes.

> The build is CSP-safe by construction: CRXJS references every script via
> `<script src=…>` (no inline code, no `eval`), so MV3's default policy is satisfied.

---

## Part 2 — Deploy the live-endpoint backend

### 2.1 Create an Upstash Redis database (free)

1. Sign up at [upstash.com](https://upstash.com) → **Create Database** (Redis, pick a nearby region).
2. From the database page, copy **`UPSTASH_REDIS_REST_URL`** and **`UPSTASH_REDIS_REST_TOKEN`**.

### 2.2 Deploy `vercel-api/` to Vercel

```bash
cd vercel-api
npm install
npx vercel            # first run links/creates the project
npx vercel --prod     # production deploy
```

In the Vercel dashboard → your project → **Settings → Environment Variables**, add:

| Name | Value |
|------|-------|
| `UPSTASH_REDIS_REST_URL` | *(from Upstash)* |
| `UPSTASH_REDIS_REST_TOKEN` | *(from Upstash)* |

Redeploy after adding them. Your API base is now `https://<your-project>.vercel.app`.

### 2.3 Point the extension at your deployment

Two places reference the host — update both:

1. **`manifest.config.js`** → narrow `host_permissions` from `https://*.vercel.app/*`
   to your exact URL, e.g. `https://your-project.vercel.app/*`, then rebuild.
2. In the extension's **Options page**, set the **Vercel API base URL** field to
   `https://your-project.vercel.app` and click Save.

---

## How the extension talks to the backend

```
Popup ──POST /api/mock {data,name,wrap}──▶ Vercel fn ──▶ Upstash Redis
  ◀────────── { id, url, editToken } ──────────┘
   │
   └─ stores { id, url, editToken } in chrome.storage.local  (Options → "My Endpoints")
```

- The extension's requests to its own API are **not subject to CORS** because the host is in `host_permissions`.
- The public `GET /api/mock/:id` returns `Access-Control-Allow-Origin: *`, so **end users** can call it from any app, Postman, or `fetch()`.

---

## Live endpoint — REST / CRUD reference

Given a published collection at `…/api/mock/abc123`:

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| `GET` | `/api/mock/:id` | public | list all records |
| `GET` | `/api/mock/:id/:itemId` | public | read one record |
| `POST` | `/api/mock/:id` | public | add a record |
| `PUT` | `/api/mock/:id/:itemId` | public | replace a record |
| `PATCH` | `/api/mock/:id/:itemId` | public | merge fields into a record |
| `DELETE` | `/api/mock/:id/:itemId` | public | delete a record |
| `PUT` | `/api/mock/:id` | **owner** | replace the whole collection |
| `DELETE` | `/api/mock/:id` | **owner** | delete the whole collection |

Owner-only operations require the header `x-edit-token: <token>` (the extension
sends it automatically; you can also copy it from the Options page).

```bash
# read
curl https://your-project.vercel.app/api/mock/abc123

# add a record
curl -X POST https://your-project.vercel.app/api/mock/abc123 \
  -H "Content-Type: application/json" -d '{"name":"New row"}'

# delete the whole collection (owner)
curl -X DELETE https://your-project.vercel.app/api/mock/abc123 \
  -H "x-edit-token: YOUR_TOKEN"
```

Collections expire **30 days** after the last write (refreshed on every mutation),
and payloads are capped at **256 KB** — both to stay comfortably inside the free tiers.

**Rate limits** (per IP, via `@upstash/ratelimit`, sliding window): reads 120/min,
item writes 40/min, collection creates 10/min. Responses include `X-RateLimit-*`
headers and return `429` with `Retry-After` when exceeded. The limiter fails open,
so a Redis hiccup never takes the API down.

### Smoke-testing a deployment

After deploying, run the end-to-end CRUD test against your live URL:

```bash
cd vercel-api
node scripts/test-crud.mjs https://your-project.vercel.app
```

It creates a collection, reads it, adds/reads/patches/replaces/deletes a record,
verifies the edit-token gate (a tokenless collection-delete must be rejected),
then cleans up — printing a pass/fail line for each step.

---

## Regenerating the icons

The logo lives in `icons/icon.svg` with **strict `0 0 128 128` bounds** — no
filters, drop-shadows, or outer strokes that could bleed past the canvas and
throw off exported dimensions. After editing it:

```bash
npm run icons
```

The script renders the SVG at high resolution, downscales with a Lanczos kernel,
forces **exact integer dimensions** for each size, and asserts the result — so a
stray sub-pixel can never push 128 → 129 and get the icon rejected or blurred.

> **Security note:** anonymous public writes are convenient for development but
> mean anyone with a collection URL can add/edit/delete its records. Don't store
> anything sensitive. For production hardening, add rate limiting
> (e.g. `@upstash/ratelimit`) and/or gate item-level writes behind the edit token too.
