import { createTag, deleteTag, listTags } from "@/lib/repo";
import { fail, handleError, ok } from "@/app/api/_utils";

export async function GET() {
  try {
    return ok({ tags: listTags() });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; color?: string };
    if (!body.name) return fail("name is required");
    return ok({ tag: createTag(body.name, body.color) }, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return fail("id is required");
    deleteTag(id);
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
