import { createServer } from "node:http";
import { delimiter, join } from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const utils = require("../../electron/backend-utils.cjs") as {
  appendLog: (buffer: { chunks: string[] }, chunk: string) => void;
  createBackendEnv: (input: {
    port: number;
    dbPath: string;
    nodePath: string;
    baseEnv: Record<string, string | undefined>;
    packaged: boolean;
  }) => Record<string, string>;
  createLogBuffer: () => { chunks: string[] };
  formatBackendError: (input: { code?: number | null; logs?: string; serverJs: string; cause?: string; logFile?: string }) => string;
  logsText: (buffer: { chunks: string[] }) => string;
  nativeModulesToCopy: () => string[];
  sanitizeEnv: (env: Record<string, string | null | undefined>) => Record<string, string>;
  spawnStdio: () => string[];
  sqliteModulePath: (input: {
    isPackaged: boolean;
    resourcesPath: string;
    standaloneDir: string;
    projectNodeModules: string;
  }) => string;
  waitForHealth: (
    port: number,
    options?: { attempts?: number; delayMs?: number; isAborted?: () => boolean },
  ) => Promise<void>;
};

describe("backend env", () => {
  it("drops nullish values so Windows spawn does not fail", () => {
    expect(utils.sanitizeEnv({ PATH: "C:\\Windows", EMPTY: undefined, NONE: null, PORT: 3847 as unknown as string })).toEqual({
      PATH: "C:\\Windows",
      PORT: "3847",
    });
  });

  it("forces loopback and ELECTRON_RUN_AS_NODE for packaged builds", () => {
    const env = utils.createBackendEnv({
      port: 4123,
      dbPath: "C:\\Users\\dev\\AppData\\Roaming\\Leaps\\data\\leaps.db",
      nodePath: "C:\\app\\resources\\standalone\\node_modules",
      baseEnv: { PATH: "C:\\Windows", HOSTNAME: "DESKTOP-BOX", ELECTRON_RUN_AS_NODE: undefined },
      packaged: true,
    });
    expect(env.PORT).toBe("4123");
    expect(env.HOST).toBe("127.0.0.1");
    expect(env.HOSTNAME).toBe("127.0.0.1");
    expect(env.ELECTRON_RUN_AS_NODE).toBe("1");
    expect(env.ELECTRON_NO_ASAR).toBe("1");
    expect(env.LEAPS_DB_PATH).toContain("leaps.db");
    expect(env.NODE_ENV).toBe("production");
  });

  it("does not set ELECTRON_RUN_AS_NODE when unpackaged", () => {
    const env = utils.createBackendEnv({
      port: 3001,
      dbPath: "/tmp/leaps.db",
      nodePath: "/tmp/node_modules",
      baseEnv: {},
      packaged: false,
    });
    expect(env.ELECTRON_RUN_AS_NODE).toBeUndefined();
    expect(env.ELECTRON_NO_ASAR).toBeUndefined();
  });
});

describe("sqlite module path", () => {
  it("prefers standalone then asar.unpacked, never the asar archive", () => {
    const resolved = utils.sqliteModulePath({
      isPackaged: true,
      resourcesPath: "/tmp/app/resources",
      standaloneDir: "/tmp/app/resources/standalone",
      projectNodeModules: "/tmp/src/node_modules",
    });
    expect(resolved.split(delimiter)).toEqual([
      join("/tmp/app/resources/standalone", "node_modules"),
      join("/tmp/app/resources", "app.asar.unpacked", "node_modules"),
    ]);
    expect(resolved.split(delimiter).some((entry) => /app\.asar[/\\]node_modules$/.test(entry))).toBe(false);
  });

  it("uses the project node_modules when unpackaged", () => {
    expect(
      utils.sqliteModulePath({
        isPackaged: false,
        resourcesPath: "/tmp/resources",
        standaloneDir: "/tmp/standalone",
        projectNodeModules: "/tmp/project/node_modules",
      }),
    ).toBe("/tmp/project/node_modules");
  });
});

describe("spawn and errors", () => {
  it("uses piped stdio instead of inherit", () => {
    expect(utils.spawnStdio()).toEqual(["ignore", "pipe", "pipe"]);
  });

  it("keeps sqlite loader packages together", () => {
    expect(utils.nativeModulesToCopy()).toEqual(["better-sqlite3", "bindings", "file-uri-to-path"]);
  });

  it("includes captured server logs in the startup error", () => {
    const message = utils.formatBackendError({
      code: 1,
      logs: "Error: Cannot find module 'better-sqlite3'\n",
      serverJs: "C:\\app\\resources\\standalone\\server.js",
      logFile: "C:\\Users\\dev\\AppData\\Roaming\\Leaps\\data\\startup.log",
    });
    expect(message).toContain("exited with code 1");
    expect(message).toContain("Cannot find module 'better-sqlite3'");
    expect(message).toContain("startup.log");
  });

  it("trims captured logs to a bounded buffer", () => {
    const buffer = utils.createLogBuffer();
    utils.appendLog(buffer, "a".repeat(9000));
    expect(utils.logsText(buffer).length).toBeLessThanOrEqual(8000);
  });
});

describe("waitForHealth", () => {
  it("resolves when /api/health returns 200", async () => {
    const server = createServer((_req, res) => {
      res.writeHead(200);
      res.end("ok");
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    await expect(utils.waitForHealth(port, { attempts: 5, delayMs: 10 })).resolves.toBeUndefined();
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  });

  it("stops retrying once the backend process is gone", async () => {
    await expect(
      utils.waitForHealth(1, {
        attempts: 20,
        delayMs: 20,
        isAborted: () => true,
      }),
    ).rejects.toThrow("Server did not start");
  });
});
