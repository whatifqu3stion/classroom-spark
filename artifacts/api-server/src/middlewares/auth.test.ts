/**
 * Tests for the APP_PASSWORD auth middleware.
 *
 * Covers:
 * - startup fail-closed behavior (missing / weak SESSION_SECRET)
 * - valid / invalid / expired signed tokens
 * - login success and failure
 * - route protection (401 without cookie, pass-through without APP_PASSWORD)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import express from "express";
import type { Express } from "express";
import { createHmac } from "crypto";

// ── helpers ────────────────────────────────────────────────────────────────

const STRONG_SECRET = "a".repeat(32); // exactly MIN_SECRET_LENGTH chars
const STRONG_PASSWORD = "hunter2-correcthorsebatterystaple";

function setEnv(vars: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
}

function clearAuth() {
  setEnv({
    APP_PASSWORD: undefined,
    SESSION_SECRET: undefined,
    NODE_ENV: "test",
  });
}

// Re-import a fresh module each time because the module reads env vars at
// call-time (not module-load-time), so we don't need module reloading.
async function importAuth() {
  // Use dynamic import to get fresh references; since vitest doesn't cache
  // between tests for dynamic imports here, we rely on call-time env reads.
  return import("./auth");
}

// Minimal test server factory
async function makeApp(): Promise<Express> {
  const { cookieMiddleware, requireAuth, handleAuthStatus, handleLogin, handleLogout } =
    await importAuth();

  const app = express();
  app.use(express.json());
  app.use(cookieMiddleware());
  app.use("/api", requireAuth());

  app.get("/api/healthz", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/auth/status", handleAuthStatus);
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", handleLogout);
  app.get("/api/protected", (_req, res) => res.json({ secret: "data" }));

  return app;
}

// Lightweight supertest-style helper
async function req(
  app: Express,
  method: "GET" | "POST",
  path: string,
  opts: { body?: unknown; cookie?: string } = {},
): Promise<{ status: number; body: unknown; setCookie: string | undefined }> {
  const { default: supertest } = await import("supertest");
  let r = supertest(app)[method === "GET" ? "get" : "post"](path).set(
    "Accept",
    "application/json",
  );
  if (opts.body) r = r.send(opts.body).set("Content-Type", "application/json");
  if (opts.cookie) r = r.set("Cookie", opts.cookie);
  const res = await r;
  const rawCookie = res.headers["set-cookie"];
  const setCookie = Array.isArray(rawCookie) ? rawCookie[0] : rawCookie;
  return { status: res.status, body: res.body as unknown, setCookie };
}

// ── validateAuthConfig ─────────────────────────────────────────────────────

describe("validateAuthConfig", () => {
  afterEach(() => {
    clearAuth();
    vi.useRealTimers();
  });

  it("passes when APP_PASSWORD is not set", async () => {
    clearAuth();
    const { validateAuthConfig } = await importAuth();
    expect(() => validateAuthConfig()).not.toThrow();
  });

  it("throws when APP_PASSWORD is set but SESSION_SECRET is absent", async () => {
    setEnv({ APP_PASSWORD: STRONG_PASSWORD, SESSION_SECRET: undefined });
    const { validateAuthConfig } = await importAuth();
    expect(() => validateAuthConfig()).toThrow(/SESSION_SECRET/);
  });

  it("throws when SESSION_SECRET is present but too short (< 32 chars)", async () => {
    setEnv({ APP_PASSWORD: STRONG_PASSWORD, SESSION_SECRET: "short" });
    const { validateAuthConfig } = await importAuth();
    expect(() => validateAuthConfig()).toThrow(/too short/);
  });

  it("passes when both APP_PASSWORD and a strong SESSION_SECRET are set", async () => {
    setEnv({ APP_PASSWORD: STRONG_PASSWORD, SESSION_SECRET: STRONG_SECRET });
    const { validateAuthConfig } = await importAuth();
    expect(() => validateAuthConfig()).not.toThrow();
  });
});

// ── gate disabled (no APP_PASSWORD) ───────────────────────────────────────

describe("requireAuth — gate disabled", () => {
  let app: Express;

  beforeEach(async () => {
    clearAuth();
    app = await makeApp();
  });

  it("allows unauthenticated access to protected routes", async () => {
    const { status } = await req(app, "GET", "/api/protected");
    expect(status).toBe(200);
  });

  it("auth/status reports passwordRequired: false and authenticated: true", async () => {
    const { status, body } = await req(app, "GET", "/api/auth/status");
    expect(status).toBe(200);
    expect(body).toMatchObject({ passwordRequired: false, authenticated: true });
  });
});

// ── gate enabled ───────────────────────────────────────────────────────────

describe("requireAuth — gate enabled", () => {
  let app: Express;

  beforeEach(async () => {
    setEnv({ APP_PASSWORD: STRONG_PASSWORD, SESSION_SECRET: STRONG_SECRET, NODE_ENV: "test" });
    app = await makeApp();
  });

  afterEach(() => {
    clearAuth();
    vi.useRealTimers();
  });

  it("returns 401 on protected route without cookie", async () => {
    const { status, body } = await req(app, "GET", "/api/protected");
    expect(status).toBe(401);
    expect(body).toMatchObject({ error: "authentication_required" });
  });

  it("allows /api/healthz without authentication", async () => {
    const { status } = await req(app, "GET", "/api/healthz");
    expect(status).toBe(200);
  });

  it("allows /api/auth/* without authentication", async () => {
    const { status } = await req(app, "GET", "/api/auth/status");
    expect(status).toBe(200);
  });

  it("reports passwordRequired: true and authenticated: false before login", async () => {
    const { status, body } = await req(app, "GET", "/api/auth/status");
    expect(status).toBe(200);
    expect(body).toMatchObject({ passwordRequired: true, authenticated: false });
  });

  it("rejects wrong password with 401", async () => {
    const { status, body } = await req(app, "POST", "/api/auth/login", {
      body: { password: "wrong" },
    });
    expect(status).toBe(401);
    expect(body).toMatchObject({ error: "invalid_password" });
  });

  it("returns 400 when password field is missing", async () => {
    const { status } = await req(app, "POST", "/api/auth/login", { body: {} });
    expect(status).toBe(400);
  });

  it("sets a session cookie on correct password", async () => {
    const { status, body, setCookie } = await req(app, "POST", "/api/auth/login", {
      body: { password: STRONG_PASSWORD },
    });
    expect(status).toBe(200);
    expect(body).toMatchObject({ ok: true });
    expect(setCookie).toMatch(/bw-auth=/);
    expect(setCookie).toMatch(/HttpOnly/i);
  });

  it("grants access to protected route with valid cookie", async () => {
    const { setCookie } = await req(app, "POST", "/api/auth/login", {
      body: { password: STRONG_PASSWORD },
    });
    expect(setCookie).toBeDefined();
    const cookieValue = setCookie!.split(";")[0]; // "bw-auth=<token>"
    const { status } = await req(app, "GET", "/api/protected", {
      cookie: cookieValue,
    });
    expect(status).toBe(200);
  });

  it("reports authenticated: true after login cookie", async () => {
    const { setCookie } = await req(app, "POST", "/api/auth/login", {
      body: { password: STRONG_PASSWORD },
    });
    const cookieValue = setCookie!.split(";")[0];
    const { body } = await req(app, "GET", "/api/auth/status", {
      cookie: cookieValue,
    });
    expect(body).toMatchObject({ passwordRequired: true, authenticated: true });
  });

  it("refreshes the session cookie on an authenticated status check", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-21T12:00:00.000Z"));
    const { setCookie } = await req(app, "POST", "/api/auth/login", {
      body: { password: STRONG_PASSWORD },
    });
    const originalCookie = setCookie!.split(";")[0];

    vi.setSystemTime(new Date("2026-08-22T12:00:00.000Z"));
    const { body, setCookie: refreshedCookie } = await req(app, "GET", "/api/auth/status", {
      cookie: originalCookie,
    });

    expect(body).toMatchObject({ passwordRequired: true, authenticated: true });
    expect(refreshedCookie).toMatch(/bw-auth=/);
    expect(refreshedCookie).not.toBe(setCookie);
    expect(refreshedCookie).toMatch(/Max-Age=1209600/);

    // The original token would expire after 14 days from the first login.
    // The refreshed token should keep the active session alive beyond that.
    vi.setSystemTime(new Date("2026-09-05T12:00:00.000Z"));
    const { status } = await req(app, "GET", "/api/protected", {
      cookie: refreshedCookie!.split(";")[0],
    });
    expect(status).toBe(200);
  });

  it("refreshes the session cookie on an authenticated API request", async () => {
    const { setCookie } = await req(app, "POST", "/api/auth/login", {
      body: { password: STRONG_PASSWORD },
    });
    const { status, setCookie: refreshedCookie } = await req(app, "GET", "/api/protected", {
      cookie: setCookie!.split(";")[0],
    });

    expect(status).toBe(200);
    expect(refreshedCookie).toMatch(/bw-auth=/);
  });

  it("clears cookie on logout", async () => {
    const { status, setCookie } = await req(app, "POST", "/api/auth/logout");
    expect(status).toBe(200);
    // Browser is instructed to clear the cookie
    expect(setCookie).toMatch(/bw-auth=;|bw-auth=(?:;|$)/);
  });
});

// ── token expiry ───────────────────────────────────────────────────────────

describe("token expiry — server-side enforcement", () => {
  let app: Express;

  beforeEach(async () => {
    setEnv({ APP_PASSWORD: STRONG_PASSWORD, SESSION_SECRET: STRONG_SECRET, NODE_ENV: "test" });
    app = await makeApp();
  });

  afterEach(() => {
    clearAuth();
    vi.useRealTimers();
  });

  it("rejects a token whose exp is in the past", async () => {
    // Mint a token manually with an already-expired exp
    const expiredPayload = { sub: "authenticated", exp: Date.now() - 1000 };
    const body = Buffer.from(JSON.stringify(expiredPayload)).toString("base64url");
    const sig = createHmac("sha256", STRONG_SECRET).update(body).digest("base64url");
    const expiredToken = `${body}.${sig}`;

    const { status } = await req(app, "GET", "/api/protected", {
      cookie: `bw-auth=${expiredToken}`,
    });
    expect(status).toBe(401);
  });

  it("rejects a token with a tampered signature", async () => {
    // Login to get a real token, then flip one character in the sig
    const { setCookie } = await req(app, "POST", "/api/auth/login", {
      body: { password: STRONG_PASSWORD },
    });
    const kv = setCookie!.split(";")[0]; // "bw-auth=<token>"
    const token = kv.split("=")[1];
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    const { status } = await req(app, "GET", "/api/protected", {
      cookie: `bw-auth=${tampered}`,
    });
    expect(status).toBe(401);
  });
});
