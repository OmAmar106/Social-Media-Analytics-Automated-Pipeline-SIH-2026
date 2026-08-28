import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getDemographics, getTrends } from "@/lib/api";
import { useAppState } from "@/lib/app-state";
import { compact, full, pct } from "@/lib/format";
import { AsyncBoundary, ChartContainer, MetaItem, PageHeader, Panel, PanelHeader } from "@/components/common/panel";
import { Delta } from "@/components/common/badges";
import { AXIS, CHART_COLORS, GRID, chartTooltip } from "@/components/charts/primitives";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/audience")({
  head: () => ({
    meta: [
      { title: "Audience & Demographics — SIGNAL" },
      {
        name: "description",
        content: "Inferred age, gender, geography, profession, interests and behavioral patterns behind each conversation.",
      },
      { property: "og:title", content: "Audience & Demographics — SIGNAL" },
      {
        property: "og:description",
        content: "Understand who is driving a trend: demographics, geography, interests and activity rhythm.",
      },
    ],
  }),
  component: AudiencePage,
});

function AudiencePage() {
  const { platform, range } = useAppState();
  const [trendId, setTrendId] = useState<string | null>(null);

  const trendsQuery = useQuery({ queryKey: ["trends", platform, range], queryFn: () => getTrends({ platform, range }) });
  const activeId = trendId ?? trendsQuery.data?.[0]?.id ?? null;
  const query = useQuery({
    queryKey: ["demographics", activeId, platform],
    queryFn: () => getDemographics(activeId!, platform),
    enabled: !!activeId,
  });

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-6">
      <PageHeader
        title="Audience & Demographics"
        description="Inferred audience composition for the selected conversation. Estimates are modelled from public profile signals and behavioral clustering, never from private data."
        meta={
          <>
            <MetaItem label="Sample" value={query.data ? `${full(query.data.sampleSize)} profiles` : "—"} />
            <MetaItem label="Confidence" value={query.data ? pct(query.data.confidence * 100, 0) : "—"} />
            <MetaItem label="Method" value="probabilistic inference" />
          </>
        }
        actions={
          <Select value={activeId ?? ""} onValueChange={setTrendId}>
            <SelectTrigger className="h-8 w-[280px] text-xs">
              <SelectValue placeholder="Select a trend" />
            </SelectTrigger>
            <SelectContent>
              {(trendsQuery.data ?? []).map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <AsyncBoundary query={query} loadingLabel="Modelling audience">
        {(d) => (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ChartContainer title="Age distribution" subtitle="Share of participating accounts" bodyClassName="p-3 pr-4">
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={d.age} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="bucket" {...AXIS} />
                    <YAxis tickFormatter={(v) => `${v}%`} width={40} {...AXIS} />
                    <Tooltip cursor={{ fill: "var(--accent)", opacity: 0.35 }} content={chartTooltip(undefined, (v) => pct(Number(v)))} />
                    <Bar dataKey="share" name="Share" radius={[2, 2, 0, 0]} barSize={30}>
                      {d.age.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="Gender split" subtitle="Inferred, self-declared where available" bodyClassName="p-3">
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={d.gender} dataKey="share" nameKey="label" innerRadius={54} outerRadius={84} paddingAngle={2} stroke="var(--surface)">
                      {d.gender.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />
                      ))}
                    </Pie>
                    <Tooltip content={chartTooltip(undefined, (v) => pct(Number(v)))} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="Interest affinity" subtitle="Index against platform baseline" bodyClassName="p-3">
                <ResponsiveContainer width="100%" height={230}>
                  <RadarChart data={d.interests} outerRadius={80}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 9 }} />
                    <Radar dataKey="affinity" name="Affinity" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.25} />
                    <Tooltip content={chartTooltip()} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <Panel className="xl:col-span-1">
                <PanelHeader title="Geography" subtitle="Top regions by share of conversation" />
                <div className="space-y-2.5 p-4">
                  {d.locations.map((l) => (
                    <div key={l.region}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-foreground/85">{l.region}</span>
                        <span className="flex items-center gap-3">
                          <span className="num text-muted-foreground">{pct(l.share)}</span>
                          <Delta value={l.growth} />
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-raised">
                        <div className="h-full rounded-full bg-chart-1/70" style={{ width: `${Math.min(100, l.share * 3)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <ChartContainer
                className="xl:col-span-2"
                title="Activity rhythm"
                subtitle="Share of posting volume by hour of day (UTC)"
                bodyClassName="p-3 pr-4"
              >
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={d.hourly} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="hourFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-4)" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="var(--chart-4)" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="hour" interval={1} {...AXIS} />
                    <YAxis tickFormatter={(v) => compact(v)} width={44} {...AXIS} />
                    <Tooltip content={chartTooltip((l) => `${l} UTC`, (v) => compact(Number(v)))} cursor={{ stroke: "var(--border-strong)" }} />
                    <Area type="monotone" dataKey="activity" name="Activity" stroke="var(--chart-4)" fill="url(#hourFill)" strokeWidth={1.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel>
                <PanelHeader title="Professional composition" subtitle="Declared or inferred occupation clusters" />
                <div className="grid grid-cols-2 gap-px bg-border">
                  {d.professions.map((p) => (
                    <div key={p.label} className="bg-surface p-3">
                      <p className="text-xs text-foreground/85">{p.label}</p>
                      <p className="num mt-1 text-base font-medium">{pct(p.share)}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <ChartContainer title="Behavioral signals" subtitle="Audience value against platform benchmark" bodyClassName="p-3 pr-4">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={d.behaviors} layout="vertical" margin={{ top: 4, right: 12, left: 40, bottom: 0 }}>
                    <CartesianGrid {...GRID} horizontal={false} vertical />
                    <XAxis type="number" {...AXIS} />
                    <YAxis type="category" dataKey="label" width={110} {...AXIS} />
                    <Tooltip cursor={{ fill: "var(--accent)", opacity: 0.35 }} content={chartTooltip()} />
                    <Bar dataKey="benchmark" name="Benchmark" fill="var(--muted-foreground)" fillOpacity={0.3} barSize={9} radius={[0, 2, 2, 0]} />
                    <Bar dataKey="value" name="Audience" fill="var(--chart-2)" fillOpacity={0.85} barSize={9} radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
