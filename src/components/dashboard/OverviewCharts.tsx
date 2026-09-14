"use client";

import { useState } from "react";
import { formatDayFull, type SeriesPoint } from "@/lib/overview-stats";

const W = 720;
const H = 240;
const PAD = { top: 16, right: 10, bottom: 28, left: 38 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function niceMax(value: number): number {
  const v = Math.max(value, 1);
  return Math.max(1, Math.ceil(v * 1.1));
}

function xTicks(count: number): number[] {
  if (count <= 1) return [0];
  const step = Math.max(1, Math.ceil(count / 6));
  const ticks: number[] = [];
  for (let i = 0; i < count; i += step) ticks.push(i);
  if (ticks[ticks.length - 1] !== count - 1) ticks.push(count - 1);
  return ticks;
}

interface TooltipState {
  index: number;
  point: SeriesPoint;
}

function ChartFrame({
  title,
  subtitle,
  total,
  unit,
  yMax,
  count,
  tooltip,
  hoverLabel,
  onHover,
  children,
}: {
  title: string;
  subtitle: string;
  total: number;
  unit: string;
  yMax: number;
  count: number;
  tooltip: TooltipState | null;
  hoverLabel: string;
  onHover: (index: number) => void;
  children: React.ReactNode;
}) {
  const leftPercent =
    tooltip && count > 0
      ? ((PAD.left + ((tooltip.index + 0.5) / count) * PLOT_W) / W) * 100
      : 0;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        <span className="font-mono text-[11px] text-muted-fg">
          {total.toLocaleString("en-US")} total
        </span>
      </div>
      <p className="mb-4 text-xs text-muted-fg">{subtitle}</p>

      <div className="overflow-x-auto scrollbar-thin">
        <div className="relative min-w-[560px]">
        {tooltip && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-fg px-2.5 py-1.5 text-[11px] text-bg shadow-md"
            style={{ left: `${leftPercent}%` }}
          >
            <p className="font-medium">{formatDayFull(tooltip.point.date)}</p>
            <p className="text-[10px] opacity-80">
              {tooltip.point.value.toLocaleString("en-US")} {unit}
            </p>
          </div>
        )}

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={title}
          onMouseLeave={() => onHover(-1)}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = PAD.top + PLOT_H * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border"
                />
                <text
                  x={PAD.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-current text-[13px] text-muted-fg"
                >
                  {Math.round(yMax * (1 - ratio))}
                </text>
              </g>
            );
          })}
          {children}
        </svg>
        </div>
      </div>

      <p className="mt-1 text-[11px] text-muted-fg">{hoverLabel}</p>
    </div>
  );
}

function SubmissionsBarChart({ data }: { data: SeriesPoint[] }) {
  const [hover, setHover] = useState(-1);
  const total = data.reduce((sum, p) => sum + p.value, 0);

  const yMax = niceMax(Math.max(...data.map((d) => d.value)));
  const slot = PLOT_W / data.length;
  const barW = Math.max(2, Math.min(slot * 0.6, 22));
  const tickSet = new Set(xTicks(data.length));
  const tooltip = hover >= 0 ? { index: hover, point: data[hover] } : null;

  return (
    <ChartFrame
      title="Submissions"
      subtitle="Form submissions over time"
      total={total}
      unit={total === 1 ? "submission" : "submissions"}
      yMax={yMax}
      count={data.length}
      tooltip={tooltip}
      hoverLabel={
        hover >= 0
          ? `${data[hover].label}: ${data[hover].value} submissions`
          : "Hover a bar to see the daily count"
      }
      onHover={setHover}
    >
      {data.map((point, i) => {
        const h = (point.value / yMax) * PLOT_H;
        const x = PAD.left + i * slot + (slot - barW) / 2;
        const y = PAD.top + PLOT_H - h;
        const active = hover === i;
        return (
          <g key={point.date}>
            <rect
              x={x}
              y={Math.min(y, PAD.top + PLOT_H - 2)}
              width={barW}
              height={Math.max(h, 2)}
              rx={Math.min(barW / 2, 4)}
              fill="#10D050"
              opacity={active ? 1 : 0.75}
            />
            <rect
              x={PAD.left + i * slot}
              y={PAD.top}
              width={slot}
              height={PLOT_H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
            {tickSet.has(i) && (
              <text
                x={PAD.left + i * slot + slot / 2}
                y={H - 8}
                textAnchor="middle"
                className="fill-current text-[13px] text-muted-fg"
              >
                {point.label}
              </text>
            )}
          </g>
        );
      })}
    </ChartFrame>
  );
}

function LinkClicksAreaChart({ data }: { data: SeriesPoint[] }) {
  const [hover, setHover] = useState(-1);
  const total = data.reduce((sum, p) => sum + p.value, 0);

  const yMax = niceMax(Math.max(...data.map((d) => d.value)));
  const step = PLOT_W / (data.length - 1);
  const px = (i: number) => PAD.left + i * step;
  const py = (i: number) => PAD.top + PLOT_H - (data[i].value / yMax) * PLOT_H;
  const line = data.map((_, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(i)}`).join(" ");
  const area = `${line} L ${PAD.left + PLOT_W} ${PAD.top + PLOT_H} L ${PAD.left} ${PAD.top + PLOT_H} Z`;
  const tickSet = new Set(xTicks(data.length));
  const tooltip = hover >= 0 ? { index: hover, point: data[hover] } : null;

  return (
    <ChartFrame
      title="Link Clicks"
      subtitle="Clicks from direct links"
      total={total}
      unit={total === 1 ? "click" : "clicks"}
      yMax={yMax}
      count={data.length}
      tooltip={tooltip}
      hoverLabel={
        hover >= 0
          ? `${data[hover].label}: ${data[hover].value} clicks`
          : "Hover the line to see daily clicks"
      }
      onHover={setHover}
    >
      <defs>
        <linearGradient id="overview-clicks-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10D050" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#10D050" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#overview-clicks-grad)" />
      <path
        d={line}
        fill="none"
        stroke="#10D050"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((p, i) =>
        tickSet.has(i) ? (
          <text
            key={`x-${p.date}`}
            x={px(i)}
            y={H - 8}
            textAnchor="middle"
            className="fill-current text-[13px] text-muted-fg"
          >
            {p.label}
          </text>
        ) : null
      )}
      {hover >= 0 && (
        <>
          <line
            x1={px(hover)}
            x2={px(hover)}
            y1={PAD.top}
            y2={PAD.top + PLOT_H}
            stroke="#10D050"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <circle cx={px(hover)} cy={py(hover)} r="4" fill="#10D050" stroke="#fff" strokeWidth="1.5" />
        </>
      )}
      {data.map((p, i) => (
        <rect
          key={`hit-${p.date}`}
          x={px(i) - step / 2}
          y={PAD.top}
          width={step}
          height={PLOT_H}
          fill="transparent"
          onMouseEnter={() => setHover(i)}
        />
      ))}
    </ChartFrame>
  );
}

export function OverviewCharts({
  submissions,
  clicks,
}: {
  submissions: SeriesPoint[];
  clicks: SeriesPoint[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SubmissionsBarChart data={submissions} />
      <LinkClicksAreaChart data={clicks} />
    </div>
  );
}
