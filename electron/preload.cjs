const { contextBridge, ipcRenderer } = require("electron");

const appName = process.argv.some((arg) => String(arg).includes("leaps-app=pet")) ? "pet" : "leaps";

contextBridge.exposeInMainWorld("leaps", {
  app: appName,
  onMenuCommand: (callback) => {
    const listener = (_event, command) => callback(command);
    ipcRenderer.on("menu-command", listener);
    return () => ipcRenderer.removeListener("menu-command", listener);
  },
});
