import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";
import { closeDb } from "@/lib/db";

describe("GET /api/health", () => {
  afterEach(() => {
    closeDb();
    delete process.env.LEAPS_DB_PATH;
  });

  it("opens sqlite before reporting ok", async () => {
    process.env.LEAPS_DB_PATH = ":memory:";
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
