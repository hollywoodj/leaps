const http = require("node:http");
const path = require("node:path");

const NATIVE_MODULES = ["better-sqlite3", "bindings", "file-uri-to-path"];
const LOG_LIMIT = 8000;

function nativeModulesToCopy() {
  return [...NATIVE_MODULES];
}

function sanitizeEnv(env) {
  const out = {};
  for (const [key, value] of Object.entries(env)) {
    if (value == null) continue;
    out[key] = String(value);
  }
  return out;
}

function sqliteModulePath({ isPackaged, resourcesPath, standaloneDir, projectNodeModules }) {
  if (!isPackaged) return projectNodeModules;
  return [
    path.join(standaloneDir, "node_modules"),
    path.join(resourcesPath, "app.asar.unpacked", "node_modules"),
  ].join(path.delimiter);
}

function createBackendEnv({ port, dbPath, nodePath, baseEnv, packaged }) {
  const env = sanitizeEnv({
    ...baseEnv,
    PORT: String(port),
    HOST: "127.0.0.1",
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
    LEAPS_DB_PATH: dbPath,
    NODE_PATH: nodePath,
  });
  if (packaged) env.ELECTRON_RUN_AS_NODE = "1";
  return env;
}

function spawnStdio() {
  return ["ignore", "pipe", "pipe"];
}

function createLogBuffer() {
  return { chunks: [] };
}

function appendLog(buffer, chunk) {
  buffer.chunks.push(String(chunk));
  const text = buffer.chunks.join("");
  if (text.length > LOG_LIMIT) buffer.chunks = [text.slice(-LOG_LIMIT)];
}

function logsText(buffer) {
  return buffer.chunks.join("");
}

function captureProcessOutput(child, buffer) {
  const onData = (chunk) => appendLog(buffer, chunk);
  child.stdout?.on("data", onData);
  child.stderr?.on("data", onData);
}

function formatBackendError({ code, logs, serverJs, cause }) {
  const output = (logs || "").trim();
  const details = output ? `\n\n${output}` : `\n\nNo server output was captured. Expected Next.js at ${serverJs}`;
  if (cause) return `${cause}${details}`;
  if (code === 0 || code == null) return `The Leaps server stopped before it was ready.${details}`;
  return `The Leaps server exited with code ${code} before it was ready.${details}`;
}

function waitForHealth(port, options = {}) {
  const attempts = options.attempts ?? 80;
  const delayMs = options.delayMs ?? 250;
  const isAborted = options.isAborted ?? (() => false);
  return new Promise((resolve, reject) => {
    let n = 0;
    const tick = () => {
      if (isAborted()) {
        reject(new Error("Server did not start"));
        return;
      }
      const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) {
          resolve();
          return;
        }
        if (++n >= attempts) reject(new Error("Server health check failed"));
        else setTimeout(tick, delayMs);
      });
      req.on("error", () => {
        if (isAborted()) {
          reject(new Error("Server did not start"));
          return;
        }
        if (++n >= attempts) reject(new Error("Server did not start"));
        else setTimeout(tick, delayMs);
      });
      req.setTimeout(800, () => req.destroy());
    };
    tick();
  });
}

module.exports = {
  appendLog,
  captureProcessOutput,
  createBackendEnv,
  createLogBuffer,
  formatBackendError,
  logsText,
  nativeModulesToCopy,
  sanitizeEnv,
  spawnStdio,
  sqliteModulePath,
  waitForHealth,
};
