import { isValidISODate, todayISO } from "@/lib/dates";
import { getToday } from "@/lib/repo";
import { fail, handleError, ok } from "@/app/api/_utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || todayISO();
    if (!isValidISODate(date)) return fail("Invalid date");
    return ok(getToday(date));
  } catch (error) {
    return handleError(error);
  }
}
