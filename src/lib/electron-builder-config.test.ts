import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  build: Record<string, unknown>;
  desktopName?: string;
};

describe("electron-builder config", () => {
  it("matches the electron-builder schema used by auto-release", () => {
    const schema = require("app-builder-lib/scheme.json") as object;
    const { validateSchema } = require("app-builder-lib/out/util/config/schemaValidator") as {
      validateSchema: (schema: object, data: unknown, config?: { name?: string }) => void;
    };
    expect(() => validateSchema(schema, pkg.build, { name: "electron-builder" })).not.toThrow();
  });

  it("keeps linux.desktopName off the build config", () => {
    const linux = pkg.build.linux as Record<string, unknown> | undefined;
    expect(linux).toBeDefined();
    expect(linux).not.toHaveProperty("desktopName");
    expect(pkg.desktopName).toBe("Leaps");
  });

  it("copies Electron-built sqlite into standalone after pack", () => {
    expect(pkg.build.afterPack).toBe("./scripts/after-pack.cjs");
    const unpacked = pkg.build.asarUnpack as string[];
    expect(unpacked).toEqual(expect.arrayContaining(["**/better-sqlite3/**", "**/bindings/**", "**/file-uri-to-path/**"]));
    const fuses = pkg.build.electronFuses as { runAsNode?: boolean };
    expect(fuses.runAsNode).toBe(true);
  });

  it("copies standalone node_modules from a nested extraResources from-dir", () => {
    expect(pkg.build.extraResources).toEqual([
      { from: ".next/standalone", to: "standalone" },
      { from: ".next/standalone/node_modules", to: "standalone/node_modules" },
    ]);
  });

  it("documents that electron-builder skips a source-root node_modules folder", () => {
    const { FileMatcher } = require("app-builder-lib/out/fileMatcher") as {
      FileMatcher: new (from: string, to: string, macroExpander: (s: string) => string, patterns?: string[]) => {
        createFilter: () => (file: string, stat: { isDirectory: () => boolean }) => boolean;
      };
    };
    const from = join(tmpdir(), "leaps-standalone-filter");
    const filter = new FileMatcher(from, join(tmpdir(), "out"), (s) => s, ["**/*"]).createFilter();
    expect(filter(join(from, "node_modules"), { isDirectory: () => true })).toBe(false);
    expect(filter(join(from, "server.js"), { isDirectory: () => false })).toBe(true);

    const modulesFrom = join(from, "node_modules");
    const nested = new FileMatcher(modulesFrom, join(tmpdir(), "out", "node_modules"), (s) => s, ["**/*"]).createFilter();
    expect(nested(join(modulesFrom, "next"), { isDirectory: () => true })).toBe(true);
  });
});

describe("electron main process", () => {
  it("does not inherit stdio from a GUI parent", () => {
    const main = readFileSync(new URL("../../electron/main.cjs", import.meta.url), "utf8");
    expect(main).not.toMatch(/stdio:\s*["']inherit["']/);
    expect(main).not.toContain("utilityProcess");
    expect(main).toContain("spawnStdio()");
    expect(main).toContain("startup.log");
    expect(main).toContain("server-bootstrap.cjs");
    expect(main).toContain("startupLog");
  });
});
