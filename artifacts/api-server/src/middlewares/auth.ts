/**
 * APP_PASSWORD gate.
 *
 * When the APP_PASSWORD env var is set every API route (except /healthz and
 * /auth/*) requires a valid signed session cookie.  The cookie is set by
 * POST /api/auth/login and cleared by POST /api/auth/logout.
 *
 * Production startup requires APP_PASSWORD. Without it this middleware is a no-op in development, so development
 * environments remain unaffected.
 *
 * Security properties:
 * - Fails CLOSED at startup: if APP_PASSWORD is set but SESSION_SECRET is
 *   absent or too short the process exits immediately.
 * - No known fallback secret: there is no hard-coded default.
 * - Server-verified expiry: the signed payload contains an `exp` timestamp
 *   that is checked on every request. maxAge only controls the browser
 *   cookie lifetime; server-side expiry is the real enforcement boundary.
 * - Sliding session: every valid authenticated request reissues the same
 *   14-day session window, so active teachers are not interrupted by an
 *   otherwise idle browser-cookie expiry.
 * - Constant-time comparisons for both password check and signature verify.
 */

import type { Request, Response, NextFunction, RequestHandler } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import cookieParser from "cookie-parser";
import { logger } from "../lib/logger";

const COOKIE_NAME = "bw-auth";
const TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const MIN_SECRET_LENGTH = 32;

// ── startup validation ────────────────────────────────────────────────────────

/**
 * Call once at process startup (before app.listen).
 * Throws (terminates the process) when APP_PASSWORD is configured but
 * SESSION_SECRET is absent or too weak.
 */
export function validateAuthConfig(): void {
  const password = process.env["APP_PASSWORD"];
  if (!password) {
    if (process.env["NODE_ENV"] === "production") {
      throw new Error("APP_PASSWORD and SESSION_SECRET are required for production API deployments.");
    }
    return;
  }

  const secret = process.env["SESSION_SECRET"];
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `APP_PASSWORD is set but SESSION_SECRET is ${
        secret ? `too short (${secret.length} chars; need ≥ ${MIN_SECRET_LENGTH})` : "absent"
      }. Set a strong SESSION_SECRET.`,
    );
  }

  logger.info("APP_PASSWORD gate is active");
}

// ── token helpers ─────────────────────────────────────────────────────────────

interface TokenPayload {
  sub: "authenticated";
  exp: number; // Unix milliseconds
}

function secret(): string {
  // We know SESSION_SECRET is present and strong because validateAuthConfig()
  // ran at startup — but guard defensively so TypeScript is happy.
  const s = process.env["SESSION_SECRET"];
  if (!s) throw new Error("SESSION_SECRET missing — validateAuthConfig() was not called");
  return s;
}

function hmac(data: string, key: string): string {
  return createHmac("sha256", key).update(data).digest("base64url");
}

function mintToken(): string {
  const payload: TokenPayload = {
    sub: "authenticated",
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = hmac(body, secret());
  return `${body}.${sig}`;
}

function setAuthCookie(res: Response, token: string): void {
  const isProduction = process.env["NODE_ENV"] === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: TOKEN_TTL_MS,
    path: "/",
  });
}

/**
 * Returns the parsed payload if the token is structurally valid, correctly
 * signed, and not expired.  Returns null for any failure.
 */
function verifyToken(raw: string): TokenPayload | null {
  const dot = raw.lastIndexOf(".");
  if (dot < 1) return null;

  const body = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);

  // Constant-time signature check
  const expected = Buffer.from(hmac(body, secret()));
  const actual = Buffer.from(sig);
  let valid = false;
  try {
    valid =
      expected.length > 0 &&
      expected.length === actual.length &&
      timingSafeEqual(expected, actual);
  } catch {
    return null;
  }
  if (!valid) return null;

  // Parse payload
  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (
    typeof payload !== "object" ||
    payload === null ||
    (payload as Record<string, unknown>)["sub"] !== "authenticated" ||
    typeof (payload as Record<string, unknown>)["exp"] !== "number"
  ) {
    return null;
  }

  // Server-side expiry check (not trusting browser maxAge alone)
  const exp = (payload as TokenPayload).exp;
  if (Date.now() > exp) return null;

  return payload as TokenPayload;
}

// ── public middleware ─────────────────────────────────────────────────────────

export function cookieMiddleware(): RequestHandler {
  return cookieParser();
}

export function requireAuth(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!process.env["APP_PASSWORD"]) return next(); // gate off

    const path = req.path;
    if (path === "/healthz" || path.startsWith("/auth/")) return next();

    const raw = (req.cookies as Record<string, unknown>)?.[COOKIE_NAME];
    if (typeof raw !== "string" || !verifyToken(raw)) {
      res.status(401).json({ error: "authentication_required" });
      return;
    }
    // Rotate the signed token and refresh the browser expiry on every
    // authenticated request. The old token remains valid until its original
    // expiry, which keeps concurrent requests from racing each other out.
    setAuthCookie(res, mintToken());
    next();
  };
}

// ── route handlers ────────────────────────────────────────────────────────────

export function handleAuthStatus(req: Request, res: Response): void {
  const passwordRequired = Boolean(process.env["APP_PASSWORD"]);
  if (!passwordRequired) {
    res.json({ passwordRequired: false, authenticated: true });
    return;
  }
  const raw = (req.cookies as Record<string, unknown>)?.[COOKIE_NAME];
  const authenticated = typeof raw === "string" && verifyToken(raw) !== null;
  if (authenticated) {
    // The status check is the first request made after a cold browser load,
    // so it must also slide the session window.
    setAuthCookie(res, mintToken());
  }
  res.json({ passwordRequired: true, authenticated });
}

export function handleLogin(req: Request, res: Response): void {
  const password = process.env["APP_PASSWORD"];
  if (!password) {
    res.json({ ok: true });
    return;
  }

  const submitted: unknown = (req.body as Record<string, unknown>)?.["password"];
  if (typeof submitted !== "string" || submitted.length === 0) {
    res.status(400).json({ error: "password_required" });
    return;
  }

  // Constant-time password comparison (pad to equal length first)
  const maxLen = Math.max(submitted.length, password.length);
  const a = Buffer.alloc(maxLen);
  const b = Buffer.alloc(maxLen);
  a.write(submitted);
  b.write(password);

  let match = false;
  try {
    match = timingSafeEqual(a, b) && submitted.length === password.length;
  } catch {
    match = false;
  }

  if (!match) {
    logger.warn("Failed login attempt");
    res.status(401).json({ error: "invalid_password" });
    return;
  }

  setAuthCookie(res, mintToken());
  res.json({ ok: true });
}

export function handleLogout(_req: Request, res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
}
