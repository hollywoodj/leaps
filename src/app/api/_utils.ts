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
