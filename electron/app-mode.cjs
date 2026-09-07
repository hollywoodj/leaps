const fs = require("node:fs");
const path = require("node:path");

function readPkgName() {
  try {
    return require("../package.json").name;
  } catch {
    return "leaps";
  }
}

function isPetApp({ env = process.env, argv = process.argv, pkgName } = {}) {
  if (env.LEAPS_APP === "pet") return true;
  if (argv.includes("--pet")) return true;
  return (pkgName ?? readPkgName()) === "pocket-pet";
}

function leapsDataDirs(appData) {
  return [path.join(appData, "Leaps"), path.join(appData, "leaps")];
}

function resolveLeapsDbPath({ appData, projectRoot, env = process.env, exists = fs.existsSync } = {}) {
  if (env.LEAPS_DB_PATH) return env.LEAPS_DB_PATH;
  const candidates = [
    ...leapsDataDirs(appData).map((dir) => path.join(dir, "data", "leaps.db")),
    path.join(projectRoot, "data", "leaps.db"),
  ];
  for (const candidate of candidates) {
    if (exists(candidate)) return candidate;
  }
  return path.join(appData, "leaps", "data", "leaps.db");
}

module.exports = { isPetApp, leapsDataDirs, readPkgName, resolveLeapsDbPath };
