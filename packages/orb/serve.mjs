import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, "src");
const PORT = 5173;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// Check if connector harness is already running on port 3010
function checkPort(port) {
  return new Promise((resolve) => {
    const s = net.connect({ port, host: "127.0.0.1" }, () => {
      s.destroy();
      resolve(true);
    });
    s.on("error", () => resolve(false));
  });
}

let harnessChild = null;
const harnessUp = await checkPort(3010);
if (!harnessUp) {
  const harnessDir = path.join(__dirname, "..", "harness");
  harnessChild = spawn("node", ["server.mjs"], {
    cwd: harnessDir,
    stdio: "inherit",
    env: { ...process.env, PORT: "3010" },
  });
  console.log("🔌 Auto-started connector harness on http://localhost:3010");
} else {
  console.log("🔌 Connector harness already active on http://localhost:3010");
}

function cleanup() {
  if (harnessChild) {
    try { harnessChild.kill(); } catch {}
  }
}
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(); });
process.on("SIGTERM", () => { cleanup(); process.exit(); });

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split("?")[0]);
  if (reqPath === "/") reqPath = "/index.html";
  const filePath = path.join(SRC_DIR, reqPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(SRC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not Found");
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n🔮 Voxa Orb Web Preview: http://localhost:${PORT} (or http://127.0.0.1:${PORT})`);
  console.log(`🔌 Connectors & Web Search: http://localhost:3010 (or http://127.0.0.1:3010)`);
  console.log(`Press Ctrl+C to stop.\n`);
});
