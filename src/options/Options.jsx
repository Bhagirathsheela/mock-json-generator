import { useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import Toast from "../components/Toast.jsx";
import { store } from "../lib/storage.js";
import { api } from "../lib/api.js";

const openExplainer = () =>
  window.open(
    typeof chrome !== "undefined" && chrome?.runtime?.getURL
      ? chrome.runtime.getURL("explainer.html")
      : "explainer.html",
    "_blank"
  );

const fetchSnippet = (url) =>
  `await fetch("${url}/1", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "New Name" }),
});`;

const axiosSnippet = (url) => `await axios.patch("${url}/1", { name: "New Name" });`;

export default function Options() {
  const [apiBase, setApiBase] = useState("");
  const [endpoints, setEndpoints] = useState([]);
  const [toast, setToast] = useState(null);
  const notify = (message, type = "info") => setToast({ message, type });

  useEffect(() => {
    store.getApiBase().then(setApiBase);
    store.getEndpoints().then(setEndpoints);
  }, []);

  const saveBase = async () => {
    await store.setApiBase(apiBase);
    notify("API base URL saved", "success");
  };

  const copy = (text, label = "Copied") => {
    navigator.clipboard.writeText(text);
    notify(label, "success");
  };

  const remove = async (ep) => {
    try {
      await api.destroy(ep.id, ep.editToken).catch(() => {});
      const next = await store.removeEndpoint(ep.id);
      setEndpoints(next);
      notify("Endpoint deleted", "success");
    } catch (err) {
      notify("Delete failed: " + err.message, "error");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Settings &amp; Endpoints</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your API base URL and the mock endpoints you've published.
          </p>
        </div>
        <Button variant="ghost" onClick={openExplainer}>How it works</Button>
      </header>

      {/* API base setting */}
      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">API base URL</h2>
        <p className="mb-3 mt-1 text-xs text-slate-500">
          The deployed Cloudflare Worker that stores and serves your mock data.
          Leave as the default unless you self-host your own Worker.
        </p>
        <div className="flex gap-2">
          <input
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            placeholder="https://your-worker.workers.dev"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <Button onClick={saveBase}>Save</Button>
        </div>
      </section>

      {/* Endpoints list */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            My endpoints {endpoints.length > 0 && `(${endpoints.length})`}
          </h2>
        </div>

        {endpoints.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
            <p className="text-sm text-slate-500">No endpoints yet.</p>
            <p className="mt-1 text-xs text-slate-400">
              Generate data in the popup and click “Publish live API”.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {endpoints.map((ep) => (
              <li key={ep.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800">{ep.name || "Mock collection"}</p>
                    <p className="text-xs text-slate-400">
                      {ep.count} records · created {new Date(ep.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button variant="danger" onClick={() => remove(ep)}>Delete</Button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded bg-slate-100 px-2.5 py-1.5 font-mono text-xs text-slate-700">
                    {ep.url}
                  </code>
                  <button
                    onClick={() => copy(ep.url, "URL copied")}
                    className="rounded bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={() => copy(fetchSnippet(ep.url), "fetch snippet copied")}
                    className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Copy fetch
                  </button>
                  <button
                    onClick={() => copy(axiosSnippet(ep.url), "axios snippet copied")}
                    className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Copy axios
                  </button>
                  <a
                    href={ep.url} target="_blank" rel="noreferrer"
                    className="rounded bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Open
                  </a>
                </div>

                {/* CRUD cheatsheet */}
                <details className="mt-3 text-xs">
                  <summary className="cursor-pointer font-medium text-slate-500 hover:text-slate-700">
                    REST / CRUD usage — edit this data from your app
                  </summary>

                  <p className="mt-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-800">
                    ⚡ These calls really change the stored data and persist — it's a live shared API,
                    not a fake mock. Any fetch/axios request below updates the records for everyone.
                  </p>

                  <pre className="scrollbar-thin mt-2 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-100">
{`GET    ${ep.url}            # list all records
GET    ${ep.url}/:itemId    # read one record
POST   ${ep.url}            # add a record   (public)
PUT    ${ep.url}/:itemId    # replace record (public)
PATCH  ${ep.url}/:itemId    # update record  (public)
DELETE ${ep.url}/:itemId    # delete record  (public)

# Owner-only (needs your edit token):
PUT    ${ep.url}            # replace whole collection
DELETE ${ep.url}            # delete whole collection
   header  x-edit-token: ${ep.editToken}`}
                  </pre>

                  <p className="mt-3 font-medium text-slate-500">From your frontend (fetch):</p>
                  <pre className="scrollbar-thin mt-1 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-100">
{`// update fields of record 1 — this persists!
await fetch("${ep.url}/1", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "New Name", active: false }),
});

// add a new record
await fetch("${ep.url}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Added" }),
});`}
                  </pre>

                  <p className="mt-3 font-medium text-slate-500">Or with axios:</p>
                  <pre className="scrollbar-thin mt-1 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-slate-100">
{`await axios.patch("${ep.url}/1", { name: "New Name" });    // merge fields
await axios.put("${ep.url}/1", { name: "Replace record" }); // full replace
await axios.post("${ep.url}", { name: "Added" });           // add
await axios.delete("${ep.url}/1");                          // remove`}
                  </pre>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Toast toast={toast} onClear={() => setToast(null)} />
    </div>
  );
}
