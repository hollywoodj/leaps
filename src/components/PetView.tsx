"use client";

import { PetCategoryLegend, PocketPet } from "@/components/PocketPet";
import { DateStrip } from "@/components/DateStrip";
import { IosSpinner } from "@/components/ios";
import { NavHeader } from "@/components/NavHeader";
import { api } from "@/lib/client";
import { isValidISODate, todayISO } from "@/lib/dates";
import { collectTodayItems, derivePetState } from "@/lib/pet";
import type { TodayPayload } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

function resolveDate(value?: string): string {
  return value && isValidISODate(value) ? value : todayISO();
}

export function PetView({ initialDate }: { initialDate?: string }) {
  const router = useRouter();
  const [date, setDate] = useState(() => resolveDate(initialDate));
  const [data, setData] = useState<TodayPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await api<TodayPayload>(`/api/today?date=${date}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load pet");
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => void load(), 2500);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const current = new URLSearchParams(window.location.search).get("date");
    if (current === date) return;
    router.replace(`/pet?date=${date}`, { scroll: false });
  }, [date, router]);

  const pet = useMemo(() => derivePetState(data ? collectTodayItems(data) : []), [data]);

  return (
    <div>
      <NavHeader title="Pocket Pet" />
      <DateStrip date={date} onChange={setDate} />

      {error && <p className="px-4 py-3 text-sm text-bad">{error}</p>}
      {!data && !error && <IosSpinner label="Loading" />}

      {data && (
        <div className="pb-8 pt-4">
          <PocketPet state={pet} />
          <p className="mt-3 px-6 text-center text-[13px] text-muted">
            {pet.total
              ? `${pet.done} of ${pet.total} habits complete`
              : "Checkmarks in the Leaps app are the only way to care for it."}
          </p>
          <h2 className="ios-section">Visual categories</h2>
          <PetCategoryLegend state={pet} />
          {!pet.total && (
            <p className="mt-6 px-6 text-center text-[13px] leading-5 text-muted">
              Open Leaps to add habits. Completing them here is what keeps this pet alive.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
