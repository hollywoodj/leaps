const { app } = require("electron");

function log(message) {
  console.log(`[updater] ${message}`);
}

function initAutoUpdate() {
  if (!app.isPackaged) {
    log("skipped — development build");
    return;
  }

  if (process.platform === "darwin") {
    log("skipped — macOS auto-update needs a signed build");
    return;
  }

  const { autoUpdater } = require("electron-updater");
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = { info: log, warn: log, error: log, debug: () => {} };
  autoUpdater.on("update-available", (info) => log(`update available: ${info.version}`));
  autoUpdater.on("update-not-available", () => log("already up to date"));
  autoUpdater.on("error", (err) => log(`check failed: ${err?.message ?? err}`));
  autoUpdater.checkForUpdates().catch((err) => log(`check failed: ${err?.message ?? err}`));
}

module.exports = { initAutoUpdate };
