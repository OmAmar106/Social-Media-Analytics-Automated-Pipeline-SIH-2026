import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Radio } from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getContent, getOverviewKpis, getPlatformAnalytics, getSentimentSeries, getTrends } from "@/lib/api";
import { useAppState } from "@/lib/app-state";
import { clockUTC, compact, full, relative } from "@/lib/format";
import { PLATFORM_META } from "@/lib/mock/dataset";
import { AsyncBoundary, ChartContainer, MetaItem, PageHeader, Panel, PanelHeader } from "@/components/common/panel";
import { KpiGrid } from "@/components/common/kpi-card";
import { Delta, PlatformBadge, PlatformStack, SentimentBadge, TrendStatusBadge } from "@/components/common/badges";
import { Sparkline } from "@/components/common/sparkline";
import { ScrapeButton } from "@/components/layout/scrape-status";
import { AXIS, GRID, Legend, chartTooltip } from "@/components/charts/primitives";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — SIGNAL Social Intelligence" },
      {
        name: "description",
        content:
          "Real-time visibility into conversations, trends, sentiment and audience behavior across six social platforms.",
      },
      { property: "og:title", content: "Command Center — SIGNAL Social Intelligence" },
      {
        property: "og:description",
        content: "Live KPIs, trend detection, sentiment tracking and propagation analysis in one analyst workspace.",
      },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const { platform, range, lastResult } = useAppState();
  const navigate = useNavigate();

  const kpiQuery = useQuery({ queryKey: ["kpis", platform, range], queryFn: () => getOverviewKpis({ platform, range }) });
  const seriesQuery = useQuery({ queryKey: ["sentiment-series", range], queryFn: () => getSentimentSeries({ range }) });
  const trendsQuery = useQuery({ queryKey: ["trends", platform, range], queryFn: () => getTrends({ platform, range }) });
  const platformsQuery = useQuery({ queryKey: ["platforms"], queryFn: getPlatformAnalytics });
  const contentQuery = useQuery({ queryKey: ["content", platform], queryFn: () => getContent({ platform }) });

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-6">
      <PageHeader
        title="Social Intelligence"
        description="Real-time visibility into conversations, trends, sentiment, and audience behavior across every monitored platform."
        meta={
          <>
            <MetaItem label="Window" value={range} />
            <MetaItem label="Scope" value={platform === "all" ? "6 platforms" : PLATFORM_META[platform].name} />
            <MetaItem label="Corpus" value={`${full(4_196_610)} documents`} />
            <MetaItem
              label="Last run"
              value={lastResult ? `${full(lastResult.newPosts)} new posts` : "11 min ago"}
            />
          </>
        }
        actions={<ScrapeButton />}
      />

      <AsyncBoundary query={kpiQuery} loadingLabel="Aggregating KPIs">
        {(kpis) => <KpiGrid kpis={kpis} />}
      </AsyncBoundary>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartContainer
          className="xl:col-span-2"
          title="Conversation volume and net sentiment"
          subtitle="Hourly document count against weighted sentiment index (−1 to +1)"
          actions={
            <Legend
              items={[
                { label: "Documents", color: "var(--chart-1)" },
                { label: "Net sentiment", color: "var(--chart-3)" },
              ]}
            />
          }
          bodyClassName="p-3 pr-4"
        >
          <AsyncBoundary query={seriesQuery} loadingLabel="Loading time series">
            {(series) => (
              <ResponsiveContainer width="100%" height={272}>
                <ComposedChart data={series.slice(-48)} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="t" tickFormatter={clockUTC} minTickGap={44} {...AXIS} />
                  <YAxis yAxisId="left" tickFormatter={(v) => compact(v)} width={48} {...AXIS} />
                  <YAxis yAxisId="right" orientation="right" domain={[-1, 1]} width={38} {...AXIS} />
                  <Tooltip
                    content={chartTooltip(
                      (l) => `${clockUTC(l)} UTC`,
                      (v, n) => (n === "Net sentiment" ? Number(v).toFixed(2) : compact(Number(v))),
                    )}
                    cursor={{ stroke: "var(--border-strong)" }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="volume"
                    name="Documents"
                    stroke="var(--chart-1)"
                    strokeWidth={1.6}
                    fill="url(#volFill)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="net"
                    name="Net sentiment"
                    stroke="var(--chart-3)"
                    strokeWidth={1.6}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </AsyncBoundary>
        </ChartContainer>

        <ChartContainer
          title="Volume by platform"
          subtitle="Documents collected in the active window"
          bodyClassName="p-3 pr-4"
        >
          <AsyncBoundary query={platformsQuery} loadingLabel="Loading platform mix">
            {(rows) => (
              <ResponsiveContainer width="100%" height={272}>
                <BarChart
                  data={[...rows].sort((a, b) => b.posts - a.posts)}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
                >
                  <CartesianGrid {...GRID} horizontal={false} vertical />
                  <XAxis type="number" tickFormatter={(v) => compact(v)} {...AXIS} />
                  <YAxis type="category" dataKey="name" width={64} {...AXIS} />
                  <Tooltip
                    cursor={{ fill: "var(--accent)", opacity: 0.4 }}
                    content={chartTooltip(undefined, (v) => full(Number(v)))}
                  />
                  <Bar dataKey="posts" name="Documents" fill="var(--chart-1)" fillOpacity={0.75} radius={[0, 2, 2, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </AsyncBoundary>
        </ChartContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader
            title="Detected trends"
            subtitle="Ranked by velocity in the active window"
            actions={
              <Link
                to="/trends"
                className="inline-flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80"
              >
                All trends <ArrowUpRight className="size-3.5" />
              </Link>
            }
          />
          <AsyncBoundary query={trendsQuery} loadingLabel="Detecting trends">
            {(rows) => (
              <div className="divide-y divide-border">
                {[...rows]
                  .sort((a, b) => b.velocity - a.velocity)
                  .slice(0, 7)
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => navigate({ to: "/trends/$trendId", params: { trendId: t.id } })}
                      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-raised"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-medium">{t.name}</span>
                          <TrendStatusBadge status={t.status} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                          <span>{t.category}</span>
                          <span className="num">{full(t.posts)} posts</span>
                          <span className="num">{compact(t.engagement)} engagements</span>
                          <span className="num">{t.velocity}/hr</span>
                          <PlatformStack platforms={t.platforms} max={4} />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Sparkline data={t.sparkline} width={80} height={26} stroke={t.growth >= 0 ? "var(--positive)" : "var(--negative)"} />
                        <SentimentBadge value={t.sentiment} />
                        <div className="w-16 text-right">
                          <Delta value={t.growth} />
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </AsyncBoundary>
        </Panel>

        <Panel>
          <PanelHeader
            title="Live signal feed"
            subtitle="Highest-virality documents ingested"
            actions={<Radio className="size-3.5 text-primary" />}
          />
          <AsyncBoundary query={contentQuery} loadingLabel="Streaming documents">
            {(rows) => (
              <ul className="divide-y divide-border">
                {[...rows]
                  .sort((a, b) => b.virality - a.virality)
                  .slice(0, 6)
                  .map((c) => (
                    <li key={c.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <PlatformBadge platform={c.platform} size="xs" />
                        <span className="num text-[10px] text-muted-foreground">{relative(c.timestamp)}</span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-foreground/85">{c.preview}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="num">{compact(c.engagement)} eng.</span>
                        <span className="num">virality {c.virality}</span>
                        <SentimentBadge value={c.sentimentScore} label={c.sentiment} className="h-4 px-1 text-[10px]" />
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </AsyncBoundary>
        </Panel>
      </div>
    </div>
  );
}
