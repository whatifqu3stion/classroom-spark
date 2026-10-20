import express from "express";
import request from "supertest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { serveFrontend } from "./serve-frontend";

it("serves frontend routes without disguising missing assets or API endpoints", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "boardwork-static-"));
  try {
    await writeFile(
      path.join(root, "index.html"),
      "<!doctype html><title>Boardwork</title>",
    );
    await writeFile(path.join(root, "asset.js"), "console.log('fixture');");
    const app = express();
    app.use("/api", (_req, res) => {
      res.status(404).json({ error: "Not found" });
    });
    serveFrontend(app, root);
    expect((await request(app).get("/").accept("html")).text).toContain(
      "Boardwork",
    );
    const history = await request(app).get("/history").accept("html");
    expect(history.status).toBe(200);
    expect(history.headers["cache-control"]).toBe("no-store");
    expect((await request(app).get("/asset.js")).status).toBe(200);
    expect((await request(app).get("/missing.js")).status).toBe(404);
    expect(
      (await request(app).get("/api/missing").accept("html")).body,
    ).toEqual({ error: "Not found" });
    expect((await request(app).get("/.env")).status).toBe(404);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
