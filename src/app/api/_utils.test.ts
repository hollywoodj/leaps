import { describe, expect, it } from "vitest";
import { isLocalRequest } from "./_utils";

function request(headers: Record<string, string>) {
  return new Request("http://127.0.0.1:3000/api/data", { headers });
}

describe("isLocalRequest", () => {
  it("allows localhost and loopback hosts", () => {
    expect(isLocalRequest(request({ host: "127.0.0.1:3000" }))).toBe(true);
    expect(isLocalRequest(request({ host: "localhost:3000" }))).toBe(true);
  });

  it("rejects LAN and forwarded clients", () => {
    expect(isLocalRequest(request({ host: "192.168.1.10:3000" }))).toBe(false);
    expect(isLocalRequest(request({ host: "127.0.0.1:3000", "x-forwarded-for": "8.8.8.8" }))).toBe(false);
  });
});
