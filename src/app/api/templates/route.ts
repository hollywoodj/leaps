import { templatesByCategory } from "@/lib/templates";
import { ok } from "@/app/api/_utils";

export async function GET() {
  return ok({ categories: templatesByCategory() });
}
