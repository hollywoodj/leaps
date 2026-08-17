import { deleteTracker, getTrackerDetail, updateTracker } from "@/lib/repo";
import type { TrackerInput } from "@/lib/types";
import { handleError, ok } from "@/app/api/_utils";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok(getTrackerDetail(id));
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as Partial<TrackerInput> & { archived?: boolean };
    return ok({ tracker: updateTracker(id, body) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    deleteTracker(id);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

