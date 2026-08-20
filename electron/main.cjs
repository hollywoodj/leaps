const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const { spawn } = require("node:child_process");
const { initAutoUpdate } = require("./updater.cjs");

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

function waitForHealth(port, attempts = 80) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const tick = () => {
      const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) resolve();
        else if (++n >= attempts) reject(new Error("Server health check failed"));
        else setTimeout(tick, 250);
      });
      req.on("error", () => {
        if (++n >= attempts) reject(new Error("Server did not start"));
        else setTimeout(tick, 250);
      });
    };
    tick();
  });
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
        { label: "Today", accelerator: "CommandOrControl+1", click: () => send({ type: "today" }) },
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

function sqliteModulePath() {
  if (app.isPackaged) {
    return [
      path.join(process.resourcesPath, "app.asar.unpacked", "node_modules"),
      path.join(process.resourcesPath, "app.asar", "node_modules"),
    ].join(path.delimiter);
  }
  return path.join(__dirname, "..", "node_modules");
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

    const env = {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
      LEAPS_DB_PATH: dbPath(),
      NODE_PATH: sqliteModulePath(),
    };

    if (app.isPackaged) {
      env.ELECTRON_RUN_AS_NODE = "1";
      serverProcess = spawn(process.execPath, [serverJs], {
        cwd: dir,
        env,
        stdio: "inherit",
        windowsHide: true,
      });
    } else {
      serverProcess = spawn(process.platform === "win32" ? "node.exe" : "node", [serverJs], {
        cwd: dir,
        env,
        stdio: "inherit",
        windowsHide: true,
      });
    }

    serverProcess.on("error", reject);
    serverProcess.on("exit", (code) => {
      if (code && code !== 0) console.error(`${APP_NAME} server exited with code ${code}`);
    });
    waitForHealth(port).then(resolve).catch(reject);
  });
}

function stopBackend() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill("SIGTERM");
    serverProcess = null;
  }
}

function windowOptions() {
  return {
    width: 920,
    height: 780,
    minWidth: 390,
    minHeight: 640,
    title: APP_NAME,
    backgroundColor: "#0b3d8c",
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
