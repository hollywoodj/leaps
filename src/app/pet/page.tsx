import { AppShell } from "@/components/AppShell";
import { PetOnly } from "@/components/PetOnly";
import { PetView } from "@/components/PetView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pocket Pet",
  description: "A Tamagotchi-style pet driven by Leaps habit checkmarks.",
};

export default async function PetPage({ searchParams }: { searchParams: Promise<{ date?: string | string[] }> }) {
  const params = await searchParams;
  const raw = params.date;
  const initialDate = Array.isArray(raw) ? raw[0] : raw;
  return (
    <AppShell>
      <PetOnly>
        <PetView initialDate={initialDate} />
      </PetOnly>
    </AppShell>
  );
}
