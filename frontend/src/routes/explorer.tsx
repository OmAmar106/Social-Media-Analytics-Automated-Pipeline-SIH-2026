import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { exportDataset, getContent, getCreators, queryDataExplorer, type ExplorerQuery } from "@/lib/api";
import { compact, full, relative } from "@/lib/format";
import { PLATFORM_META } from "@/lib/mock/dataset";
import { AsyncBoundary, MetaItem, PageHeader, Panel, PanelHeader } from "@/components/common/panel";
import { DataTable, type Column } from "@/components/common/data-table";
import { PlatformBadge, SentimentBadge } from "@/components/common/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ContentItem, PlatformId } from "@/lib/types";

export const Route = createFileRoute("/explorer")({
  head: () => ({
    meta: [
      { title: "Data Explorer — SIGNAL" },
      {
        name: "description",
        content: "Query the raw corpus with compound filters on platform, sentiment, topic, creator, engagement and virality.",
      },
      { property: "og:title", content: "Data Explorer — SIGNAL" },
      {
        property: "og:description",
        content: "Build compound queries over the raw document corpus and export the result set.",
      },
    ],
  }),
  component: ExplorerPage,
});

const DEFAULTS: ExplorerQuery = {
  platform: "all",
  sentiment: "all",
  topic: "all",
  keyword: "",
  creator: "all",
  minEngagement: 0,
  minVirality: 0,
};

function ExplorerPage() {
  const [draft, setDraft] = useState<ExplorerQuery>(DEFAULTS);
  const [applied, setApplied] = useState<ExplorerQuery>(DEFAULTS);
  const [exporting, setExporting] = useState(false);

  const allContent = useQuery({ queryKey: ["content", "all"], queryFn: () => getContent() });
  const creatorsQuery = useQuery({ queryKey: ["creators"], queryFn: getCreators });
  const results = useQuery({ queryKey: ["explorer", applied], queryFn: () => queryDataExplorer(applied) });

  const topics = useMemo(
    () => [...new Set((allContent.data ?? []).map((c) => c.topic))].sort(),
    [allContent.data],
  );
  const creatorById = useMemo(() => new Map((creatorsQuery.data ?? []).map((c) => [c.id, c])), [creatorsQuery.data]);

  const set = <K extends keyof ExplorerQuery>(key: K, value: ExplorerQuery[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const columns: Column<ContentItem>[] = [
    { key: "id", header: "ID", cell: (c) => <span className="num text-[11px] text-muted-foreground">{c.id}</span>, hideable: true },
    {
      key: "preview",
      header: "Document",
      width: "34%",
      cell: (c) => <p className="line-clamp-2 text-xs leading-relaxed text-foreground/90">{c.preview}</p>,
    },
    { key: "creator", header: "Creator", cell: (c) => <span className="num text-xs">@{creatorById.get(c.creatorId)?.handle ?? c.creatorId}</span> },
    { key: "platform", header: "Platform", cell: (c) => <PlatformBadge platform={c.platform} size="xs" /> },
    { key: "topic", header: "Topic", cell: (c) => <span className="text-xs text-muted-foreground">{c.topic}</span>, hideable: true },
    { key: "engagement", header: "Engagement", align: "right", sortValue: (c) => c.engagement, cell: (c) => <span className="num">{compact(c.engagement)}</span> },
    { key: "reach", header: "Reach", align: "right", sortValue: (c) => c.reach, cell: (c) => <span className="num">{compact(c.reach)}</span>, hideable: true },
    { key: "virality", header: "Virality", align: "right", sortValue: (c) => c.virality, cell: (c) => <span className="num">{c.virality}</span> },
    { key: "sentiment", header: "Sentiment", align: "right", sortValue: (c) => c.sentimentScore, cell: (c) => <SentimentBadge value={c.sentimentScore} label={c.sentiment} /> },
    {
      key: "timestamp",
      header: "Published",
      align: "right",
      sortValue: (c) => c.timestamp,
      cell: (c) => <span className="num text-[11px] text-muted-foreground">{relative(c.timestamp)}</span>,
    },
  ];

  const onExport = async () => {
    setExporting(true);
    try {
      const res = await exportDataset(applied);
      toast.success("Export ready", { description: `${full(results.data?.length ?? res.rows)} rows written to ${res.url}` });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-6">
      <PageHeader
        title="Data Explorer"
        description="Compose compound filters against the raw document corpus, inspect the result set, and export it for downstream analysis."
        meta={
          <>
            <MetaItem label="Corpus" value={`${full(allContent.data?.length ?? 0)} indexed documents`} />
            <MetaItem label="Matches" value={full(results.data?.length ?? 0)} />
            <MetaItem label="Latency" value="~260ms" />
          </>
        }
        actions={
          <Button size="sm" variant="secondary" className="h-8 gap-1.5 text-xs" onClick={onExport} disabled={exporting}>
            <Download className="size-3.5" />
            {exporting ? "Preparing…" : "Export CSV"}
          </Button>
        }
      />

      <Panel>
        <PanelHeader
          title="Query builder"
          subtitle="All conditions are combined with AND"
          actions={
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 px-2 text-[11px]"
              onClick={() => {
                setDraft(DEFAULTS);
                setApplied(DEFAULTS);
              }}
            >
              <RotateCcw className="size-3" /> Reset
            </Button>
          }
        />
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Keyword contains">
            <Input
              value={draft.keyword}
              onChange={(e) => set("keyword", e.target.value)}
              placeholder="e.g. subsidy"
              className="h-8 text-xs"
            />
          </Field>

          <Field label="Platform">
            <Select value={draft.platform} onValueChange={(v) => set("platform", v as PlatformId | "all")}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All platforms</SelectItem>
                {Object.entries(PLATFORM_META).map(([id, p]) => (
                  <SelectItem key={id} value={id} className="text-xs">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Sentiment">
            <Select value={draft.sentiment} onValueChange={(v) => set("sentiment", v as ExplorerQuery["sentiment"])}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["all", "positive", "neutral", "negative"].map((s) => (
                  <SelectItem key={s} value={s} className="text-xs capitalize">
                    {s === "all" ? "Any sentiment" : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Topic">
            <Select value={draft.topic} onValueChange={(v) => set("topic", v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All topics</SelectItem>
                {topics.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Creator">
            <Select value={draft.creator} onValueChange={(v) => set("creator", v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Any creator</SelectItem>
                {(creatorsQuery.data ?? []).slice(0, 40).map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    @{c.handle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label={`Min. engagement — ${compact(draft.minEngagement)}`}>
            <Slider
              value={[draft.minEngagement]}
              onValueChange={([v]) => set("minEngagement", v ?? 0)}
              min={0}
              max={200_000}
              step={5_000}
              className="mt-3"
            />
          </Field>

          <Field label={`Min. virality — ${draft.minVirality}`}>
            <Slider
              value={[draft.minVirality]}
              onValueChange={([v]) => set("minVirality", v ?? 0)}
              min={0}
              max={100}
              step={5}
              className="mt-3"
            />
          </Field>

          <div className="flex items-end">
            <Button size="sm" className="h-8 w-full text-xs" onClick={() => setApplied(draft)}>
              Run query
            </Button>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Result set"
          subtitle={`${full(results.data?.length ?? 0)} documents match the current query`}
        />
        <AsyncBoundary query={results} loadingLabel="Executing query">
          {(rows) => (
            <DataTable
              rows={rows}
              columns={columns}
              pageSize={15}
              dense
              searchFields={(c) => `${c.body} ${c.topic}`}
              searchPlaceholder="Refine within results…"
              initialSort={{ key: "engagement", dir: "desc" }}
            />
          )}
        </AsyncBoundary>
      </Panel>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="label-xs">{label}</Label>
      {children}
    </div>
  );
}
