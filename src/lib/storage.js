// Thin wrapper over chrome.storage.local with a localStorage fallback
// (so the app still runs in `vite dev` outside the extension context).

const hasChrome = typeof chrome !== "undefined" && chrome?.storage?.local;

async function get(keys) {
  if (hasChrome) return chrome.storage.local.get(keys);
  const out = {};
  for (const k of [].concat(keys)) {
    const v = localStorage.getItem(k);
    if (v != null) out[k] = JSON.parse(v);
  }
  return out;
}

async function set(obj) {
  if (hasChrome) return chrome.storage.local.set(obj);
  for (const [k, v] of Object.entries(obj)) localStorage.setItem(k, JSON.stringify(v));
}

const KEYS = {
  template: "mockapi_template",
  output: "mockapi_output",
  endpoints: "mockapi_endpoints", // [{ id, name, url, editToken, createdAt, count }]
  apiBase: "mockapi_api_base",
};

export const store = {
  async getDraft() {
    const r = await get([KEYS.template, KEYS.output]);
    return { template: r[KEYS.template] || "", output: r[KEYS.output] || "" };
  },
  async setDraft(template, output) {
    await set({ [KEYS.template]: template, [KEYS.output]: output });
  },

  async getEndpoints() {
    const r = await get(KEYS.endpoints);
    return r[KEYS.endpoints] || [];
  },
  async addEndpoint(ep) {
    const list = await this.getEndpoints();
    list.unshift(ep);
    await set({ [KEYS.endpoints]: list });
    return list;
  },
  async removeEndpoint(id) {
    const list = (await this.getEndpoints()).filter((e) => e.id !== id);
    await set({ [KEYS.endpoints]: list });
    return list;
  },
  async updateEndpoint(id, patch) {
    const list = (await this.getEndpoints()).map((e) => (e.id === id ? { ...e, ...patch } : e));
    await set({ [KEYS.endpoints]: list });
    return list;
  },

  async getApiBase() {
    const r = await get(KEYS.apiBase);
    // Change this default to your deployed Vercel URL.
    return r[KEYS.apiBase] || "https://your-project.vercel.app";
  },
  async setApiBase(url) {
    await set({ [KEYS.apiBase]: url.replace(/\/+$/, "") });
  },
};
