import { createTracker, listTrackers } from "@/lib/repo";
import type { TrackerInput } from "@/lib/types";
import { handleError, ok } from "@/app/api/_utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const archived = searchParams.get("archived") === "1";
    return ok({ trackers: listTrackers(archived) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TrackerInput;
    const tracker = createTracker(body);
    return ok({ tracker }, 201);
  } catch (error) {
    return handleError(error);
  }
}
