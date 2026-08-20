const { cpSync, existsSync, mkdirSync, readdirSync, rmSync } = require("node:fs");
const path = require("node:path");
const { nativeModulesToCopy } = require("../electron/backend-utils.cjs");

function packagedResourcesDir(appOutDir, electronPlatformName, productName = "Leaps") {
  if (electronPlatformName !== "darwin") return path.join(appOutDir, "resources");
  // electron-builder 26 passes the folder that contains Foo.app (release/mac-arm64).
  // Older layouts pass Contents/MacOS.
  if (path.basename(appOutDir) === "MacOS") return path.join(appOutDir, "..", "Resources");
  return path.join(appOutDir, `${productName}.app`, "Contents", "Resources");
}

function isSqlitePackageName(name) {
  return name === "better-sqlite3" || name.startsWith("better-sqlite3-");
}

function removeSqlitePackages(root) {
  const removed = [];
  if (!existsSync(root)) return removed;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (!entry.isDirectory()) continue;
    if (isSqlitePackageName(entry.name)) {
      rmSync(full, { recursive: true, force: true });
      removed.push(full);
      continue;
    }
    removed.push(...removeSqlitePackages(full));
  }
  return removed;
}

function copyNativeModules(fromDir, toDir) {
  mkdirSync(toDir, { recursive: true });
  const copied = [];
  for (const name of nativeModulesToCopy()) {
    const from = path.join(fromDir, name);
    const to = path.join(toDir, name);
    if (!existsSync(from)) throw new Error(`Native module missing: ${from}`);
    rmSync(to, { recursive: true, force: true });
    cpSync(from, to, { recursive: true, dereference: true });
    copied.push(name);
  }
  return copied;
}

function rebuiltSqliteAddon(projectModules) {
  return path.join(projectModules, "better-sqlite3", "build", "Release", "better_sqlite3.node");
}

function replaceSqliteAddons(root, rebuiltAddon) {
  if (!existsSync(rebuiltAddon)) throw new Error(`Rebuilt sqlite addon missing: ${rebuiltAddon}`);
  const replaced = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (entry.name === "better_sqlite3.node") {
        cpSync(rebuiltAddon, full);
        replaced.push(full);
      }
    }
  }
  walk(root);
  const canonical = path.join(root, "node_modules", "better-sqlite3", "build", "Release", "better_sqlite3.node");
  mkdirSync(path.dirname(canonical), { recursive: true });
  cpSync(rebuiltAddon, canonical);
  if (!replaced.includes(canonical)) replaced.push(canonical);
  return replaced;
}

module.exports = {
  copyNativeModules,
  isSqlitePackageName,
  packagedResourcesDir,
  rebuiltSqliteAddon,
  removeSqlitePackages,
  replaceSqliteAddons,
};
