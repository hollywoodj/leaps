import { NextResponse } from "next/server";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status = message.toLowerCase().includes("not found") ? 404 : 400;
  return fail(message, status);
}

const LOOPBACK = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

function hostnameOf(header: string | null): string {
  if (!header) return "";
  const host = header.split(",")[0].trim().toLowerCase();
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    return end >= 0 ? host.slice(0, end + 1) : host;
  }
  return host.split(":")[0];
}

export function isLocalRequest(request: Request): boolean {
  const hostname = hostnameOf(request.headers.get("x-forwarded-host") || request.headers.get("host"));
  if (!LOOPBACK.has(hostname)) return false;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim().toLowerCase();
    if (ip && !LOOPBACK.has(ip) && ip !== "::ffff:127.0.0.1") return false;
  }
  return true;
}

export function requireLocal(request: Request) {
  if (!isLocalRequest(request)) return fail("This action is only allowed from this computer", 403);
  return null;
}
