import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { getContent, getCreators } from "@/lib/api";
import { useAppState } from "@/lib/app-state";
import { compact, full, relative } from "@/lib/format";
import { AsyncBoundary, ChartContainer, MetaItem, PageHeader, Panel, PanelHeader } from "@/components/common/panel";
import { DataTable, type Column } from "@/components/common/data-table";
import { PlatformBadge, SentimentBadge } from "@/components/common/badges";
import { DetailDrawer, DrawerSection, StatGrid } from "@/components/common/detail-drawer";
import { AXIS, GRID, chartTooltip } from "@/components/charts/primitives";
import type { ContentItem } from "@/lib/types";

export const Route = createFileRoute("/content")({
  head: () => ({
    meta: [
      { title: "Content Intelligence — SIGNAL" },
      {
        name: "description",
        content: "Highest-performing posts, virality scoring, format analysis and the creators driving reach.",
      },
      { property: "og:title", content: "Content Intelligence — SIGNAL" },
      {
        property: "og:description",
        content: "Inspect viral documents, engagement composition and top creators across every monitored platform.",
      },
    ],
  }),
  component: ContentPage,
});

function ContentPage() {
  const { platform } = useAppState();
  const [active, setActive] = useState<ContentItem | null>(null);

  const query = useQuery({ queryKey: ["content", platform], queryFn: () => getContent({ platform }) });
  const creatorsQuery = useQuery({ queryKey: ["creators"], queryFn: getCreators });
  const rows = query.data ?? [];

  const byTopic = useMemo(() => {
    const map = new Map<string, { topic: string; engagement: number; posts: number }>();
    rows.forEach((c) => {
      const cur = map.get(c.topic) ?? { topic: c.topic, engagement: 0, posts: 0 };
      cur.engagement += c.engagement;
      cur.posts += 1;
      map.set(c.topic, cur);
    });
    return [...map.values()].sort((a, b) => b.engagement - a.engagement).slice(0, 9);
  }, [rows]);

  const creatorById = useMemo(
    () => new Map((creatorsQuery.data ?? []).map((c) => [c.id, c])),
    [creatorsQuery.data],
  );

  const columns: Column<ContentItem>[] = [
    {
      key: "preview",
      header: "Document",
      width: "38%",
      cell: (c) => (
        <div className="min-w-0">
          <p className="line-clamp-2 text-xs leading-relaxed text-foreground/90">{c.preview}</p>
          <p className="num mt-1 text-[10px] text-muted-foreground">
            @{creatorById.get(c.creatorId)?.handle ?? c.creatorId} · {c.topic}
          </p>
        </div>
      ),
    },
    { key: "platform", header: "Platform", cell: (c) => <PlatformBadge platform={c.platform} size="xs" /> },
    { key: "virality", header: "Virality", align: "right", sortValue: (c) => c.virality, cell: (c) => <ViralityMeter score={c.virality} /> },
    { key: "engagement", header: "Engagement", align: "right", sortValue: (c) => c.engagement, cell: (c) => <span className="num">{compact(c.engagement)}</span> },
    { key: "reach", header: "Reach", align: "right", sortValue: (c) => c.reach, cell: (c) => <span className="num">{compact(c.reach)}</span>, hideable: true },
    { key: "likes", header: "Likes", align: "right", sortValue: (c) => c.likes, cell: (c) => <span className="num">{compact(c.likes)}</span>, hideable: true, defaultHidden: true },
    { key: "shares", header: "Shares", align: "right", sortValue: (c) => c.shares, cell: (c) => <span className="num">{compact(c.shares)}</span>, hideable: true },
    { key: "sentiment", header: "Sentiment", align: "right", sortValue: (c) => c.sentimentScore, cell: (c) => <SentimentBadge value={c.sentimentScore} label={c.sentiment} /> },
    {
      key: "timestamp",
      header: "Published",
      align: "right",
      sortValue: (c) => c.timestamp,
      cell: (c) => <span className="num text-[11px] text-muted-foreground">{relative(c.timestamp)}</span>,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-6">
      <PageHeader
        title="Content Intelligence"
        description="Every high-signal document in the corpus, scored for virality and linked to its creator, topic and parent trend."
        meta={
          <>
            <MetaItem label="Documents" value={full(rows.length)} />
            <MetaItem label="Creators" value={full(creatorById.size)} />
            <MetaItem label="Scoring" value="virality-v2 (reach × velocity × depth)" />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartContainer
          className="xl:col-span-2"
          title="Engagement by topic"
          subtitle="Total engagement accumulated per topic cluster"
          bodyClassName="p-3 pr-4"
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byTopic} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="topic" interval={0} angle={-16} textAnchor="end" height={52} {...AXIS} />
              <YAxis tickFormatter={(v) => compact(v)} width={48} {...AXIS} />
              <Tooltip cursor={{ fill: "var(--accent)", opacity: 0.35 }} content={chartTooltip(undefined, (v) => full(Number(v)))} />
              <Bar dataKey="engagement" name="Engagement" fill="var(--chart-1)" fillOpacity={0.8} barSize={26} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <Panel className="flex flex-col">
          <PanelHeader title="Top creators" subtitle="Ranked by influence score" />
          <AsyncBoundary query={creatorsQuery} loadingLabel="Loading creators">
            {(list) => (
              <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
                {[...list]
                  .sort((a, b) => b.influence - a.influence)
                  .slice(0, 8)
                  .map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="num truncate text-xs font-medium">
                          @{c.handle} {c.verified && <span className="text-primary">✦</span>}
                        </p>
                        <p className="num mt-0.5 text-[10px] text-muted-foreground">
                          {compact(c.followers)} followers · {c.engagementRate}% eng.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={c.platform} size="xs" />
                        <span className="num w-8 text-right text-xs">{c.influence}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </AsyncBoundary>
        </Panel>
      </div>

      <Panel>
        <AsyncBoundary query={query} loadingLabel="Loading documents">
          {() => (
            <DataTable
              rows={rows}
              columns={columns}
              pageSize={12}
              searchFields={(c) => `${c.body} ${c.topic} ${c.platform}`}
              searchPlaceholder="Search document text, topic or platform…"
              initialSort={{ key: "virality", dir: "desc" }}
              onRowClick={setActive}
              activeRowId={active?.id ?? null}
            />
          )}
        </AsyncBoundary>
      </Panel>

      <DetailDrawer
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
        eyebrow="Document"
        title={active ? `@${creatorById.get(active.creatorId)?.handle ?? active.creatorId}` : ""}
        subtitle={active ? `${active.topic} · ${relative(active.timestamp)}` : ""}
      >
        {active && (
          <>
            <DrawerSection title="Content">
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{active.body}</p>
            </DrawerSection>
            <StatGrid
              items={[
                { label: "Platform", value: <PlatformBadge platform={active.platform} size="xs" /> },
                { label: "Virality", value: <span className="num">{active.virality}</span> },
                { label: "Reach", value: <span className="num">{full(active.reach)}</span> },
                { label: "Likes", value: <span className="num">{full(active.likes)}</span> },
                { label: "Shares", value: <span className="num">{full(active.shares)}</span> },
                { label: "Comments", value: <span className="num">{full(active.comments)}</span> },
              ]}
            />
            <DrawerSection title="Classification">
              <div className="flex flex-wrap items-center gap-2">
                <SentimentBadge value={active.sentimentScore} label={active.sentiment} />
                <span className="rounded-sm border border-border bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {active.topic}
                </span>
              </div>
            </DrawerSection>
          </>
        )}
      </DetailDrawer>
    </div>
  );
}

function ViralityMeter({ score }: { score: number }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-raised">
        <div
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            backgroundColor: score > 75 ? "var(--negative)" : score > 50 ? "var(--warning)" : "var(--chart-1)",
          }}
        />
      </div>
      <span className="num w-6 text-right text-xs">{score}</span>
    </div>
  );
}
