import { reorderTrackers } from "@/lib/repo";
import { fail, handleError, ok } from "@/app/api/_utils";

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { ids?: string[] };
    if (!Array.isArray(body.ids)) return fail("ids array is required");
    reorderTrackers(body.ids);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
