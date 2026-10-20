import express, { type Express } from "express";
import path from "node:path";

/** Serve built frontend files and client-side routes from the API's origin. */
export function serveFrontend(app: Express, directory: string): void {
  const root = path.resolve(directory);
  app.use(
    express.static(root, { index: false, maxAge: "1h", dotfiles: "deny" }),
  );
  app.get("/{*route}", (req, res, next) => {
    if (!req.accepts("html") || path.extname(req.path) || req.path.split("/").some(part => part.startsWith("."))) return next();
    res.setHeader("Cache-Control", "no-store");
    res.sendFile(path.join(root, "index.html"));
  });
}
