import { AppShell } from "@/components/AppShell";
import { PetView } from "@/components/PetView";

export default async function PetPage({ searchParams }: { searchParams: Promise<{ date?: string | string[] }> }) {
  const params = await searchParams;
  const raw = params.date;
  const initialDate = Array.isArray(raw) ? raw[0] : raw;
  return (
    <AppShell>
      <PetView initialDate={initialDate} />
    </AppShell>
  );
}
