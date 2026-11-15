import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";

export function previewAccess(password: string): RequestHandler {
  if (!password) throw new Error("The preview password must not be empty.");
  const digest = (value: string) => createHash("sha256").update(value).digest();
  const expected = digest("Basic " + Buffer.from("preview:" + password).toString("base64"));
  return (req, res, next) => {
    if (["GET", "HEAD"].includes(req.method) && ["/api/readyz", "/api/healthz"].includes(req.path))
      return next();
    res.set("Cache-Control", "private, no-store");
    if (!timingSafeEqual(expected, digest(req.get("Authorization") ?? ""))) {
      res.set("WWW-Authenticate", 'Basic realm="Boardwork preview", charset="UTF-8"');
      res.status(401).send("Sign in to open the Boardwork preview.");
      return;
    }
    delete req.headers.authorization;
    next();
  };
}
