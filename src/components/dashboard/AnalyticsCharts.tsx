"use client";

function buildPath(data: number[], width: number, height: number, max: number) {
  const step = width / (data.length - 1);
  return data
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / max) * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function TrendChart({
  title,
  data,
}: {
  title: string;
  data: number[];
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="mb-1 text-sm font-semibold text-fg">{title}</h3>
        <p className="mb-5 text-xs text-muted-fg">Submissions over the last 30 days</p>
        <div className="flex h-32 items-center justify-center text-sm text-muted-fg">
          Not enough data to display trends.
        </div>
      </div>
    );
  }

  const width = 400;
  const height = 120;
  const max = Math.max(...data, 1) * 1.1;
  const path = buildPath(data, width, height, max);
  const total = data.reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        <span className="font-mono text-xs text-muted-fg">
          {total} total
        </span>
      </div>
      <p className="mb-5 text-xs text-muted-fg">Submissions over the last 30 days</p>
      <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full">
        <defs>
          <linearGradient id="trend-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10D050" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10D050" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1="0"
            x2={width}
            y1={height * p}
            y2={height * p}
            stroke="currentColor"
            strokeWidth="1"
            className="text-border"
          />
        ))}
        <path
          d={`${path} L ${width} ${height} L 0 ${height} Z`}
          fill="url(#trend-grad)"
        />
        <path
          d={path}
          fill="none"
          stroke="#10D050"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function AnalyticsCharts({
  submissionsPerDay,
}: {
  submissionsPerDay: number[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <TrendChart title="Submission Trend" data={submissionsPerDay} />
    </div>
  );
}
