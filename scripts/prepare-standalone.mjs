import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

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

const nestedSqlite = join(standalone, "node_modules", "better-sqlite3");
if (existsSync(nestedSqlite)) {
  rmSync(nestedSqlite, { recursive: true, force: true });
}

console.log("Standalone app is ready for Electron.");
