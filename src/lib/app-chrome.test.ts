import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const shell = readFileSync(new URL("../components/AppShell.tsx", import.meta.url), "utf8");
const main = readFileSync(new URL("../../electron/main.cjs", import.meta.url), "utf8");

describe("single window edge", () => {
  it("does not wrap the app in a nested phone frame", () => {
    expect(css).not.toMatch(/border-radius:\s*28px/);
    expect(css).not.toMatch(/min-height:\s*calc\(100vh - 68px\)/);
    expect(css).not.toMatch(/box-shadow:\s*0 30px 80px/);
    expect(css).toContain("min-height: 100dvh");
    expect(css).toContain(".ios-body");
  });

  it("pins the tab bar in the shell instead of overlaying a growing card", () => {
    expect(shell).toContain('className={clsx("ios-body"');
    expect(shell).not.toContain("max-w-lg");
    expect(shell).not.toContain("absolute inset-x-0 bottom-0");
  });

  it("matches the Electron window fill to the app background", () => {
    expect(main).toContain('backgroundColor: "#f2f2f7"');
    expect(main).not.toContain('backgroundColor: "#0b3d8c"');
  });
});
