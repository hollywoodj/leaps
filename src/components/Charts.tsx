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
  const max = Math.max(
    1,
    ...series.map((p) => p.actual),
    ...series.map((p) => p.pace ?? 0),
  );
  const toX = (i: number) => pad + (i / (series.length - 1)) * (width - pad * 2);
  const toY = (v: number) => height - pad - (v / max) * (height - pad * 2);
  const actual = series.map((p, i) => `${toX(i)},${toY(p.actual)}`).join(" ");
  const pacePts = series.every((p) => p.pace == null)
    ? null
    : series.map((p, i) => `${toX(i)},${toY(p.pace ?? 0)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full">
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="rgba(28,25,23,0.12)" />
      {pacePts && (
        <polyline fill="none" stroke="rgba(28,25,23,0.35)" strokeDasharray="4 4" strokeWidth="1.5" points={pacePts} />
      )}
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={actual} />
    </svg>
  );
}

export function BarChart({
  bars,
  color = "#0f766e",
}: {
  bars: { date: string; percent: number }[];
  color?: string;
}) {
  if (!bars.length) return null;
  const height = 120;
  return (
    <div className="flex h-32 items-end gap-1">
      {bars.map((bar) => (
        <div key={bar.date} className="flex flex-1 flex-col items-center justify-end" title={`${bar.date}: ${Math.round(bar.percent)}%`}>
          <div
            className="w-full rounded-t-md"
            style={{
              height: `${Math.max(4, (Math.min(100, bar.percent) / 100) * height)}px`,
              background: bar.percent >= 100 ? color : bar.percent >= 50 ? `${color}99` : "#fecaca",
            }}
          />
        </div>
      ))}
    </div>
  );
}
