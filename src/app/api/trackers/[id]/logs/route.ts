import { applyLog } from "@/lib/repo";
import type { LogStatus } from "@/lib/types";
import { fail, handleError, ok } from "@/app/api/_utils";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      date?: string;
      status?: LogStatus;
      value?: number;
      note?: string | null;
    };
    if (!body.date || !body.status) return fail("date and status are required");
    const log = applyLog(id, {
      date: body.date,
      status: body.status,
      value: body.value,
      note: body.note,
    });
    return ok({ log }, 201);
  } catch (error) {
    return handleError(error);
  }
}
