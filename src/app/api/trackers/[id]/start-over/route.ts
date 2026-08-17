import { startOver } from "@/lib/repo";
import { handleError, ok } from "@/app/api/_utils";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return ok({ tracker: startOver(id) });
  } catch (error) {
    return handleError(error);
  }
}
