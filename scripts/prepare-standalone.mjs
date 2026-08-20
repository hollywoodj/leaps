import { cpSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { removeSqlitePackages, rewriteStandaloneServerFile } = require("./copy-native-modules.cjs");
const electronDir = join(dirname(fileURLToPath(import.meta.url)), "..", "electron");

const root = process.cwd();
const standalone = join(root, ".next", "standalone");
const staticSrc = join(root, ".next", "static");
const publicSrc = join(root, "public");

if (!existsSync(join(standalone, "server.js"))) {
  throw new Error("Next.js standalone output is missing. Run `next build` first.");
}

const staticDest = join(standalone, ".next", "static");
mkdirSync(staticDest, { recursive: true });
cpSync(staticSrc, staticDest, { recursive: true });

if (existsSync(publicSrc)) {
  cpSync(publicSrc, join(standalone, "public"), { recursive: true });
}

// Next.js traces a Node-ABI copy. Packaged apps replace it in afterPack with
// the Electron-rebuilt native module plus its loader packages.
const removed = removeSqlitePackages(standalone);
if (removed.length) {
  console.log(`Removed ${removed.length} Node-ABI sqlite package(s) from standalone.`);
}

if (rewriteStandaloneServerFile(standalone)) {
  console.log("Rewrote standalone server.js tracing roots to the packaged directory.");
}

cpSync(join(electronDir, "server-bootstrap.cjs"), join(standalone, "server-bootstrap.cjs"));

console.log("Standalone app is ready for Electron.");
