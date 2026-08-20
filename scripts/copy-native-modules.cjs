const { cpSync, existsSync, mkdirSync, rmSync } = require("node:fs");
const path = require("node:path");
const { nativeModulesToCopy } = require("../electron/backend-utils.cjs");

function packagedResourcesDir(appOutDir, electronPlatformName) {
  if (electronPlatformName === "darwin") return path.join(appOutDir, "..", "Resources");
  return path.join(appOutDir, "resources");
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

module.exports = { copyNativeModules, packagedResourcesDir };
