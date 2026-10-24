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
  assert.match(
    await (
      await call("/homebase", { headers: { accept: "text/html" } })
    ).text(),
    /<title>Boardwork<\/title>/,
  );
  const content = {
    name: "Smoke homebase",
    classId: item.id,
    tone: "paper",
    widgets: [],
  };
  const createBoard = await call("/api/homebases", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(content),
  });
  assert.equal(createBoard.status, 201);
  const board = await createBoard.json();
  const update = {
    ...content,
    name: "Remembered homebase",
    revision: board.revision,
  };
  const saved = await call(`/api/homebases/${board.id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(update),
  });
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).revision, 2);
  const listed = await (await call(`/api/homebases?classId=${item.id}`)).json();
  assert.equal(
    listed.find((row) => row.id === board.id).name,
    "Remembered homebase",
  );
  assert.ok(
    !(await (await call("/api/homebases")).json()).some(
      (row) => row.id === board.id,
    ),
  );
  assert.equal(
    (
      await call(`/api/homebases/${board.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(update),
      })
    ).status,
    409,
  );
  assert.equal(
    (await call(`/api/homebases/${board.id}?revision=1`, { method: "DELETE" }))
      .status,
    409,
  );
  assert.equal(
    (await call(`/api/homebases/${board.id}?revision=2`, { method: "DELETE" }))
      .status,
    204,
  );
} finally {
  assert.equal(
    (await call(`/api/classes/${item.id}`, { method: "DELETE" })).status,
    204,
  );
}
console.log(
  "Standalone smoke passed: readiness, SPA, asset/API boundaries, key-required generation, and PostgreSQL class and homebase create/read/update/delete, scope, and revision conflicts. No AI requests made.",
);
