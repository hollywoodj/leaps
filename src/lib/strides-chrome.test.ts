import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const shell = readFileSync(new URL("../components/AppShell.tsx", import.meta.url), "utf8");
const today = readFileSync(new URL("../components/TodayView.tsx", import.meta.url), "utf8");
const nav = readFileSync(new URL("../components/NavHeader.tsx", import.meta.url), "utf8");
const dates = readFileSync(new URL("../components/DateStrip.tsx", import.meta.url), "utf8");
const card = readFileSync(new URL("../components/TrackerCard.tsx", import.meta.url), "utf8");
const swipe = readFileSync(new URL("../components/SwipeRow.tsx", import.meta.url), "utf8");
const reports = readFileSync(new URL("../components/ReportsView.tsx", import.meta.url), "utf8");
const create = readFileSync(new URL("../components/CreateWizard.tsx", import.meta.url), "utf8");
const settings = readFileSync(new URL("../components/SettingsView.tsx", import.meta.url), "utf8");
const detail = readFileSync(new URL("../components/TrackerDetail.tsx", import.meta.url), "utf8");
const log = readFileSync(new URL("../components/LogValueModal.tsx", import.meta.url), "utf8");
const perfect = readFileSync(new URL("../components/PerfectDay.tsx", import.meta.url), "utf8");
const cal = readFileSync(new URL("../components/CalendarHeatmap.tsx", import.meta.url), "utf8");
const ios = readFileSync(new URL("../components/ios.tsx", import.meta.url), "utf8");
const main = readFileSync(new URL("../../electron/main.cjs", import.meta.url), "utf8");

describe("Strides chrome copy", () => {
  it("names the list Daily Goals in the header, tab, menus, and back buttons", () => {
    expect(today).toContain('title="Daily Goals"');
    expect(today).toContain('{ href: "/", label: "Daily Goals" }');
    expect(shell).toContain("Daily Goals");
    expect(reports).toContain('{ href: "/", label: "Daily Goals" }');
    expect(settings).toContain('label="Daily Goals"');
    expect(detail).toContain('label="Daily Goals"');
    expect(create).toContain('label="Daily Goals"');
    expect(main).toContain('label: "Daily Goals"');
    expect(today).not.toContain('title="Today"');
  });

  it("hides the tab bar on pushed screens and uses an iOS hairline tab bar", () => {
    expect(shell).toContain('pathname.startsWith("/trackers/")');
    expect(shell).toContain("h-[49px]");
    expect(shell).toContain("h-[58px]");
    expect(css).toContain(".tab-bar");
    expect(css).toContain("box-shadow: inset 0 0.5px 0 var(--separator)");
    expect(shell).not.toContain("border-t border-black/10");
  });

  it("uses iOS switches, spinner, filter popover, and 44pt nav", () => {
    expect(ios).toContain("ios-switch");
    expect(ios).toContain("ios-spinner");
    expect(ios).toContain("FilterPopover");
    expect(css).toContain(".ios-switch");
    expect(css).toContain(".ios-spinner");
    expect(nav).toContain("h-11");
    expect(nav).toContain("BackButton");
    expect(create).toContain("IosSwitch");
    expect(detail).toContain("IosSwitch");
  });

  it("matches Daily Goals row chrome: 36pt checks, pie fill, skip ring, no streak subtitle", () => {
    expect(card).toContain("h-9 w-9");
    expect(card).toContain("strokeDasharray");
    expect(card).toContain("Undo skip");
    expect(card).not.toContain("day streak");
    expect(card).toContain('yesSide={tracker.isBad ? "left" : "right"}');
    expect(swipe).toContain('yesLabel = "Yes"');
    expect(swipe).toContain("w-28");
    expect(css).toContain("height: 4px");
  });

  it("inlines the calendar with the date strip and dots today only", () => {
    expect(dates).toContain("w-[52px]");
    expect(dates).toContain("isToday ? \"bg-ios\"");
    expect(dates).not.toContain("selected || isToday");
  });

  it("uses a log sheet grabber, iOS FAB, medal rankings, and S M T W T F S calendar", () => {
    expect(log).toContain("IosGrabber");
    expect(log).toContain("text-[34px]");
    expect(detail).toContain("bg-ios");
    expect(detail).toContain('bottom: "calc(1.5rem + env(safe-area-inset-bottom))"');
    expect(reports).toContain("text-[#f5c518]");
    expect(cal).toContain('const DOW = ["S", "M", "T", "W", "T", "F", "S"]');
    expect(perfect).toContain("Perfect Day!");
    expect(perfect).toContain("Celebrate Your Wins");
    expect(settings).toContain("Keep making strides.");
  });
});
