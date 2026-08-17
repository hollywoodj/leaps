import clsx from "clsx";

export function ProgressBar({
  percent,
  pacePercent,
  color,
  onTrack,
}: {
  percent: number;
  pacePercent?: number | null;
  color: string;
  onTrack: boolean;
}) {
  const width = Math.max(0, Math.min(100, percent));
  const pace = pacePercent == null ? null : Math.max(0, Math.min(100, pacePercent));
  return (
    <div className="pace-track">
      <div
        className="pace-fill"
        style={{
          width: `${width}%`,
          background: onTrack ? color : "#dc2626",
        }}
      />
      {pace != null && (
        <span className="pace-marker" style={{ left: `${pace}%` }} title="Pace" />
      )}
    </div>
  );
}

export function StatChip({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl bg-stone-100 px-3 py-2">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className={clsx("mt-0.5 text-sm font-semibold", warn ? "text-bad" : "text-ink")}>{value}</div>
    </div>
  );
}
