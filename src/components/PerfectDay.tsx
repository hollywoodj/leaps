"use client";

import { Check, X } from "lucide-react";

export function PerfectDay({
  open,
  count,
  onClose,
}: {
  open: boolean;
  count: number;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1b57b5]/92 p-6">
      <button type="button" onClick={onClose} className="absolute right-4 top-4 text-white/80" aria-label="Close">
        <X size={22} />
      </button>
      <div className="w-full max-w-sm">
        <div className="relative mx-auto w-[86%]">
          <div className="absolute -left-4 -top-6 h-40 w-full rounded-2xl bg-[#1a3d7a] opacity-40" />
          <div className="absolute -left-2 -top-3 h-44 w-full rounded-2xl bg-[#2456a8] opacity-55" />
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-card">
            <div className="h-36 bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600" />
            <div className="relative px-6 pb-7 pt-8 text-center">
              <div className="absolute left-1/2 top-[-22px] flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-good text-white shadow-card">
                <Check size={22} strokeWidth={3} />
              </div>
              <div className="text-[22px] font-semibold text-good">Perfect Day!</div>
              <p className="mt-2 text-[15px] leading-5 text-[#6b6b70]">
                You completed all {count} of your goals & habits today. Great job!
              </p>
            </div>
          </div>
        </div>
        <div className="mt-10 text-center text-white">
          <div className="text-3xl font-bold">Congrats 🥳</div>
          <div className="mt-1 text-lg font-medium text-white/85">Celebrate Your Wins</div>
        </div>
      </div>
    </div>
  );
}
