"use client";

import { PetCategoryLegend, PocketPet } from "@/components/PocketPet";
import { DateStrip } from "@/components/DateStrip";
import { IosSpinner } from "@/components/ios";
import { HeaderButton, NavHeader } from "@/components/NavHeader";
import { api } from "@/lib/client";
import { todayISO } from "@/lib/dates";
import { collectTodayItems, derivePetState } from "@/lib/pet";
import type { TodayItem } from "@/lib/types";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type TodayResponse = {
  date: string;
  due: TodayItem[];
  done: TodayItem[];
  missed: TodayItem[];
  perfect: boolean;
};

export function PetView() {
  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState<TodayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await api<TodayResponse>(`/api/today?date=${date}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load pet");
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  const pet = useMemo(() => derivePetState(data ? collectTodayItems(data) : []), [data]);

  return (
    <div>
      <NavHeader
        title="Pocket Pet"
        menu={[
          { href: "/", label: "Daily Goals" },
          { href: "/pet", label: "Pocket Pet" },
          { href: "/reports", label: "Reports" },
        ]}
        left={
          <HeaderButton href="/settings" label="Settings">
            <Settings size={22} />
          </HeaderButton>
        }
      />
      <DateStrip date={date} onChange={setDate} />

      {error && <p className="px-4 py-3 text-sm text-bad">{error}</p>}
      {!data && !error && <IosSpinner label="Loading" />}

      {data && (
        <div className="pb-8 pt-4">
          <PocketPet state={pet} />
          <p className="mt-3 px-6 text-center text-[13px] text-muted">
            {pet.total
              ? `${pet.done} of ${pet.total} habits complete`
              : "Checkmarks on Daily Goals are the only way to care for it."}
          </p>
          <h2 className="ios-section">Visual categories</h2>
          <PetCategoryLegend state={pet} />
          {!pet.total && (
            <div className="mt-6 flex justify-center">
              <Link href="/create" className="rounded-full bg-ios px-4 py-2 text-[15px] font-semibold text-white press">
                Add a habit
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
