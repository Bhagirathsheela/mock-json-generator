import { defineManifest } from "@crxjs/vite-plugin";

// Host permission for the deployed Vercel API.
// Using a wildcard over *.vercel.app lets the extension call its own
// API cross-origin WITHOUT tripping CORS (host-permitted extension
// requests bypass CORS). Narrow this to your exact deployment URL
// (e.g. "https://your-project.vercel.app/*") before publishing.
const API_HOSTS = ["https://*.vercel.app/*"];

export default defineManifest({
  manifest_version: 3,
  name: "Mock JSON Generator - Fake Data & Live REST API",
  short_name: "MockJSON",
  version: "2.0.0",
  description:
    "Generate realistic mock JSON from any template, then publish it as a live, shareable REST API with full CRUD. Free & local.",
  icons: {
    16: "icons/icon-16.png",
    32: "icons/icon-32.png",
    48: "icons/icon-48.png",
    128: "icons/icon-128.png",
  },
  action: {
    default_popup: "index.html",
    default_icon: {
      16: "icons/icon-16.png",
      32: "icons/icon-32.png",
      48: "icons/icon-48.png",
      128: "icons/icon-128.png",
    },
  },
  options_page: "options.html",
  permissions: ["storage"],
  host_permissions: API_HOSTS,
});
