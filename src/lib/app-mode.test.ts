import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const mode = require("../../electron/app-mode.cjs") as {
  isPetApp: (input?: { env?: Record<string, string>; argv?: string[]; pkgName?: string }) => boolean;
  resolveLeapsDbPath: (input: {
    appData: string;
    projectRoot: string;
    env?: Record<string, string | undefined>;
    exists?: (path: string) => boolean;
  }) => string;
};

describe("desktop app mode", () => {
  it("treats --pet, LEAPS_APP, and the pocket-pet package name as the pet app", () => {
    expect(mode.isPetApp({ env: {}, argv: ["electron"], pkgName: "leaps" })).toBe(false);
    expect(mode.isPetApp({ env: { LEAPS_APP: "pet" }, argv: ["electron"], pkgName: "leaps" })).toBe(true);
    expect(mode.isPetApp({ env: {}, argv: ["electron", "--pet"], pkgName: "leaps" })).toBe(true);
    expect(mode.isPetApp({ env: {}, argv: ["electron"], pkgName: "pocket-pet" })).toBe(true);
  });

  it("prefers Leaps app-data sqlite so Pocket Pet shares habit logs", () => {
    const root = mkdtempSync(join(tmpdir(), "leaps-db-"));
    const leapsDb = join(root, "Leaps", "data", "leaps.db");
    expect(
      mode.resolveLeapsDbPath({
        appData: root,
        projectRoot: join(root, "project"),
        env: {},
        exists: (file) => file === leapsDb,
      }),
    ).toBe(leapsDb);
  });

  it("honors LEAPS_DB_PATH before looking in app data", () => {
    const custom = join(tmpdir(), "custom-leaps.db");
    expect(
      mode.resolveLeapsDbPath({
        appData: join(tmpdir(), "app"),
        projectRoot: join(tmpdir(), "project"),
        env: { LEAPS_DB_PATH: custom },
        exists: () => false,
      }),
    ).toBe(custom);
  });

  it("falls back to the lowercase leaps folder when nothing exists yet", () => {
    const appData = mkdtempSync(join(tmpdir(), "leaps-appdata-"));
    expect(
      mode.resolveLeapsDbPath({
        appData,
        projectRoot: join(appData, "missing-project"),
        env: {},
        exists: () => false,
      }),
    ).toBe(join(appData, "leaps", "data", "leaps.db"));
  });
});

describe("package scripts", () => {
  it("can launch and package Leaps and Pocket Pet separately", () => {
    const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["electron:pet:dev"]).toContain("LEAPS_APP=pet");
    expect(pkg.scripts["electron:both:dev"]).toContain("electron . --pet");
    expect(pkg.scripts["electron:pet:build"]).toContain("electron-builder.pet.json");
  });
});
