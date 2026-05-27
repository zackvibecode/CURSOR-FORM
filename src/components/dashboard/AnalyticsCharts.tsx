"use client";

const submissionTrend = [12, 18, 15, 24, 20, 32, 28, 35, 30, 42, 38, 45];
const clickTrend = [28, 35, 32, 40, 38, 52, 48, 55, 50, 62, 58, 68];

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
  color = "#25D366",
}: {
  title: string;
  data: number[];
  color?: string;
}) {
  const width = 400;
  const height = 120;
  const max = Math.max(...data) * 1.1;
  const path = buildPath(data, width, height, max);

  return (
    <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-card">
      <h3 className="mb-6 text-sm font-semibold text-brand-text">{title}</h3>
      <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full">
        <defs>
          <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`${path} L ${width} ${height} L 0 ${height} Z`}
          fill={`url(#grad-${title})`}
        />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div className="mt-4 flex justify-between text-xs text-brand-muted">
        <span>Jan</span>
        <span>Jun</span>
        <span>Dec</span>
      </div>
    </div>
  );
}

export function AnalyticsCharts() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TrendChart title="Submission Trend" data={submissionTrend} />
      <TrendChart title="WhatsApp Click Trend" data={clickTrend} color="#075E54" />
    </div>
  );
}
