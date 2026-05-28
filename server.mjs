import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT || 5173);
const host = "127.0.0.1";
const root = fileURLToPath(new URL(".", import.meta.url));

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

async function resolveFilePath(pathname) {
  let requestedPath = pathname === "/" ? "/index.html" : pathname;

  if (requestedPath.endsWith("/")) {
    requestedPath += "index.html";
  }

  const candidates = [requestedPath];

  if (!extname(requestedPath)) {
    candidates.push(`${requestedPath}/index.html`);
  }

  for (const candidate of candidates) {
    const filePath = normalize(join(root, decodeURIComponent(candidate)));

    if (!filePath.startsWith(normalize(root))) {
      return null;
    }

    try {
      const info = await stat(filePath);
      if (info.isFile()) {
        return filePath;
      }
    } catch {
      continue;
    }
  }

  return null;
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${host}:${port}`);
    const filePath = await resolveFilePath(url.pathname);

    if (!filePath) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(port, host, () => {
  console.log(`LegalFlow landing running at http://${host}:${port}`);
});
