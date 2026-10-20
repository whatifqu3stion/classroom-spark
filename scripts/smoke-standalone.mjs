import assert from "node:assert/strict";

const base = new URL(process.env.SMOKE_URL || "http://127.0.0.1:8080");
if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname)) {
  throw new Error(
    "Standalone smoke checks only run against a local test deployment.",
  );
}
const call = (route, init) => fetch(new URL(route, base), init);
assert.equal((await call("/api/readyz")).status, 200);
assert.match(
  await (await call("/history", { headers: { accept: "text/html" } })).text(),
  /<title>Boardwork<\/title>/,
);
assert.equal((await call("/missing-asset.js")).status, 404);
assert.equal((await call("/api/missing")).status, 404);
assert.equal(
  (
    await call("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    })
  ).status,
  400,
);
const created = await call("/api/classes", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    name: "Standalone smoke fixture",
    grade: "8",
    subject: "Design",
    defaultDeviceMode: "off",
    defaultDuration: 7,
  }),
});
assert.equal(created.status, 201);
const item = await created.json();
try {
  const state = await (await call("/api/app-state")).json();
  assert.ok(state.classes.some((row) => row.id === item.id));
} finally {
  assert.equal(
    (await call(`/api/classes/${item.id}`, { method: "DELETE" })).status,
    204,
  );
}
console.log(
  "Standalone smoke passed: readiness, SPA, asset/API boundaries, key-required generation, and PostgreSQL class create/read/delete. No AI requests made.",
);
