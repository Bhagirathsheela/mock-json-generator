# 60-second narration script — "Edit your mock API live"

Pair this with demo/live-api-explainer.html (screen-record it) or a real
screen capture of the extension.

## Scene 1 — Publish (0:00–0:12)
"Paste a JSON template, hit Publish, and Mock JSON Generator gives you a real,
live REST endpoint instantly — with a shareable URL and full CRUD."

## Scene 2 — Call it from your app (0:12–0:30)
"Here's the part people miss: this isn't a fake mock. From your frontend, call
it with fetch or axios — a PATCH to /:id updates a record, POST adds one, DELETE
removes one. No auth needed for record-level edits."

## Scene 3 — It really changes (0:30–0:50)
"GET the endpoint again and the change is there — it persisted. Build and test
your whole UI against real, mutable data before the backend even exists."

## Close (0:50–0:60)
"Mock JSON Generator — realistic fake data and a live REST API, free. Link in
the description."

## On-screen code to show
await fetch(url + "/3", { method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Neo" }) });

// or
await axios.patch(url + "/3", { name: "Neo" });
