import { exportData, importData, seedSampleData } from "@/lib/repo";
import { handleError, ok, requireLocal } from "@/app/api/_utils";

export async function GET(request: Request) {
  const denied = requireLocal(request);
  if (denied) return denied;
  try {
    return ok(exportData());
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const denied = requireLocal(request);
  if (denied) return denied;
  try {
    seedSampleData();
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request) {
  const denied = requireLocal(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { data?: unknown; replace?: boolean };
    if (body.data === undefined) {
      return handleError(new Error("Import payload is required"));
    }
    const result = importData(body.data, { replace: Boolean(body.replace) });
    return ok({ ok: true, ...result });
  } catch (error) {
    return handleError(error);
  }
}
