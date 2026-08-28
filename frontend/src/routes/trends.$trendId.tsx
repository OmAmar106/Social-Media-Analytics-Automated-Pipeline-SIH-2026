import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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

import { getDemographics, getPropagation, getTrend } from "@/lib/api";
import { useAppState } from "@/lib/app-state";
import { clockUTC, compact, dateUTC, full, pct, relative } from "@/lib/format";
import { PLATFORM_META } from "@/lib/mock/dataset";
import { AsyncBoundary, ChartContainer, MetaItem, PageHeader, Panel, PanelHeader } from "@/components/common/panel";
import { PlatformBadge, SentimentBadge, TrendStatusBadge } from "@/components/common/badges";
import { KpiGrid } from "@/components/common/kpi-card";
import { NetworkGraph } from "@/components/graph/network-graph";
import { PropagationTimeline } from "@/components/graph/propagation-timeline";
import { AXIS, CHART_COLORS, GRID, Legend, chartTooltip } from "@/components/charts/primitives";

export const Route = createFileRoute("/trends/$trendId")({
  head: ({ params }) => {
    const title = `Trend profile ${params.trendId} — SIGNAL`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: "Full intelligence profile: activity curve, platform split, sentiment, propagation and audience.",
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: "Activity, platform split, sentiment breakdown, propagation cascade and audience profile for a detected trend.",
        },
      ],
    };
  },
  component: TrendDetailPage,
});

function TrendDetailPage() {
  const { trendId } = Route.useParams();
  const { platform } = useAppState();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const trendQuery = useQuery({ queryKey: ["trend", trendId], queryFn: () => getTrend(trendId) });
  const propQuery = useQuery({ queryKey: ["propagation", trendId], queryFn: () => getPropagation(trendId) });
  const demoQuery = useQuery({ queryKey: ["demographics", trendId, platform], queryFn: () => getDemographics(trendId, platform) });

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-6">
      <Link
        to="/trends"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" /> All trends
      </Link>

      <AsyncBoundary query={trendQuery} loadingLabel="Loading trend profile">
        {(t) => (
          <>
            <PageHeader
              title={t.name}
              description={t.summary}
              badge={<TrendStatusBadge status={t.status} />}
              meta={
                <>
                  <MetaItem label="Category" value={t.category} />
                  <MetaItem label="First detected" value={`${dateUTC(t.firstDetected)} (${relative(t.firstDetected)})`} />
                  <MetaItem label="Peak" value={`${clockUTC(t.peakActivity)} UTC`} />
                  <MetaItem
                    label="Platforms"
                    value={
                      <span className="flex flex-wrap gap-1">
                        {t.platforms.map((p) => (
                          <PlatformBadge key={p} platform={p} size="xs" />
                        ))}
                      </span>
                    }
                  />
                </>
              }
            />

            <KpiGrid
              kpis={[
                { id: "posts", label: "Total posts", value: t.posts, delta: t.growth, unit: "", hint: "documents matched to this cluster", spark: t.sparkline },
                { id: "eng", label: "Engagement", value: t.engagement, delta: Math.round(t.growth * 0.7), unit: "", hint: "likes, shares, replies, reactions", spark: t.sparkline },
                { id: "vel", label: "Velocity", value: t.velocity, delta: Math.round(t.growth * 0.4), unit: "/hr", hint: "mentions per hour, 3h moving average", spark: t.sparkline },
                { id: "creators", label: "Unique creators", value: t.creators, delta: Math.round(t.growth * 0.3), unit: "", hint: "distinct accounts participating", spark: t.sparkline },
                { id: "sent", label: "Net sentiment", value: t.sentiment, delta: 0, unit: "idx", hint: "weighted −1 to +1", spark: t.sparkline },
              ]}
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <ChartContainer
                className="xl:col-span-2"
                title="Activity curve"
                subtitle="Mentions, engagement and unique creators over the trend lifetime"
                actions={
                  <Legend
                    items={[
                      { label: "Mentions", color: "var(--chart-1)" },
                      { label: "Engagement", color: "var(--chart-2)" },
                      { label: "Creators", color: "var(--chart-4)" },
                    ]}
                  />
                }
                bodyClassName="p-3 pr-4"
              >
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={t.series} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
                    <defs>
                      <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="t" tickFormatter={clockUTC} minTickGap={44} {...AXIS} />
                    <YAxis tickFormatter={(v) => compact(v)} width={50} {...AXIS} />
                    <Tooltip
                      content={chartTooltip((l) => `${clockUTC(l)} UTC`, (v) => compact(Number(v)))}
                      cursor={{ stroke: "var(--border-strong)" }}
                    />
                    <Area type="monotone" dataKey="mentions" name="Mentions" stroke="var(--chart-1)" fill="url(#m1)" strokeWidth={1.6} />
                    <Area type="monotone" dataKey="engagement" name="Engagement" stroke="var(--chart-2)" fill="transparent" strokeWidth={1.4} />
                    <Area type="monotone" dataKey="creators" name="Creators" stroke="var(--chart-4)" fill="transparent" strokeWidth={1.2} strokeDasharray="4 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="Sentiment composition" subtitle="Share of classified documents" bodyClassName="p-3">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Positive", value: t.sentimentSplit.positive, fill: "var(--positive)" },
                        { name: "Neutral", value: t.sentimentSplit.neutral, fill: "var(--muted-foreground)" },
                        { name: "Negative", value: t.sentimentSplit.negative, fill: "var(--negative)" },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={94}
                      paddingAngle={2}
                      stroke="var(--surface)"
                    />
                    <Tooltip content={chartTooltip(undefined, (v) => pct(Number(v)))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-4 pb-1 text-[11px] text-muted-foreground">
                  <span>Net index</span>
                  <SentimentBadge value={t.sentiment} />
                </div>
              </ChartContainer>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <ChartContainer title="Platform breakdown" subtitle="Mentions and engagement per platform" bodyClassName="p-3 pr-4">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={t.platformBreakdown.map((b) => ({ ...b, name: PLATFORM_META[b.platform].short }))}
                    margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                  >
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="name" {...AXIS} />
                    <YAxis tickFormatter={(v) => compact(v)} width={48} {...AXIS} />
                    <Tooltip cursor={{ fill: "var(--accent)", opacity: 0.4 }} content={chartTooltip(undefined, (v) => full(Number(v)))} />
                    <Bar dataKey="mentions" name="Mentions" fill="var(--chart-1)" fillOpacity={0.8} radius={[2, 2, 0, 0]} barSize={22} />
                    <Bar dataKey="engagement" name="Engagement" fill="var(--chart-2)" fillOpacity={0.55} radius={[2, 2, 0, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="Audience profile" subtitle="Age distribution and behavioral affinity" bodyClassName="p-3 pr-4">
                <AsyncBoundary query={demoQuery} loadingLabel="Loading audience">
                  {(d) => (
                    <div className="grid grid-cols-2 gap-2">
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={d.age} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                          <CartesianGrid {...GRID} horizontal={false} vertical />
                          <XAxis type="number" tickFormatter={(v) => `${v}%`} {...AXIS} />
                          <YAxis type="category" dataKey="bucket" width={44} {...AXIS} />
                          <Tooltip cursor={{ fill: "var(--accent)", opacity: 0.4 }} content={chartTooltip(undefined, (v) => pct(Number(v)))} />
                          <Bar dataKey="share" name="Share" radius={[0, 2, 2, 0]} barSize={14}>
                            {d.age.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.8} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <ResponsiveContainer width="100%" height={240}>
                        <RadarChart data={d.interests} outerRadius={78}>
                          <PolarGrid stroke="var(--border)" />
                          <PolarAngleAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 9 }} />
                          <Radar dataKey="affinity" name="Affinity" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.25} />
                          <Tooltip content={chartTooltip(undefined, (v) => String(v))} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </AsyncBoundary>
              </ChartContainer>
            </div>
          </>
        )}
      </AsyncBoundary>

      <AsyncBoundary query={propQuery} loadingLabel="Reconstructing propagation cascade">
        {(g) => (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Panel className="flex min-h-[460px] flex-col xl:col-span-2">
              <PanelHeader
                title="Propagation cascade"
                subtitle={`Origin traced to @${g.nodes.find((n) => n.id === g.origin.nodeId)?.handle ?? "unknown"} · ${pct(g.origin.confidence * 100, 0)} confidence`}
                actions={
                  <Link to="/propagation" className="text-xs text-primary hover:text-primary/80">
                    Open full analysis
                  </Link>
                }
              />
              <NetworkGraph
                nodes={g.nodes}
                edges={g.edges}
                layout="force"
                selectedId={selectedNode}
                onSelect={setSelectedNode}
                className="min-h-[380px] flex-1"
              />
            </Panel>

            <Panel className="flex max-h-[520px] flex-col">
              <PanelHeader title="Propagation timeline" subtitle={`${g.timeline.length} recorded events`} />
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                <PropagationTimeline events={g.timeline} activeNodeId={selectedNode} onSelect={setSelectedNode} />
              </div>
            </Panel>
          </div>
        )}
      </AsyncBoundary>

      <AsyncBoundary query={trendQuery} loadingLabel="Loading correlation">
        {(t) => (
          <ChartContainer title="Sentiment against volume" subtitle="Correlation between conversation size and tone" bodyClassName="p-3 pr-4">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={t.series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid {...GRID} />
                <XAxis dataKey="t" tickFormatter={clockUTC} minTickGap={44} {...AXIS} />
                <YAxis domain={[-1, 1]} width={44} {...AXIS} />
                <Tooltip content={chartTooltip((l) => `${clockUTC(l)} UTC`, (v) => Number(v).toFixed(2))} cursor={{ stroke: "var(--border-strong)" }} />
                <Line type="monotone" dataKey="sentiment" name="Net sentiment" stroke="var(--chart-3)" strokeWidth={1.6} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </AsyncBoundary>
    </div>
  );
}
