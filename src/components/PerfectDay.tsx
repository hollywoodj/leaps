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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1b57b5]/94 p-6">
      <button type="button" onClick={onClose} className="absolute right-4 top-4 text-white/80 press" aria-label="Close">
        <X size={22} />
      </button>
      <div className="w-full max-w-sm">
        <div className="relative mx-auto w-[84%]">
          <div className="absolute -left-5 -top-7 h-[158px] w-full rotate-[-8deg] rounded-[18px] bg-[#163a73] opacity-35" />
          <div className="absolute -left-2.5 -top-3.5 h-[168px] w-full rotate-[-3deg] rounded-[18px] bg-[#1f5fc4] opacity-50" />
          <div className="relative overflow-hidden rounded-[18px] bg-white shadow-card">
            <div className="h-[132px] bg-gradient-to-br from-[#5ec8ff] via-[#2f7dff] to-[#3b4fd6]" />
            <div className="relative px-6 pb-7 pt-9 text-center">
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
        <div className="mt-11 text-center text-white">
          <div className="text-[32px] font-bold tracking-tight">Congrats 🥳</div>
          <div className="mt-1 text-[18px] font-medium text-white/85">Celebrate Your Wins</div>
        </div>
      </div>
    </div>
  );
}
