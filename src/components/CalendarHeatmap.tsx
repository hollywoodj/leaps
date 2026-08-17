import clsx from "clsx";
import { weekday } from "@/lib/dates";

export function CalendarHeatmap({
  days,
}: {
  days: { date: string; percent: number; due?: number; value?: number }[];
}) {
  if (!days.length) return null;
  const startPad = (weekday(days[0].date) + 6) % 7;
  const cells: ({ date: string; percent: number } | null)[] = [
    ...Array.from({ length: startPad }, () => null),
    ...days.map((d) => ({ date: d.date, percent: d.percent })),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => (
          <div
            key={cell?.date ?? `empty-${i}`}
            title={cell ? `${cell.date}: ${Math.round(cell.percent)}%` : undefined}
            className={clsx("aspect-square rounded-md", !cell && "bg-transparent")}
            style={cell ? { background: heat(cell.percent) } : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function heat(percent: number): string {
  if (percent <= 0) return "rgba(28,25,23,0.08)";
  if (percent < 40) return "#fecaca";
  if (percent < 70) return "#fde68a";
  if (percent < 100) return "#99f6e4";
  return "#0f766e";
}
