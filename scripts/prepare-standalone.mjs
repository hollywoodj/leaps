import { cpSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { removeSqlitePackages } = require("./copy-native-modules.cjs");

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

console.log("Standalone app is ready for Electron.");
