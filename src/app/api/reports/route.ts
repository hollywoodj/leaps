import { isValidISODate, todayISO } from "@/lib/dates";
import { getReports } from "@/lib/repo";
import { fail, handleError, ok } from "@/app/api/_utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || todayISO();
    const period = (searchParams.get("period") || "month") as "week" | "month" | "year" | "all";
    const tagId = searchParams.get("tagId");
    if (!isValidISODate(date)) return fail("Invalid date");
    if (!["week", "month", "year", "all"].includes(period)) return fail("Invalid period");
    return ok(getReports(date, period, tagId));
  } catch (error) {
    return handleError(error);
  }
}
