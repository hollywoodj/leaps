import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { copyNativeModules, packagedResourcesDir } = require("../../scripts/copy-native-modules.cjs") as {
  copyNativeModules: (fromDir: string, toDir: string) => string[];
  packagedResourcesDir: (appOutDir: string, electronPlatformName: string) => string;
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
});

describe("packagedResourcesDir", () => {
  it("uses Contents/Resources on macOS and resources elsewhere", () => {
    expect(packagedResourcesDir("/tmp/Leaps.app/Contents/MacOS", "darwin")).toBe("/tmp/Leaps.app/Contents/Resources");
    expect(packagedResourcesDir("C:\\app\\win-unpacked", "win32")).toBe(join("C:\\app\\win-unpacked", "resources"));
    expect(packagedResourcesDir("/tmp/linux-unpacked", "linux")).toBe("/tmp/linux-unpacked/resources");
  });
});
