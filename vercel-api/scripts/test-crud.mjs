// End-to-end smoke test for the deployed MockAPI backend.
//
// Usage:
//   node scripts/test-crud.mjs https://your-project.vercel.app
//   BASE=https://your-project.vercel.app node scripts/test-crud.mjs
//
// Exercises the full CRUD surface against a LIVE deployment and asserts
// each response. Exits non-zero if any check fails. Requires Node 18+
// (global fetch). Cleans up the collection it creates.

const BASE = (process.argv[2] || process.env.BASE || "").replace(/\/+$/, "");
if (!BASE) {
  console.error("Provide the deployment URL:\n  node scripts/test-crud.mjs https://your-project.vercel.app");
  process.exit(2);
}

let passed = 0;
let failed = 0;

function check(name, cond, detail = "") {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}${detail ? "  — " + detail : ""}`); }
}

async function call(method, path, { body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["x-edit-token"] = token;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, json };
}

console.log(`\nTesting MockAPI deployment at ${BASE}\n`);

// 1. Create a collection
const created = await call("POST", "/api/mock", {
  body: {
    name: "smoke-test",
    wrap: "array",
    data: [
      { id: 1, name: "Alice", active: true },
      { id: 2, name: "Bob", active: false },
    ],
  },
});
check("POST /api/mock returns 201", created.status === 201, `got ${created.status}`);
check("response has id + url + editToken",
  !!(created.json?.id && created.json?.url && created.json?.editToken));
check("count is 2", created.json?.count === 2, `got ${created.json?.count}`);

const { id, editToken } = created.json || {};
if (!id) { console.log("\nCannot continue without a collection id."); summarize(); }

// 2. Read whole collection
const list = await call("GET", `/api/mock/${id}`);
check("GET collection returns 200", list.status === 200, `got ${list.status}`);
check("collection is an array of 2", Array.isArray(list.json) && list.json.length === 2,
  `got ${JSON.stringify(list.json)?.slice(0, 80)}`);

// 3. Read a single record
const one = await call("GET", `/api/mock/${id}/1`);
check("GET item 1 returns 200", one.status === 200, `got ${one.status}`);
check("item 1 name is Alice", one.json?.name === "Alice", `got ${one.json?.name}`);

// 4. Add a record (public POST)
const added = await call("POST", `/api/mock/${id}`, { body: { name: "Carol" } });
check("POST new record returns 201", added.status === 201, `got ${added.status}`);
check("new record got an id", added.json?.id != null);
const newId = added.json?.id;

// 5. PATCH the new record
const patched = await call("PATCH", `/api/mock/${id}/${newId}`, { body: { active: true } });
check("PATCH record returns 200", patched.status === 200, `got ${patched.status}`);
check("PATCH merged fields", patched.json?.name === "Carol" && patched.json?.active === true);

// 6. PUT (replace) the new record
const put = await call("PUT", `/api/mock/${id}/${newId}`, { body: { name: "Caroline" } });
check("PUT record returns 200", put.status === 200, `got ${put.status}`);
check("PUT replaced record (no stale fields)",
  put.json?.name === "Caroline" && put.json?.active === undefined);

// 7. DELETE the record
const delItem = await call("DELETE", `/api/mock/${id}/${newId}`);
check("DELETE record returns 200", delItem.status === 200, `got ${delItem.status}`);
const afterDel = await call("GET", `/api/mock/${id}`);
check("record count back to 2", Array.isArray(afterDel.json) && afterDel.json.length === 2,
  `got ${afterDel.json?.length}`);

// 8. Edit-token gate: collection DELETE without a token must be rejected
const noToken = await call("DELETE", `/api/mock/${id}`);
check("collection DELETE without token is 403", noToken.status === 403, `got ${noToken.status}`);

// 9. Owner replace whole collection (with token)
const replaced = await call("PUT", `/api/mock/${id}`, {
  token: editToken,
  body: { data: [{ id: 99, name: "Only one" }] },
});
check("owner PUT collection returns 200", replaced.status === 200, `got ${replaced.status}`);
check("collection replaced to 1 record", Array.isArray(replaced.json) && replaced.json.length === 1);

// 10. Cleanup: owner delete whole collection
const cleanup = await call("DELETE", `/api/mock/${id}`, { token: editToken });
check("owner DELETE collection returns 200", cleanup.status === 200, `got ${cleanup.status}`);
const gone = await call("GET", `/api/mock/${id}`);
check("collection is gone (404)", gone.status === 404, `got ${gone.status}`);

summarize();

function summarize() {
  console.log(`\n${failed === 0 ? "✅" : "❌"}  ${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}
