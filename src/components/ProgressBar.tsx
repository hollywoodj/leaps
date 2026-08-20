import clsx from "clsx";

export function ProgressBar({
  percent,
  pacePercent,
  onTrack,
  color,
}: {
  percent: number;
  pacePercent?: number | null;
  onTrack: boolean;
  color?: string;
}) {
  const width = Math.max(0, Math.min(100, percent));
  const pace = pacePercent == null ? null : Math.max(0, Math.min(100, pacePercent));
  const fill = width === 0 ? "transparent" : onTrack ? (color || "#34c759") : "#ff3b30";
  return (
    <div className="pace-track">
      <div className="pace-fill" style={{ width: `${width}%`, background: fill }} />
      {pace != null && <span className="pace-marker" style={{ left: `${pace}%` }} title="Pace" />}
    </div>
  );
}

export function StatChip({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-[11px] font-medium text-ios">{label}</div>
      <div className={clsx("text-[28px] font-bold leading-none", warn ? "text-bad" : "text-label")}>{value}</div>
    </div>
  );
}
