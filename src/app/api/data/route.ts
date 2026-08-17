import { exportData, seedSampleData } from "@/lib/repo";
import { handleError, ok } from "@/app/api/_utils";

export async function GET() {
  try {
    return ok(exportData());
  } catch (error) {
    return handleError(error);
  }
}

export async function POST() {
  try {
    seedSampleData();
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
