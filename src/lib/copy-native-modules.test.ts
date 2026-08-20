import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
  copyNativeModules,
  packagedResourcesDir,
  removeSqlitePackages,
  replaceSqliteAddons,
} = require("../../scripts/copy-native-modules.cjs") as {
  copyNativeModules: (fromDir: string, toDir: string) => string[];
  packagedResourcesDir: (appOutDir: string, electronPlatformName: string, productName?: string) => string;
  removeSqlitePackages: (root: string) => string[];
  replaceSqliteAddons: (root: string, rebuiltAddon: string) => string[];
};

const temps: string[] = [];

afterEach(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
  temps.length = 0;
});

function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), "leaps-native-"));
  temps.push(dir);
  return dir;
}

describe("copyNativeModules", () => {
  it("copies sqlite and its loader packages into standalone node_modules", () => {
    const fromDir = join(tempDir(), "from");
    const toDir = join(tempDir(), "to");
    for (const name of ["better-sqlite3", "bindings", "file-uri-to-path"]) {
      mkdirSync(join(fromDir, name), { recursive: true });
      writeFileSync(join(fromDir, name, "package.json"), JSON.stringify({ name }));
    }
    mkdirSync(join(fromDir, "better-sqlite3", "build", "Release"), { recursive: true });
    writeFileSync(join(fromDir, "better-sqlite3", "build", "Release", "better_sqlite3.node"), "native");

    expect(copyNativeModules(fromDir, toDir)).toEqual(["better-sqlite3", "bindings", "file-uri-to-path"]);
    expect(readFileSync(join(toDir, "better-sqlite3", "build", "Release", "better_sqlite3.node"), "utf8")).toBe("native");
    expect(JSON.parse(readFileSync(join(toDir, "bindings", "package.json"), "utf8")).name).toBe("bindings");
  });

  it("fails if a required native package is missing", () => {
    expect(() => copyNativeModules(join(tempDir(), "empty"), join(tempDir(), "to"))).toThrow(/Native module missing/);
  });

  it("removes traced sqlite packages including hashed copies", () => {
    const root = tempDir();
    mkdirSync(join(root, "node_modules", "better-sqlite3"), { recursive: true });
    mkdirSync(join(root, ".next", "node_modules", "better-sqlite3-abc123"), { recursive: true });
    writeFileSync(join(root, "node_modules", "better-sqlite3", "index.js"), "old");
    writeFileSync(join(root, ".next", "node_modules", "better-sqlite3-abc123", "index.js"), "hashed");
    const removed = removeSqlitePackages(root);
    expect(removed.length).toBe(2);
    expect(existsSync(join(root, "node_modules", "better-sqlite3"))).toBe(false);
    expect(existsSync(join(root, ".next", "node_modules", "better-sqlite3-abc123"))).toBe(false);
  });

  it("overwrites leftover sqlite addons with the Electron-rebuilt binary", () => {
    const root = tempDir();
    const hashed = join(root, ".next", "node_modules", "better-sqlite3-hash", "build", "Release");
    mkdirSync(hashed, { recursive: true });
    writeFileSync(join(hashed, "better_sqlite3.node"), "node-abi");
    const rebuilt = join(tempDir(), "better_sqlite3.node");
    writeFileSync(rebuilt, "electron-abi");
    const replaced = replaceSqliteAddons(root, rebuilt);
    expect(readFileSync(join(hashed, "better_sqlite3.node"), "utf8")).toBe("electron-abi");
    expect(readFileSync(join(root, "node_modules", "better-sqlite3", "build", "Release", "better_sqlite3.node"), "utf8")).toBe(
      "electron-abi",
    );
    expect(replaced.length).toBeGreaterThanOrEqual(2);
  });
});

describe("packagedResourcesDir", () => {
  it("uses Contents/Resources on macOS and resources elsewhere", () => {
    const macApp = join("dist", "mac", "Leaps.app", "Contents", "MacOS");
    const winApp = join("dist", "win-unpacked");
    const linuxApp = join("dist", "linux-unpacked");
    expect(packagedResourcesDir(macApp, "darwin")).toBe(join("dist", "mac", "Leaps.app", "Contents", "Resources"));
    expect(packagedResourcesDir(winApp, "win32")).toBe(join("dist", "win-unpacked", "resources"));
    expect(packagedResourcesDir(linuxApp, "linux")).toBe(join("dist", "linux-unpacked", "resources"));
  });

  it("resolves electron-builder's mac output folder that contains the .app", () => {
    expect(packagedResourcesDir(join("release", "mac-arm64"), "darwin", "Leaps")).toBe(
      join("release", "mac-arm64", "Leaps.app", "Contents", "Resources"),
    );
    expect(packagedResourcesDir(join("release", "mac"), "darwin")).not.toBe(join("release", "Resources"));
  });
});
