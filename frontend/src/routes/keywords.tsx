import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { getKeywords } from "@/lib/api";
import { useAppState } from "@/lib/app-state";
import { compact, full, relative } from "@/lib/format";
import { AsyncBoundary, ChartContainer, MetaItem, PageHeader, Panel, PanelHeader } from "@/components/common/panel";
import { DataTable, type Column } from "@/components/common/data-table";
import { Delta, PlatformStack, SentimentBadge } from "@/components/common/badges";
import { Sparkline } from "@/components/common/sparkline";
import { DetailDrawer, DrawerSection, StatGrid } from "@/components/common/detail-drawer";
import { AXIS, CHART_COLORS, GRID, chartTooltip } from "@/components/charts/primitives";
import type { Keyword } from "@/lib/types";

export const Route = createFileRoute("/keywords")({
  head: () => ({
    meta: [
      { title: "Viral Keywords — SIGNAL" },
      {
        name: "description",
        content: "Ranked keyword and hashtag intelligence: volume, velocity, growth, clusters and co-occurring terms.",
      },
      { property: "og:title", content: "Viral Keywords — SIGNAL" },
      {
        property: "og:description",
        content: "Track breakout terms by volume, velocity and semantic cluster across every monitored platform.",
      },
    ],
  }),
  component: KeywordsPage,
});

function KeywordsPage() {
  const { platform, range } = useAppState();
  const [active, setActive] = useState<Keyword | null>(null);
  const query = useQuery({ queryKey: ["keywords", platform, range], queryFn: () => getKeywords({ platform, range }) });
  const rows = query.data ?? [];

  const clusters = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((k) => map.set(k.cluster, (map.get(k.cluster) ?? 0) + k.volume));
    return [...map.entries()].map(([cluster, volume]) => ({ cluster, volume })).sort((a, b) => b.volume - a.volume);
  }, [rows]);

  const breakout = useMemo(() => [...rows].sort((a, b) => b.growth - a.growth).slice(0, 10), [rows]);

  const columns: Column<Keyword>[] = [
    {
      key: "term",
      header: "Term",
      width: "22%",
      sortValue: (k) => k.term,
      cell: (k) => (
        <div className="min-w-0">
          <span className="num truncate font-medium text-foreground">{k.term}</span>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{k.cluster}</p>
        </div>
      ),
    },
    { key: "volume", header: "Volume", align: "right", sortValue: (k) => k.volume, cell: (k) => <span className="num">{full(k.volume)}</span> },
    { key: "growth", header: "Growth", align: "right", sortValue: (k) => k.growth, cell: (k) => <Delta value={k.growth} className="justify-end" /> },
    { key: "velocity", header: "Velocity", align: "right", sortValue: (k) => k.velocity, cell: (k) => <span className="num">{k.velocity}/hr</span> },
    {
      key: "engagement",
      header: "Engagement",
      align: "right",
      sortValue: (k) => k.engagement,
      cell: (k) => <span className="num">{compact(k.engagement)}</span>,
      hideable: true,
    },
    { key: "sentiment", header: "Sentiment", align: "right", sortValue: (k) => k.sentiment, cell: (k) => <SentimentBadge value={k.sentiment} /> },
    { key: "platforms", header: "Platforms", cell: (k) => <PlatformStack platforms={k.platforms} /> },
    {
      key: "first",
      header: "First seen",
      align: "right",
      sortValue: (k) => k.firstDetected,
      cell: (k) => <span className="num text-[11px] text-muted-foreground">{relative(k.firstDetected)}</span>,
      hideable: true,
    },
    {
      key: "shape",
      header: "Trajectory",
      align: "right",
      cell: (k) => (
        <div className="flex justify-end">
          <Sparkline data={k.series} width={72} height={22} stroke={k.growth >= 0 ? "var(--positive)" : "var(--negative)"} />
        </div>
      ),
      hideable: true,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-6">
      <PageHeader
        title="Viral Keywords"
        description="Terms, hashtags and phrases crossing the breakout threshold, grouped into semantic clusters with co-occurrence links."
        meta={
          <>
            <MetaItem label="Tracked" value={`${rows.length} terms`} />
            <MetaItem label="Clusters" value={`${clusters.length}`} />
            <MetaItem label="Window" value={range} />
            <MetaItem label="Extraction" value="TF-IDF + entity linking" />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartContainer
          className="xl:col-span-2"
          title="Breakout terms"
          subtitle="Highest period-over-period growth in the active window"
          bodyClassName="p-3 pr-4"
        >
          <ResponsiveContainer width="100%" height={272}>
            <BarChart data={breakout} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="term" interval={0} angle={-18} textAnchor="end" height={54} {...AXIS} />
              <YAxis tickFormatter={(v) => `${v}%`} width={48} {...AXIS} />
              <Tooltip cursor={{ fill: "var(--accent)", opacity: 0.35 }} content={chartTooltip(undefined, (v) => `+${v}%`)} />
              <Bar dataKey="growth" name="Growth" radius={[2, 2, 0, 0]} barSize={26}>
                {breakout.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <Panel>
          <PanelHeader title="Semantic clusters" subtitle="Share of tracked keyword volume" />
          <div className="space-y-2.5 p-4">
            {clusters.slice(0, 8).map((c) => {
              const max = clusters[0]?.volume || 1;
              return (
                <div key={c.cluster}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-foreground/85">{c.cluster}</span>
                    <span className="num text-muted-foreground">{compact(c.volume)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-raised">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${(c.volume / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel>
        <AsyncBoundary query={query} loadingLabel="Loading keywords">
          {() => (
            <DataTable
              rows={rows}
              columns={columns}
              pageSize={14}
              searchFields={(k) => `${k.term} ${k.cluster} ${k.related.join(" ")}`}
              searchPlaceholder="Filter keywords, clusters or related terms…"
              initialSort={{ key: "volume", dir: "desc" }}
              onRowClick={setActive}
              activeRowId={active?.id ?? null}
            />
          )}
        </AsyncBoundary>
      </Panel>

      <DetailDrawer
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
        eyebrow="Keyword"
        title={active?.term ?? ""}
        subtitle={active ? `Cluster: ${active.cluster}` : ""}
      >
        {active && (
          <>
            <StatGrid
              items={[
                { label: "Volume", value: <span className="num">{full(active.volume)}</span> },
                { label: "Growth", value: <Delta value={active.growth} /> },
                { label: "Velocity", value: <span className="num">{active.velocity}/hr</span> },
                { label: "Engagement", value: <span className="num">{compact(active.engagement)}</span> },
                { label: "Sentiment", value: <SentimentBadge value={active.sentiment} /> },
                { label: "First seen", value: <span className="num">{relative(active.firstDetected)}</span> },
              ]}
            />
            <DrawerSection title="24h trajectory">
              <Sparkline data={active.series} width={440} height={64} stroke="var(--chart-1)" fill />
            </DrawerSection>
            <DrawerSection title="Co-occurring terms">
              <div className="flex flex-wrap gap-1.5">
                {active.related.map((r) => (
                  <span key={r} className="num rounded-sm border border-border bg-surface px-2 py-1 text-[11px] text-muted-foreground">
                    {r}
                  </span>
                ))}
              </div>
            </DrawerSection>
            <DrawerSection title="Platform coverage">
              <PlatformStack platforms={active.platforms} max={6} />
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </div>
  );
}
