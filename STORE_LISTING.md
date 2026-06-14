# Chrome Web Store listing

## Name (manifest, ≤75 chars)
Mock JSON Generator - Fake Data & Live REST API

## Short / manifest description (≤132 chars)
Generate realistic mock JSON from any template, then publish it as a live, shareable REST API with full CRUD. Free & local.

## Detailed description (store listing — emoji version)

⚡ Mock JSON Generator is the fastest way to create realistic fake JSON test data — and turn it into a live REST API in one click. 🚀

📝 Paste any JSON template and instantly generate 5 to 500 records. The generator automatically detects field types from your keys and sample values — names, emails, phone numbers, dates, image URLs, file links, booleans and numbers — and fills them with realistic random data. Nested objects and arrays are fully supported. ✨

🌐 NEW — Publish a live, shareable API:
Turn your mock data into a real, hosted REST endpoint with a single click. You get a public URL with full CRUD support (GET, POST, PUT, PATCH, DELETE) that works from your app, Postman, curl or fetch — perfect for building and testing a frontend before the real backend exists. 🔗

✅ Features:
🎯 Generate realistic mock JSON from any template
🧠 Smart type detection: names, emails, phones, dates, images, files, booleans, numbers
⚡ Quick-add field buttons, one-click Format, and smart bracket auto-close
🔢 Choose record count (5–500) and wrap output as an array or object
📋 Copy to clipboard or 💾 download as a .json file
🌐 Publish a live REST API endpoint with full CRUD and a shareable URL
🗂️ Manage all your published endpoints from the Options page

🔒 Privacy:
All data generation runs locally in your browser — nothing is tracked or collected. Publishing a live endpoint is optional and only uploads the data you explicitly choose to publish.

👩‍💻 Perfect for frontend and backend developers, QA engineers and designers who need realistic test data or a quick mock API for prototyping. 👨‍💻

---

## Permission justifications (Privacy practices tab)

IMPORTANT: upload a PRODUCTION build (`npm run build`), not a `npm run dev`
build. The dev build injects alarms/notifications/offscreen permissions for
hot-reload; the production build only needs the two below.

**storage**
Stores the user's current JSON template, generated output, settings, and the
list of mock endpoints they've published — saved locally via
chrome.storage.local. Nothing is transmitted for this.

**Host permission** (https://mock-json-generator-api.bhagirathsheela.workers.dev/*)
The optional "Publish" feature sends the user's generated mock data to our own
first-party Cloudflare Worker API at this domain to create a shareable REST
endpoint. The permission is scoped to this single domain only.

## Single purpose
Generate realistic mock JSON test data from a template and optionally publish
it as a live, shareable REST API endpoint for development and testing.

## Data usage disclosures
- The extension does NOT collect personal or sensitive user data.
- Data generation runs entirely locally in the browser.
- When the user clicks "Publish", the mock JSON they chose to publish is sent to
  the extension's first-party Cloudflare Worker to create a shareable endpoint.
  This is user-initiated and optional.
- We do not sell or transfer data to third parties; data is not used for
  purposes unrelated to the item's single purpose; not used for creditworthiness
  or lending.
- A privacy policy URL is required because of the publish feature.
