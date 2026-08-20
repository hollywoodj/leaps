const path = require("node:path");
const { copyNativeModules, packagedResourcesDir } = require("./copy-native-modules.cjs");

async function afterPack(context) {
  const resources = packagedResourcesDir(context.appOutDir, context.electronPlatformName);
  const standaloneModules = path.join(resources, "standalone", "node_modules");
  const projectModules = path.join(context.packager.projectDir, "node_modules");
  copyNativeModules(projectModules, standaloneModules);
}

module.exports = afterPack;
module.exports.default = afterPack;
