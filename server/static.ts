import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const indexPath = path.resolve(distPath, "index.html");
  const indexHtml = fs.readFileSync(indexPath, "utf8");

  function withPublicOrigin(html: string): string {
    const origin = (process.env.PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
    if (!origin || !/^https?:\/\//i.test(origin)) return html;
    return html.replace(
      /<meta property="og:url" content="[^"]*"\s*\/?>/,
      `<meta property="og:url" content="${origin}/" />`,
    );
  }

  app.use(express.static(distPath, { index: false }));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (_req, res) => {
    res.type("html").send(withPublicOrigin(indexHtml));
  });
}
