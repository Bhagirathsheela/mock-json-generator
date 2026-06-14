import { useEffect, useRef, useState } from "react";
import Button from "../components/Button.jsx";
import Toast from "../components/Toast.jsx";
import { generateFromRaw, parseTemplate, generateData } from "../lib/generator.js";
import { store } from "../lib/storage.js";
import { api } from "../lib/api.js";

const SAMPLE = `{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "https://picsum.photos/seed/x/400/300",
  "active": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "bio": "short bio here"
}`;

// Quick-insert chips — click to drop a typed field into the template.
// Each snippet's key name + sample value drives the generator's type detection.
const FIELD_CHIPS = [
  { label: "id", field: "id", snip: '"id": 1' },
  { label: "name", field: "name", snip: '"name": "John Doe"' },
  { label: "email", field: "email", snip: '"email": "john@example.com"' },
  { label: "phone", field: "phone", snip: '"phone": "+919999999999"' },
  { label: "date", field: "createdAt", snip: '"createdAt": "2024-01-01T00:00:00.000Z"' },
  { label: "image", field: "avatar", snip: '"avatar": "https://picsum.photos/seed/x/400/300"' },
  { label: "bio", field: "bio", snip: '"bio": "short bio here"' },
  { label: "price", field: "price", snip: '"price": 1999' },
  { label: "bool", field: "active", snip: '"active": true' },
  { label: "title", field: "title", snip: '"title": "task"' },
];

export default function Popup() {
  const [template, setTemplate] = useState("");
  const [count, setCount] = useState(5);
  const [wrap, setWrap] = useState("array");
  const [output, setOutput] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(null); // { url, id }
  const [toast, setToast] = useState(null);
  const taRef = useRef(null);

  const notify = (message, type = "info") => setToast({ message, type });

  // Restore the previous draft.
  useEffect(() => {
    store.getDraft().then(({ template: t, output: o }) => {
      if (t) setTemplate(t);
      if (o) setOutput(o);
    });
  }, []);

  // Auto-close brackets/quotes (ported from the original popup.js).
  const onKeyDown = (e) => {
    const pairs = { "{": "}", "[": "]", '"': '"' };
    const ta = taRef.current;
    if (pairs[e.key]) {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en, value } = ta;
      const next = value.slice(0, s) + e.key + value.slice(s, en) + pairs[e.key] + value.slice(en);
      setTemplate(next);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 1; });
    } else if ((e.key === "}" || e.key === "]" || e.key === '"') &&
               ta.value[ta.selectionStart] === e.key) {
      e.preventDefault();
      const p = ta.selectionStart + 1;
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = p; });
    }
  };

  // Insert a field snippet at the cursor, adding a comma when needed.
  const insertField = ({ field, snip }) => {
    const ta = taRef.current;
    // Don't add a key that already exists in the template (single-object dedup).
    if (field && new RegExp('"' + field + '"\\s*:').test(template)) {
      notify('"' + field + '" is already added', "info");
      return;
    }
    setTemplate((prev) => {
      const text = prev ?? "";
      if (!text.trim()) return `{\n  ${snip}\n}`;
      const pos = ta ? ta.selectionStart : text.length;
      const before = text.slice(0, pos);
      const after = text.slice(pos);
      const prevChar = before.replace(/\s+$/, "").slice(-1);
      const needsComma = prevChar && !["{", "[", ","].includes(prevChar);
      const insertion = (needsComma ? ",\n  " : "\n  ") + snip;
      requestAnimationFrame(() => {
        if (ta) {
          const p = before.length + insertion.length;
          ta.focus();
          ta.selectionStart = ta.selectionEnd = p;
        }
      });
      return before + insertion + after;
    });
  };

  // Prettify the current template (lenient parse → 2-space JSON).
  const handleFormat = () => {
    if (!template.trim()) return;
    try {
      setTemplate(JSON.stringify(parseTemplate(template), null, 2));
    } catch (err) {
      notify("Can't format — invalid JSON: " + err.message, "error");
    }
  };

  const handleGenerate = () => {
    try {
      const result = generateFromRaw(template, { count: Number(count), wrapType: wrap });
      const str = JSON.stringify(result, null, 2);
      setOutput(str);
      setPublished(null);
      store.setDraft(template, str);
    } catch (err) {
      notify("Invalid JSON: " + err.message, "error");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      notify("Copied to clipboard", "success");
    } catch { notify("Copy failed", "error"); }
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "mockapi.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const handlePublish = async () => {
    if (!output) return notify("Generate data first", "error");
    setPublishing(true);
    try {
      const tmpl = parseTemplate(template);
      const data = generateData(tmpl, Number(count));
      const res = await api.publish({ data, name: "Mock collection", wrap });
      await store.addEndpoint({
        id: res.id,
        name: res.name || "Mock collection",
        url: res.url,
        editToken: res.editToken,
        count: res.count,
        createdAt: Date.now(),
      });
      setPublished({ url: res.url, id: res.id });
      notify("Live endpoint created!", "success");
    } catch (err) {
      notify(err.status === 429 ? err.message : "Publish failed: " + err.message, "error");
    } finally {
      setPublishing(false);
    }
  };

  const openOptions = () => chrome?.runtime?.openOptionsPage?.();
  const openExplainer = () =>
    window.open(
      typeof chrome !== "undefined" && chrome?.runtime?.getURL
        ? chrome.runtime.getURL("explainer.html")
        : "explainer.html",
      "_blank"
    );

  // Keys already present in the template — used to disable matching chips.
  const presentKeys = new Set(
    [...template.matchAll(/"([^"]+)"\s*:/g)].map((m) => m[1])
  );

  return (
    <div className="flex min-h-[560px] w-[720px] flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-br from-brand-500 to-brand-700 px-5 py-4 text-white shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Mock JSON Generator</h1>
            <p className="text-xs text-white/80">Generate mock JSON — or publish a live CRUD endpoint.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openExplainer}
              className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
            >
              How it works
            </button>
            <button
              onClick={openOptions}
              className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
            >
              My Endpoints
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-5">
        {/* Template input */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">JSON template</label>
            <div className="flex items-center gap-3">
              <button onClick={handleFormat} className="text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline">
                Format
              </button>
              <button onClick={() => setTemplate(SAMPLE)} className="text-xs font-medium text-brand-600 hover:underline">
                Insert sample
              </button>
            </div>
          </div>
          <textarea
            ref={taRef}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Paste your JSON template here…"
            spellCheck={false}
            className="scrollbar-thin h-32 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 font-mono text-[13px] leading-relaxed shadow-inner focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          {/* Quick-add field chips */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400">Quick add:</span>
            {FIELD_CHIPS.map((chip) => {
              const added = presentKeys.has(chip.field);
              return (
                <button
                  key={chip.label}
                  onClick={() => insertField(chip)}
                  disabled={added}
                  title={added ? "Already added" : undefined}
                  className={`rounded-md border px-2 py-0.5 font-mono text-xs ${added ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300" : "border-slate-200 bg-white text-slate-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"}`}
                >
                  + {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[140px] flex-1">
            <label className="mb-1 block text-xs font-semibold text-slate-600">Number of objects</label>
            <select
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              {[5, 10, 50, 100, 500].map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div className="min-w-[140px] flex-1">
            <label className="mb-1 block text-xs font-semibold text-slate-600">Wrap output</label>
            <select
              value={wrap}
              onChange={(e) => setWrap(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="array">Array</option>
              <option value="object">Object (key: data)</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleGenerate} className="flex-1">Generate</Button>
          <Button variant="ghost" onClick={handleCopy} disabled={!output}>Copy</Button>
          <Button variant="ghost" onClick={handleDownload} disabled={!output}>Download</Button>
          <Button onClick={handlePublish} disabled={!output || publishing} className="flex-1">
            {publishing ? "Publishing…" : "Publish live API"}
          </Button>
        </div>

        {/* Published banner */}
        {published && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <p className="font-semibold text-emerald-800">Live endpoint ready 🎉</p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-white px-2 py-1 font-mono text-xs text-slate-700">
                {published.url}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(published.url); notify("URL copied", "success"); }}
                className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Copy URL
              </button>
            </div>
          </div>
        )}

        {/* Output */}
        <div className="flex flex-1 flex-col">
          <label className="mb-1.5 text-sm font-semibold text-slate-700">Output</label>
          <pre className="scrollbar-thin min-h-[120px] flex-1 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-100 shadow-inner">
            {output || <span className="text-slate-500">Generated JSON will appear here…</span>}
          </pre>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-slate-100 py-2.5 text-center text-[11px] text-slate-500">
        Generation runs locally. Publishing sends data to the cloud API.
      </footer>

      <Toast toast={toast} onClear={() => setToast(null)} />
    </div>
  );
}
