const path = require("node:path");
const { existsSync } = require("node:fs");
const {
  copyNativeModules,
  packagedResourcesDir,
  rebuiltSqliteAddon,
  replaceSqliteAddons,
} = require("./copy-native-modules.cjs");

async function afterPack(context) {
  const productName = context.packager.appInfo?.productFilename || context.packager.appInfo?.productName || "Leaps";
  const resources = packagedResourcesDir(context.appOutDir, context.electronPlatformName, productName);
  const standalone = path.join(resources, "standalone");
  const serverJs = path.join(standalone, "server.js");
  if (!existsSync(serverJs)) {
    throw new Error(`afterPack: Next.js standalone server missing at ${serverJs} (appOutDir=${context.appOutDir})`);
  }

  const projectDir = context.packager.projectDir || process.cwd();
  const projectModules = path.join(projectDir, "node_modules");
  const copied = copyNativeModules(projectModules, path.join(standalone, "node_modules"));
  const replaced = replaceSqliteAddons(standalone, rebuiltSqliteAddon(projectModules));
  console.log(`afterPack: copied ${copied.join(", ")} and replaced ${replaced.length} sqlite addons`);
}

module.exports = afterPack;
module.exports.default = afterPack;
