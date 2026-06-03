"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Brush,
} from "recharts";

type ChartPoint = { name: string; published: number };

type PublishingActivityChartProps = {
  days?: number;
  fallbackDaily?: number;
};

export function PublishingActivityChart({
  days = 30,
  fallbackDaily = 1,
}: PublishingActivityChartProps) {
  const [series, setSeries] = useState<ChartPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [brush, setBrush] = useState<{ startIndex: number; endIndex: number } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/admin/analytics/publishing?days=${days}`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { series?: { label: string; published: number }[] }) => {
        if (cancelled) return;
        const next = (data.series ?? []).map((d) => ({
          name: d.label,
          published: d.published,
        }));
        setSeries(next);
        setError(null);
        if (next.length > 0) {
          const endIndex = next.length - 1;
          const startIndex = Math.max(0, next.length - Math.min(30, next.length));
          setBrush({ startIndex, endIndex });
        }
      })
      .catch(async (err) => {
        if (cancelled) return;
        try {
          const text =
            typeof err?.text === "function" ? await err.text() : String(err);
          setError(text || "Failed to load publishing analytics");
        } catch {
          setError("Failed to load publishing analytics");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const chartData = useMemo(() => {
    if (series.length > 0) return series;
    return Array.from({ length: Math.min(days, 30) }, (_, i) => ({
      name: `Day ${i + 1}`,
      published: Math.round(fallbackDaily),
    }));
  }, [series, days, fallbackDaily]);

  return (
    <div className="lg:col-span-2 bg-white dark:bg-[#1A1A18] border border-border p-6">
      <h2 className="text-[14px] font-bold uppercase tracking-widest mb-1">
        Publishing activity
      </h2>
      <p className="text-[11px] text-muted-foreground mb-6">
        Published stories per day. Drag the slider to view earlier dates.
        {error ? ` (${error})` : ""}
      </p>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-border)"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              fontSize={12}
              stroke="var(--color-muted-foreground)"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              fontSize={12}
              stroke="var(--color-muted-foreground)"
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 0,
                borderColor: "hsl(var(--border))",
              }}
            />
            <Line
              type="monotone"
              dataKey="published"
              stroke="#C41E3A"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#C41E3A" }}
            />
            {chartData.length > 31 ? (
              <Brush
                dataKey="name"
                height={26}
                stroke="#C41E3A"
                travellerWidth={10}
                startIndex={brush?.startIndex}
                endIndex={brush?.endIndex}
                onChange={(next) => {
                  if (!next) return;
                  if (
                    typeof next.startIndex === "number" &&
                    typeof next.endIndex === "number"
                  ) {
                    setBrush({ startIndex: next.startIndex, endIndex: next.endIndex });
                  }
                }}
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
