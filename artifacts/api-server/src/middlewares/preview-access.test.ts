import express from "express";
import request from "supertest";
import { expect, it } from "vitest";
import { previewAccess } from "./preview-access";

it("protects the preview pages, assets and API while allowing readiness probes", async () => {
  const app = express();
  app.use(previewAccess("test-password"));
  app.use((req, res) => res.json({ forwardedAuthorization: req.get("authorization") ?? null }));
  for (const path of ["/homebase", "/assets/app.js", "/api/homebases"]) {
    const response = await request(app).get(path);
    expect(response.status).toBe(401);
    expect(response.headers["www-authenticate"]).toContain("Boardwork preview");
    await request(app).get(path).auth("preview", "incorrect").expect(401);
    await request(app).get(path).auth("preview", "test-password")
      .expect(200, { forwardedAuthorization: null });
  }
  await request(app).get("/api/readyz").expect(200);
  await request(app).post("/api/readyz").expect(401);
});
