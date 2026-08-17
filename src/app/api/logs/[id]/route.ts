import { deleteLog, updateLog } from "@/lib/repo";
import type { LogStatus } from "@/lib/types";
import { handleError, ok } from "@/app/api/_utils";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      value?: number;
      note?: string | null;
      status?: LogStatus;
      date?: string;
    };
    return ok({ log: updateLog(id, body) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    deleteLog(id);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
