import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, CartesianGrid } from "recharts";

import { getTrends } from "@/lib/api";
import { useAppState } from "@/lib/app-state";
import { compact, full, relative } from "@/lib/format";
import { AsyncBoundary, ChartContainer, MetaItem, PageHeader, Panel } from "@/components/common/panel";
import { DataTable, type Column } from "@/components/common/data-table";
import { Delta, PlatformStack, SentimentBadge, TrendStatusBadge } from "@/components/common/badges";
import { Sparkline } from "@/components/common/sparkline";
import { AXIS, GRID, TooltipCard } from "@/components/charts/primitives";
import { Button } from "@/components/ui/button";
import type { Trend } from "@/lib/types";

export const Route = createFileRoute("/trends/")({
  head: () => ({
    meta: [
      { title: "Trend Intelligence — SIGNAL" },
      {
        name: "description",
        content: "Every detected trend with growth, velocity, engagement, sentiment and platform coverage.",
      },
      { property: "og:title", content: "Trend Intelligence — SIGNAL" },
      {
        property: "og:description",
        content: "Detected conversation trends ranked by velocity, growth and cross-platform reach.",
      },
    ],
  }),
  component: TrendsPage,
});

const CATEGORIES = ["All categories", "Policy", "Technology", "Politics", "Markets", "Science", "Consumer Tech", "Media", "Labor", "Finance", "Sports"];

function TrendsPage() {
  const { platform, range } = useAppState();
  const navigate = useNavigate();
  const [category, setCategory] = useState("All categories");

  const query = useQuery({ queryKey: ["trends", platform, range], queryFn: () => getTrends({ platform, range }) });
  const rows = useMemo(
    () => (query.data ?? []).filter((t) => category === "All categories" || t.category === category),
    [query.data, category],
  );

  const columns: Column<Trend>[] = [
    {
      key: "name",
      header: "Trend",
      width: "24%",
      sortValue: (t) => t.name,
      cell: (t) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{t.name}</span>
            <TrendStatusBadge status={t.status} />
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{t.category}</p>
        </div>
      ),
    },
    { key: "growth", header: "Growth", align: "right", sortValue: (t) => t.growth, cell: (t) => <Delta value={t.growth} className="justify-end" /> },
    {
      key: "velocity",
      header: "Velocity",
      align: "right",
      sortValue: (t) => t.velocity,
      cell: (t) => <span className="num">{t.velocity}/hr</span>,
    },
    { key: "posts", header: "Posts", align: "right", sortValue: (t) => t.posts, cell: (t) => <span className="num">{full(t.posts)}</span> },
    {
      key: "engagement",
      header: "Engagement",
      align: "right",
      sortValue: (t) => t.engagement,
      cell: (t) => <span className="num">{compact(t.engagement)}</span>,
      hideable: true,
    },
    {
      key: "creators",
      header: "Creators",
      align: "right",
      sortValue: (t) => t.creators,
      cell: (t) => <span className="num">{compact(t.creators)}</span>,
      hideable: true,
      defaultHidden: true,
    },
    { key: "sentiment", header: "Sentiment", align: "right", sortValue: (t) => t.sentiment, cell: (t) => <SentimentBadge value={t.sentiment} /> },
    { key: "platforms", header: "Platforms", cell: (t) => <PlatformStack platforms={t.platforms} /> },
    {
      key: "first",
      header: "First detected",
      align: "right",
      sortValue: (t) => t.firstDetected,
      cell: (t) => <span className="num text-[11px] text-muted-foreground">{relative(t.firstDetected)}</span>,
      hideable: true,
    },
    {
      key: "shape",
      header: "24h shape",
      align: "right",
      cell: (t) => (
        <div className="flex justify-end">
          <Sparkline data={t.sparkline} width={72} height={22} stroke={t.growth >= 0 ? "var(--positive)" : "var(--negative)"} />
        </div>
      ),
      hideable: true,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-6">
      <PageHeader
        title="Trend Intelligence"
        description="Every cluster currently above the detection threshold, ranked and filterable. Select a trend to open its full intelligence profile."
        meta={
          <>
            <MetaItem label="Detected" value={`${rows.length} trends`} />
            <MetaItem label="Window" value={range} />
            <MetaItem label="Threshold" value="≥ 40 docs/hr, z ≥ 2.5" />
          </>
        }
      />

      <ChartContainer
        title="Velocity against engagement"
        subtitle="Bubble area encodes total posts; upper-right quadrant is the active watchlist"
        bodyClassName="p-3 pr-4"
      >
        <AsyncBoundary query={query} loadingLabel="Loading trend space">
          {() => (
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid {...GRID} vertical />
                <XAxis
                  type="number"
                  dataKey="velocity"
                  name="Velocity"
                  unit="/hr"
                  {...AXIS}
                  label={{ value: "velocity (mentions/hr)", position: "insideBottom", offset: -2, fill: "var(--muted-foreground)", fontSize: 10 }}
                  height={40}
                />
                <YAxis
                  type="number"
                  dataKey="engagement"
                  name="Engagement"
                  tickFormatter={(v) => compact(v)}
                  width={52}
                  {...AXIS}
                />
                <ZAxis type="number" dataKey="posts" range={[40, 420]} />
                <Tooltip
                  cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const t = payload[0]!.payload as Trend;
                    return (
                      <TooltipCard
                        label={t.name}
                        rows={[
                          { name: "Velocity", value: `${t.velocity}/hr` },
                          { name: "Engagement", value: compact(t.engagement) },
                          { name: "Posts", value: full(t.posts) },
                          { name: "Growth", value: `${t.growth > 0 ? "+" : ""}${t.growth}%` },
                        ]}
                        footer="Click the row below to open the profile"
                      />
                    );
                  }}
                />
                <Scatter
                  data={rows}
                  fill="var(--chart-1)"
                  fillOpacity={0.5}
                  stroke="var(--chart-1)"
                  onClick={(p) => {
                    const t = p as unknown as Trend;
                    if (t?.id) navigate({ to: "/trends/$trendId", params: { trendId: t.id } });
                  }}
                  className="cursor-pointer"
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </AsyncBoundary>
      </ChartContainer>

      <Panel>
        <AsyncBoundary query={query} loadingLabel="Loading trends">
          {() => (
            <DataTable
              rows={rows}
              columns={columns}
              pageSize={12}
              searchFields={(t) => `${t.name} ${t.category} ${t.status}`}
              searchPlaceholder="Filter trends by name, category or status…"
              initialSort={{ key: "velocity", dir: "desc" }}
              onRowClick={(t) => navigate({ to: "/trends/$trendId", params: { trendId: t.id } })}
              toolbar={
                <div className="flex flex-wrap items-center gap-1">
                  {CATEGORIES.slice(0, 6).map((c) => (
                    <Button
                      key={c}
                      variant={category === c ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </Button>
                  ))}
                </div>
              }
            />
          )}
        </AsyncBoundary>
      </Panel>
    </div>
  );
}
