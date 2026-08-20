import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    getDb().prepare("SELECT 1").get();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database unavailable";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
