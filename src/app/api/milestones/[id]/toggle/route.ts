import { toggleMilestone } from "@/lib/repo";
import { fail, handleError, ok } from "@/app/api/_utils";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as { date?: string };
    if (!body.date) return fail("date is required");
    return ok({ milestone: toggleMilestone(id, body.date) });
  } catch (error) {
    return handleError(error);
  }
}
