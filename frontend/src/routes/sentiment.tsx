import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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

import { getSentiment } from "@/lib/api";
import { useAppState } from "@/lib/app-state";
import { clockUTC, compact, full, pct } from "@/lib/format";
import { PLATFORM_META } from "@/lib/mock/dataset";
import { AsyncBoundary, ChartContainer, MetaItem, PageHeader, Panel, PanelHeader } from "@/components/common/panel";
import { PlatformBadge, SentimentBadge } from "@/components/common/badges";
import { AXIS, GRID, Legend, chartTooltip } from "@/components/charts/primitives";

export const Route = createFileRoute("/sentiment")({
  head: () => ({
    meta: [
      { title: "Sentiment Analysis — SIGNAL" },
      {
        name: "description",
        content: "Sentiment over time, by platform, by trend and by creator, with positive/neutral/negative composition.",
      },
      { property: "og:title", content: "Sentiment Analysis — SIGNAL" },
      {
        property: "og:description",
        content: "Track tone shifts across platforms, trends and influential creators with a weighted sentiment index.",
      },
    ],
  }),
  component: SentimentPage,
});

function SentimentPage() {
  const { range } = useAppState();
  const query = useQuery({ queryKey: ["sentiment", range], queryFn: () => getSentiment({ range }) });

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-6">
      <PageHeader
        title="Sentiment Analysis"
        description="Weighted tone across the entire corpus. The net index runs from −1 (uniformly negative) to +1 (uniformly positive), weighted by reach and engagement."
        meta={
          <>
            <MetaItem label="Window" value={range} />
            <MetaItem label="Classifier" value="multilingual-sent-v4" />
            <MetaItem label="Macro F1" value="0.891" />
            <MetaItem label="Languages" value="27" />
          </>
        }
      />

      <AsyncBoundary query={query} loadingLabel="Scoring documents">
        {(d) => (
          <>
            <ChartContainer
              title="Sentiment composition over time"
              subtitle="Stacked share of classified documents with the net index overlaid"
              actions={
                <Legend
                  items={[
                    { label: "Positive", color: "var(--positive)" },
                    { label: "Neutral", color: "var(--muted-foreground)" },
                    { label: "Negative", color: "var(--negative)" },
                    { label: "Net index", color: "var(--chart-1)" },
                  ]}
                />
              }
              bodyClassName="p-3 pr-4"
            >
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={d.series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid {...GRID} />
                  <XAxis dataKey="t" tickFormatter={clockUTC} minTickGap={44} {...AXIS} />
                  <YAxis yAxisId="left" tickFormatter={(v) => `${v}%`} width={44} {...AXIS} />
                  <YAxis yAxisId="right" orientation="right" domain={[-1, 1]} width={38} {...AXIS} />
                  <Tooltip content={chartTooltip((l) => `${clockUTC(l)} UTC`)} cursor={{ stroke: "var(--border-strong)" }} />
                  <Area yAxisId="left" type="monotone" stackId="s" dataKey="positive" name="Positive" stroke="var(--positive)" fill="var(--positive)" fillOpacity={0.25} strokeWidth={1.2} />
                  <Area yAxisId="left" type="monotone" stackId="s" dataKey="neutral" name="Neutral" stroke="var(--muted-foreground)" fill="var(--muted-foreground)" fillOpacity={0.16} strokeWidth={1.2} />
                  <Area yAxisId="left" type="monotone" stackId="s" dataKey="negative" name="Negative" stroke="var(--negative)" fill="var(--negative)" fillOpacity={0.22} strokeWidth={1.2} />
                  <Line yAxisId="right" type="monotone" dataKey="net" name="Net index" stroke="var(--chart-1)" strokeWidth={1.8} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <ChartContainer title="Tone by platform" subtitle="Composition per network" bodyClassName="p-3 pr-4" className="xl:col-span-2">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={d.byPlatform.map((p) => ({ ...p, name: PLATFORM_META[p.platform].short }))}
                    margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                    stackOffset="expand"
                  >
                    <CartesianGrid {...GRID} />
                    <XAxis dataKey="name" {...AXIS} />
                    <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} width={44} {...AXIS} />
                    <Tooltip cursor={{ fill: "var(--accent)", opacity: 0.35 }} content={chartTooltip(undefined, (v) => pct(Number(v)))} />
                    <Bar dataKey="positive" name="Positive" stackId="a" fill="var(--positive)" fillOpacity={0.75} barSize={34} />
                    <Bar dataKey="neutral" name="Neutral" stackId="a" fill="var(--muted-foreground)" fillOpacity={0.4} barSize={34} />
                    <Bar dataKey="negative" name="Negative" stackId="a" fill="var(--negative)" fillOpacity={0.7} barSize={34} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <Panel className="flex flex-col">
                <PanelHeader title="Most polarizing trends" subtitle="Largest gap between positive and negative share" />
                <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
                  {[...d.byTrend]
                    .sort((a, b) => Math.abs(b.positive - b.negative) - Math.abs(a.positive - a.negative))
                    .slice(0, 9)
                    .map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">{t.name}</p>
                          <p className="num mt-0.5 text-[10px] text-muted-foreground">
                            {pct(t.positive)} pos · {pct(t.negative)} neg · {compact(t.posts)} posts
                          </p>
                        </div>
                        <SentimentBadge value={t.net} />
                      </div>
                    ))}
                </div>
              </Panel>
            </div>

            <Panel>
              <PanelHeader title="Sentiment leaders" subtitle="Highest-influence creators and the tone they carry" />
              <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5">
                {d.byCreator.slice(0, 10).map((c) => (
                  <div key={c.id} className="border-border p-4 lg:border-r">
                    <div className="flex items-center justify-between gap-2">
                      <span className="num truncate text-xs font-medium">@{c.handle}</span>
                      <PlatformBadge platform={c.platform} size="xs" />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <SentimentBadge value={c.net} label={c.sentiment} />
                      <span className="num text-[10px] text-muted-foreground">{full(c.volume)} posts</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
