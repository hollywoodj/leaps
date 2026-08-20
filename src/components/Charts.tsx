import { formatShort } from "@/lib/dates";

export function LineChart({
  series,
  color,
}: {
  series: { date: string; actual: number; pace: number | null }[];
  color: string;
}) {
  if (series.length < 2) return <p className="text-sm text-muted">Log a few days to see the chart.</p>;
  const width = 320;
  const height = 140;
  const pad = 12;
  const max = Math.max(1, ...series.map((p) => p.actual), ...series.map((p) => p.pace ?? 0));
  const toX = (i: number) => pad + (i / (series.length - 1)) * (width - pad * 2);
  const toY = (v: number) => height - pad - (v / max) * (height - pad * 2);
  const actual = series.map((p, i) => `${toX(i)},${toY(p.actual)}`).join(" ");
  const pacePts = series.every((p) => p.pace == null)
    ? null
    : series.map((p, i) => `${toX(i)},${toY(p.pace ?? 0)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full">
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="rgba(22,58,115,0.12)" />
      {pacePts && (
        <polyline fill="none" stroke="rgba(22,58,115,0.35)" strokeDasharray="4 4" strokeWidth="1.5" points={pacePts} />
      )}
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={actual} />
    </svg>
  );
}

export function BarChart({
  bars,
  color = "#ffffff",
  onNavy = false,
}: {
  bars: { date: string; percent: number }[];
  color?: string;
  onNavy?: boolean;
}) {
  if (!bars.length) return null;
  const height = onNavy ? 88 : 120;
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {bars.map((bar) => (
        <div key={bar.date} className="flex flex-1 flex-col items-center justify-end" title={`${bar.date}: ${Math.round(bar.percent)}%`}>
          <div
            className="w-full rounded-sm"
            style={{
              height: `${Math.max(3, (Math.min(100, bar.percent) / 100) * height)}px`,
              background: onNavy ? "rgba(255,255,255,0.92)" : bar.percent >= 100 ? "#34c759" : bar.percent >= 50 ? color : "#ff3b30",
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function DailyBars({
  days,
  goal,
}: {
  days: { date: string; value: number; ok: boolean }[];
  goal?: number;
}) {
  if (!days.length) return null;
  const max = Math.max(goal || 1, ...days.map((d) => d.value), 1);
  return (
    <div className="flex h-36 items-end gap-0.5">
      {days.map((day) => {
        const h = Math.max(8, (day.value / max) * 100);
        return (
          <div key={day.date} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${formatShort(day.date)}: ${day.value}`}>
            <div
              className="flex w-full items-start justify-center rounded-t-sm pt-0.5 text-[9px] font-semibold text-white"
              style={{
                height: `${h}%`,
                background: day.ok ? "#34c759" : day.value > 0 ? "#ff3b30" : "#d1d1d6",
              }}
            >
              {day.value ? (Number.isInteger(day.value) ? day.value : day.value.toFixed(1)) : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RingStat({
  label,
  value,
  detail,
  percent,
  positive = true,
}: {
  label: string;
  value: string;
  detail: string;
  percent: number;
  positive?: boolean;
}) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const color = positive ? "#34c759" : "#ff3b30";
  return (
    <div className="relative flex h-[104px] w-[104px] items-center justify-center">
      <svg viewBox="0 0 88 88" className="absolute inset-0">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e8e8ed" strokeWidth="6" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * c} ${c}`}
          transform="rotate(-90 44 44)"
        />
      </svg>
      <div className="text-center">
        <div className="text-[10px] font-medium text-ios">{label}</div>
        <div className="text-[22px] font-bold leading-none" style={{ color }}>
          {value}
        </div>
        <div className="mt-0.5 text-[10px] text-muted">{detail}</div>
      </div>
    </div>
  );
}

export function CompareBars({
  current,
  previous,
  currentLabel,
  previousLabel,
  currentRange,
  previousRange,
}: {
  current: number;
  previous: number;
  currentLabel: string;
  previousLabel: string;
  currentRange: string;
  previousRange: string;
}) {
  const max = Math.max(current, previous, 1);
  const delta = previous === 0 ? 0 : ((current - previous) / previous) * 100;
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 text-[13px] text-muted">
          {currentLabel}
          {delta !== 0 && (
            <span className={delta > 0 ? "text-good" : "text-bad"}>
              {" "}
              {delta > 0 ? "+" : ""}
              {Math.round(delta)}%
            </span>
          )}
        </div>
        <div className="h-7 overflow-hidden rounded-sm bg-fill">
          <div className="flex h-full items-center bg-good px-2 text-[12px] font-semibold text-white" style={{ width: `${Math.max(18, (current / max) * 100)}%` }}>
            {currentRange}
          </div>
        </div>
      </div>
      <div>
        <div className="mb-1 text-[13px] text-muted">{previousLabel}</div>
        <div className="h-7 overflow-hidden rounded-sm bg-fill">
          <div className="flex h-full items-center bg-navy px-2 text-[12px] font-semibold text-white" style={{ width: `${Math.max(18, (previous / max) * 100)}%` }}>
            {previousRange}
          </div>
        </div>
      </div>
    </div>
  );
}
