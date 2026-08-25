const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const net = require("node:net");
const { spawn } = require("node:child_process");
const { initAutoUpdate } = require("./updater.cjs");
const {
  captureProcessOutput,
  createBackendEnv,
  createLogBuffer,
  drainOutput,
  formatBackendError,
  logsText,
  persistLogs,
  spawnStdio,
  sqliteModulePath,
  waitForHealth,
} = require("./backend-utils.cjs");

const APP_NAME = "Leaps";
const isMac = process.platform === "darwin";

let mainWindow = null;
let serverProcess = null;
let serverPort = 3847;

function userDataDir() {
  return path.join(app.getPath("userData"), "data");
}

function dbPath() {
  return path.join(userDataDir(), "leaps.db");
}

function standaloneDir() {
  if (app.isPackaged) return path.join(process.resourcesPath, "standalone");
  return path.join(__dirname, "..", ".next", "standalone");
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 3847;
      server.close(() => resolve(port));
    });
  });
}

function send(command) {
  mainWindow?.webContents.send("menu-command", command);
}

function buildMenu() {
  const template = [
    ...(isMac
      ? [
          {
            label: APP_NAME,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { label: "Settings…", accelerator: "CommandOrControl+,", click: () => send({ type: "settings" }) },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        { label: "New Tracker", accelerator: "CommandOrControl+N", click: () => send({ type: "create" }) },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { label: "Daily Goals", accelerator: "CommandOrControl+1", click: () => send({ type: "today" }) },
        { label: "Reports", accelerator: "CommandOrControl+2", click: () => send({ type: "reports" }) },
        { type: "separator" },
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
    {
      label: "Help",
      submenu: [
        ...(!isMac ? [{ label: "Settings…", accelerator: "CommandOrControl+,", click: () => send({ type: "settings" }) }] : []),
        {
          label: "Show Data Folder",
          click: () => {
            fs.mkdirSync(userDataDir(), { recursive: true });
            shell.openPath(userDataDir());
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function startBackend(port) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(userDataDir(), { recursive: true });
    const dir = standaloneDir();
    const serverJs = path.join(dir, "server.js");
    if (!fs.existsSync(serverJs)) {
      reject(new Error(`Next.js server missing at ${serverJs}. Run npm run build first, or use npm run electron:dev.`));
      return;
    }

    const logs = createLogBuffer();
    const logFile = path.join(userDataDir(), "startup.log");
    const bootstrapJs = path.join(dir, "server-bootstrap.cjs");
    const serverEntry = fs.existsSync(bootstrapJs) ? bootstrapJs : serverJs;
    const env = createBackendEnv({
      port,
      dbPath: dbPath(),
      nodePath: sqliteModulePath({
        isPackaged: app.isPackaged,
        resourcesPath: process.resourcesPath,
        standaloneDir: dir,
        projectNodeModules: path.join(__dirname, "..", "node_modules"),
      }),
      baseEnv: process.env,
      packaged: app.isPackaged,
      startupLog: logFile,
    });
    let settled = false;
    const succeed = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const fail = (err) => {
      if (settled) return;
      settled = true;
      const message = err instanceof Error ? err.message : String(err);
      try {
        persistLogs(logFile, `${message}\n`);
      } catch {
        /* ignore log write failures */
      }
      stopBackend();
      reject(new Error(message));
    };

    serverProcess = spawn(app.isPackaged ? process.execPath : process.platform === "win32" ? "node.exe" : "node", [serverEntry], {
      cwd: dir,
      env,
      stdio: spawnStdio(),
      windowsHide: true,
    });

    captureProcessOutput(serverProcess, logs);
    serverProcess.on("error", (err) => {
      fail(new Error(formatBackendError({ logs: logsText(logs), serverJs, cause: err.message, logFile })));
    });
    serverProcess.on("exit", (code) => {
      if (settled) {
        if (code) console.error(`${APP_NAME} server exited with code ${code}`);
        return;
      }
      drainOutput(() => {
        const output = logsText(logs);
        try {
          persistLogs(logFile, output);
        } catch {
          /* ignore log write failures */
        }
        fail(new Error(formatBackendError({ code, logs: output, serverJs, logFile })));
      });
    });

    waitForHealth(port, { isAborted: () => settled }).then(succeed).catch((err) => {
      const output = logsText(logs);
      try {
        persistLogs(logFile, output);
      } catch {
        /* ignore log write failures */
      }
      fail(new Error(formatBackendError({ logs: output, serverJs, cause: err.message, logFile })));
    });
  });
}

function stopBackend() {
  if (!serverProcess) return;
  const child = serverProcess;
  serverProcess = null;
  try {
    if (process.platform === "win32" && child.pid) {
      spawn("taskkill", ["/pid", String(child.pid), "/f", "/t"], { windowsHide: true, stdio: "ignore" });
    } else if (typeof child.kill === "function") {
      child.kill();
    }
  } catch (err) {
    console.error(`Failed to stop ${APP_NAME} server`, err);
  }
}

function windowOptions() {
  return {
    width: 920,
    height: 780,
    minWidth: 390,
    minHeight: 640,
    title: APP_NAME,
    backgroundColor: "#f2f2f7",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  };
}

function attachWindowGuards(win) {
  win.webContents.setWindowOpenHandler(({ url: openUrl }) => {
    shell.openExternal(openUrl);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, nextUrl) => {
    if (nextUrl.startsWith("http://127.0.0.1:") || nextUrl.startsWith("http://localhost:")) return;
    if (nextUrl.startsWith("file:")) return;
    event.preventDefault();
    shell.openExternal(nextUrl);
  });
  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });
}

async function createWindow() {
  const win = new BrowserWindow(windowOptions());
  mainWindow = win;
  attachWindowGuards(win);
  win.once("ready-to-show", () => win.show());
  await win.loadFile(path.join(__dirname, "loading.html"));
  return win;
}

async function loadApp(win, url) {
  await win.loadURL(url);
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    buildMenu();
    try {
      const win = await createWindow();
      if (process.env.ELECTRON_START_URL) {
        serverPort = Number(new URL(process.env.ELECTRON_START_URL).port || 3001);
        await loadApp(win, process.env.ELECTRON_START_URL);
      } else {
        serverPort = await getFreePort();
        await startBackend(serverPort);
        await loadApp(win, `http://127.0.0.1:${serverPort}/`);
      }
      initAutoUpdate();
    } catch (err) {
      dialog.showErrorBox(`${APP_NAME} failed to start`, err instanceof Error ? err.message : String(err));
      app.quit();
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const url = process.env.ELECTRON_START_URL || (serverProcess ? `http://127.0.0.1:${serverPort}/` : null);
      if (!url) return;
      const win = await createWindow();
      await loadApp(win, url);
    }
  });

  app.on("before-quit", () => stopBackend());
}

ipcMain.on("open-external", (_event, url) => {
  if (typeof url === "string" && url.trim()) shell.openExternal(url);
});
