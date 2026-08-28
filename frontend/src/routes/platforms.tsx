import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getPlatformAnalytics, getPlatformMigrations } from "@/lib/api";
import { compact, full, pct } from "@/lib/format";
import { AsyncBoundary, ChartContainer, MetaItem, PageHeader, Panel, PanelHeader } from "@/components/common/panel";
import { Delta, PlatformBadge, SentimentBadge } from "@/components/common/badges";
import { AXIS, GRID, Legend, chartTooltip } from "@/components/charts/primitives";

export const Route = createFileRoute("/platforms")({
  head: () => ({
    meta: [
      { title: "Platform Analytics — SIGNAL" },
      {
        name: "description",
        content: "Compare volume, engagement, sentiment and virality across X, YouTube, Reddit, Telegram, Instagram and Facebook.",
      },
      { property: "og:title", content: "Platform Analytics — SIGNAL" },
      {
        property: "og:description",
        content: "Side-by-side platform performance plus cross-platform trend migration paths.",
      },
    ],
  }),
  component: PlatformsPage,
});

function PlatformsPage() {
  const query = useQuery({ queryKey: ["platforms"], queryFn: getPlatformAnalytics });
  const migrationQuery = useQuery({ queryKey: ["platform-migrations"], queryFn: getPlatformMigrations });

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-6">
      <PageHeader
        title="Platform Analytics"
        description="How each monitored network is performing, what it is talking about, and how conversations migrate between them."
        meta={
          <>
            <MetaItem label="Networks" value="6 connected" />
            <MetaItem label="Collectors" value="18 active" />
            <MetaItem label="Ingest lag" value="≤ 90s" />
          </>
        }
      />

      <AsyncBoundary query={query} loadingLabel="Loading platform analytics">
        {(rows) => (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((p) => (
                <Panel key={p.id}>
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <PlatformBadge platform={p.id} showName />
                    <Delta value={p.growth} />
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 p-4">
                    <Stat label="Documents" value={full(p.posts)} />
                    <Stat label="Engagement" value={compact(p.engagement)} />
                    <Stat label="Active users" value={compact(p.activeUsers)} />
                    <Stat label="Avg. engagement" value={`${p.avgEngagement}`} />
                    <Stat label="Viral items" value={full(p.viralContentCount)} />
                    <div>
                      <p className="label-xs">Sentiment</p>
                      <div className="mt-1">
                        <SentimentBadge value={(p.sentiment.positive - p.sentiment.negative) / 100} />
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-border px-4 py-3">
                    <p className="label-xs">Dominant topics</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {p.topTopics.map((t) => (
                        <span key={t} className="rounded-sm border border-border bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Panel>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <ChartContainer
                className="xl:col-span-2"
                title="Volume against engagement"
                subtitle="Absolute performance by network in the active window"
                actions={
                  <Legend
                    items={[
                      { label: "Documents", color: "var(--chart-1)" },
                      { label: "Engagement", color: "var(--chart-2)" },
                    ]}
                  />
                }
                bodyClassName="p-3 pr-4"
              >
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={rows.map((r) => ({ ...r, name: r.short }))} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="name" {...AXIS} />
                    <YAxis tickFormatter={(v) => compact(v)} width={48} {...AXIS} />
                    <Tooltip cursor={{ fill: "var(--accent)", opacity: 0.35 }} content={chartTooltip(undefined, (v) => full(Number(v)))} />
                    <Bar dataKey="posts" name="Documents" fill="var(--chart-1)" fillOpacity={0.8} barSize={22} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="engagement" name="Engagement" fill="var(--chart-2)" fillOpacity={0.6} barSize={22} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="Positive tone share" subtitle="Comparative sentiment profile" bodyClassName="p-3">
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={rows.map((r) => ({ name: r.short, positive: r.sentiment.positive, negative: r.sentiment.negative }))} outerRadius={92}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                    <Radar dataKey="positive" name="Positive" stroke="var(--positive)" fill="var(--positive)" fillOpacity={0.2} />
                    <Radar dataKey="negative" name="Negative" stroke="var(--negative)" fill="var(--negative)" fillOpacity={0.14} />
                    <Tooltip content={chartTooltip(undefined, (v) => pct(Number(v)))} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </>
        )}
      </AsyncBoundary>

      <Panel>
        <PanelHeader title="Cross-platform migration" subtitle="Where each trend originated and how it travelled" />
        <AsyncBoundary query={migrationQuery} loadingLabel="Tracing migrations">
          {(rows) => (
            <div className="divide-y divide-border">
              {rows.map((m) => (
                <Link
                  key={m.trendId}
                  to="/trends/$trendId"
                  params={{ trendId: m.trendId }}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-raised"
                >
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{m.trend}</span>
                  <div className="flex items-center gap-2">
                    {m.path.map((p, i) => (
                      <span key={`${p}-${i}`} className="flex items-center gap-2">
                        {i > 0 && <ArrowRight className="size-3 text-muted-foreground" />}
                        <PlatformBadge platform={p} size="xs" />
                      </span>
                    ))}
                  </div>
                  <span className="num w-32 text-right text-[11px] text-muted-foreground">
                    {m.hops} hops · {compact(m.reach)} reach
                  </span>
                </Link>
              ))}
            </div>
          )}
        </AsyncBoundary>
      </Panel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label-xs">{label}</p>
      <p className="num mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
