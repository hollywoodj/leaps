const { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
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

// electron-builder's extraResources filter skips a source-root `node_modules`
// directory (app-builder-lib createFilter). Copy it from a FileSet whose `from`
// is the node_modules folder itself, and restore it here if that still happens.
function ensureStandaloneNodeModules(projectDir, standalone) {
  const destNext = path.join(standalone, "node_modules", "next");
  if (existsSync(destNext)) return false;
  const src = path.join(projectDir, ".next", "standalone", "node_modules");
  const srcNext = path.join(src, "next");
  if (!existsSync(srcNext)) {
    throw new Error(
      `Standalone Next.js node_modules missing at ${srcNext}. electron-builder skips a top-level node_modules folder in extraResources.`,
    );
  }
  const dest = path.join(standalone, "node_modules");
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true, dereference: true });
  return true;
}

function assertStandaloneHasNext(standalone) {
  const destNext = path.join(standalone, "node_modules", "next", "package.json");
  if (!existsSync(destNext)) {
    throw new Error(`Packaged standalone is missing Next.js at ${destNext}`);
  }
}

function rewriteStandaloneServerConfig(source) {
  const marker = "process.env.__NEXT_PRIVATE_STANDALONE_CONFIG";
  if (!source.includes(marker) || source.includes("nextConfig.outputFileTracingRoot = dir")) return source;
  const patch = "nextConfig.outputFileTracingRoot = dir\nif (nextConfig.turbopack) nextConfig.turbopack.root = dir\n\n";
  return source.replace(marker, `${patch}${marker}`);
}

function rewriteStandaloneServerFile(standaloneDir) {
  const serverJs = path.join(standaloneDir, "server.js");
  const source = readFileSync(serverJs, "utf8");
  const next = rewriteStandaloneServerConfig(source);
  if (next !== source) writeFileSync(serverJs, next);
  return next !== source;
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
  assertStandaloneHasNext,
  copyNativeModules,
  ensureStandaloneNodeModules,
  isSqlitePackageName,
  packagedResourcesDir,
  rebuiltSqliteAddon,
  removeSqlitePackages,
  replaceSqliteAddons,
  rewriteStandaloneServerConfig,
  rewriteStandaloneServerFile,
};
