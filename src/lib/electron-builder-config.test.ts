import { readFileSync } from "node:fs";
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
});
