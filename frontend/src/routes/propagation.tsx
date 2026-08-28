import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Crosshair, Layers, Radar, Share2 } from "lucide-react";

import { getCreator, getPropagation, getTrends } from "@/lib/api";
import { useAppState } from "@/lib/app-state";
import { clockUTC, compact, full, pct, relative } from "@/lib/format";
import { AsyncBoundary, MetaItem, PageHeader, Panel, PanelHeader } from "@/components/common/panel";
import { NetworkGraph, type GraphLayout } from "@/components/graph/network-graph";
import { PropagationTimeline } from "@/components/graph/propagation-timeline";
import { PlatformBadge, SentimentBadge } from "@/components/common/badges";
import { DetailDrawer, DrawerSection, StatGrid } from "@/components/common/detail-drawer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/propagation")({
  head: () => ({
    meta: [
      { title: "Trend Propagation — SIGNAL" },
      {
        name: "description",
        content: "Trace how a trend spread: origin attribution, cascade graph, cross-platform hops and event timeline.",
      },
      { property: "og:title", content: "Trend Propagation — SIGNAL" },
      {
        property: "og:description",
        content: "Interactive cascade graph with origin attribution, community clustering and cross-platform migration paths.",
      },
    ],
  }),
  component: PropagationPage,
});

const LAYOUTS: { id: GraphLayout; label: string; icon: typeof Radar }[] = [
  { id: "force", label: "Force", icon: Radar },
  { id: "hierarchy", label: "Hierarchy", icon: Layers },
  { id: "radial", label: "Radial", icon: Crosshair },
  { id: "timeline", label: "Timeline", icon: Share2 },
];

function PropagationPage() {
  const { platform, range } = useAppState();
  const [trendId, setTrendId] = useState<string | null>(null);
  const [layout, setLayout] = useState<GraphLayout>("force");
  const [selected, setSelected] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<string[]>([]);

  const trendsQuery = useQuery({ queryKey: ["trends", platform, range], queryFn: () => getTrends({ platform, range }) });
  const activeId = trendId ?? trendsQuery.data?.[0]?.id ?? null;
  const propQuery = useQuery({
    queryKey: ["propagation", activeId],
    queryFn: () => getPropagation(activeId!),
    enabled: !!activeId,
  });

  const node = propQuery.data?.nodes.find((n) => n.id === selected) ?? null;
  const creatorQuery = useQuery({
    queryKey: ["creator", node?.creatorId],
    queryFn: () => getCreator(node!.creatorId),
    enabled: !!node,
  });

  const activeTrend = trendsQuery.data?.find((t) => t.id === activeId);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 p-6">
      <PageHeader
        title="Trend Propagation"
        description="Reconstruct how a conversation travelled: who started it, which accounts amplified it, when it jumped platforms, and how deep the cascade ran."
        meta={
          <>
            <MetaItem label="Trend" value={activeTrend?.name ?? "—"} />
            <MetaItem label="Nodes" value={propQuery.data ? full(propQuery.data.nodes.length) : "—"} />
            <MetaItem label="Edges" value={propQuery.data ? full(propQuery.data.edges.length) : "—"} />
            <MetaItem label="Model" value="cascade-attrib v3.1" />
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <Select value={activeId ?? ""} onValueChange={(v) => { setTrendId(v); setSelected(null); }}>
              <SelectTrigger className="h-8 w-[260px] text-xs">
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
            <div className="flex items-center gap-0.5 rounded-sm border border-border bg-surface p-0.5">
              {LAYOUTS.map((l) => (
                <Button
                  key={l.id}
                  size="sm"
                  variant={layout === l.id ? "secondary" : "ghost"}
                  className="h-7 gap-1.5 px-2 text-[11px]"
                  onClick={() => setLayout(l.id)}
                >
                  <l.icon className="size-3.5" />
                  {l.label}
                </Button>
              ))}
            </div>
          </div>
        }
      />

      <AsyncBoundary query={propQuery} loadingLabel="Reconstructing cascade">
        {(g) => {
          const originNode = g.nodes.find((n) => n.id === g.origin.nodeId);
          return (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
              <div className="space-y-4 xl:col-span-3">
                <Panel className="flex h-[560px] flex-col">
                  <PanelHeader
                    title="Cascade graph"
                    subtitle="Node size encodes influence, colour encodes platform. Scroll to zoom, drag to pan, click to inspect."
                    actions={
                      <span className="num text-[11px] text-muted-foreground">
                        depth {g.metrics.depth} · {g.metrics.communities} communities
                      </span>
                    }
                  />
                  <NetworkGraph
                    nodes={g.nodes}
                    edges={g.edges}
                    layout={layout}
                    selectedId={selected}
                    onSelect={setSelected}
                    collapsed={collapsed}
                    onToggleCollapse={(id) =>
                      setCollapsed((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
                    }
                    className="min-h-0 flex-1"
                  />
                </Panel>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Panel>
                    <PanelHeader title="Origin attribution" subtitle="Earliest verifiable source and supporting evidence" />
                    <div className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-3 rounded-sm border border-primary/30 bg-primary/5 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">@{originNode?.handle}</p>
                          <p className="num mt-0.5 text-[11px] text-muted-foreground">
                            {compact(originNode?.followers ?? 0)} followers · first post {clockUTC(g.origin.earliestPost)} UTC
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {originNode && <PlatformBadge platform={originNode.platform} size="xs" />}
                          <span className="num rounded-sm bg-primary/15 px-1.5 py-0.5 text-[11px] text-primary">
                            {pct(g.origin.confidence * 100, 0)}
                          </span>
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {g.origin.evidence.map((e) => (
                          <li key={e} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-border-strong" />
                            {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Panel>

                  <Panel>
                    <PanelHeader title="Cross-platform migration" subtitle="Detected jumps between networks" />
                    <div className="space-y-2 p-4">
                      <div className="grid grid-cols-3 gap-3 border-b border-border pb-3">
                        <Metric label="Est. reach" value={compact(g.metrics.estimatedReach)} />
                        <Metric label="Cascade depth" value={String(g.metrics.depth)} />
                        <Metric label="Hops" value={String(g.metrics.crossPlatformHops.length)} />
                      </div>
                      {g.metrics.crossPlatformHops.map((h, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 py-1">
                          <div className="flex items-center gap-2">
                            <PlatformBadge platform={h.from} size="xs" />
                            <ArrowRight className="size-3 text-muted-foreground" />
                            <PlatformBadge platform={h.to} size="xs" />
                          </div>
                          <span className="num text-[11px] text-muted-foreground">{clockUTC(h.at)} UTC</span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
              </div>

              <Panel className="flex h-[560px] flex-col xl:sticky xl:top-6">
                <PanelHeader title="Event timeline" subtitle={`${g.timeline.length} events, chronological`} />
                <div className="min-h-0 flex-1 overflow-y-auto p-2">
                  <PropagationTimeline events={g.timeline} activeNodeId={selected} onSelect={setSelected} />
                </div>
              </Panel>
            </div>
          );
        }}
      </AsyncBoundary>

      <DetailDrawer
        open={!!node}
        onOpenChange={(o) => !o && setSelected(null)}
        eyebrow="Cascade node"
        title={node ? `@${node.handle}` : ""}
        subtitle={node ? `${node.origin ? "Origin account" : `Depth ${node.depth}`} · community ${node.community}` : ""}
      >
        {node && (
          <>
            <StatGrid
              items={[
                { label: "Platform", value: <PlatformBadge platform={node.platform} size="xs" /> },
                { label: "Followers", value: <span className="num">{full(node.followers)}</span> },
                { label: "Engagement", value: <span className="num">{compact(node.engagement)}</span> },
                { label: "Influence", value: <span className="num">{node.influence}</span> },
                { label: "Posted", value: <span className="num">{relative(node.timestamp)}</span> },
                { label: "Sentiment", value: <SentimentBadge value={node.sentiment === "positive" ? 0.5 : node.sentiment === "negative" ? -0.5 : 0} label={node.sentiment} /> },
              ]}
            />
            <DrawerSection title="Creator profile">
              {creatorQuery.data ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{creatorQuery.data.displayName}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{creatorQuery.data.bio}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {creatorQuery.data.topics.map((t) => (
                      <span key={t} className="rounded-sm border border-border bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Loading creator record…</p>
              )}
            </DrawerSection>
            <DrawerSection title="Downstream">
              <p className="text-xs leading-relaxed text-muted-foreground">
                This account is connected to{" "}
                <span className="num text-foreground">
                  {propQuery.data?.edges.filter((e) => e.source === node.id).length ?? 0}
                </span>{" "}
                downstream nodes. Collapse the subtree from the graph toolbar to simplify the view.
              </p>
            </DrawerSection>
            <Link
              to="/trends/$trendId"
              params={{ trendId: activeId ?? "" }}
              className="inline-flex text-xs text-primary hover:text-primary/80"
            >
              Open trend profile
            </Link>
          </>
        )}
      </DetailDrawer>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label-xs">{label}</p>
      <p className="num mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
