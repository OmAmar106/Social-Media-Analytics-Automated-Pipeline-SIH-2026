/**
 * ============================================================================
 * SIGNAL — API SERVICE LAYER
 * ============================================================================
 * This is the ONLY place the application talks to "the backend". Every UI
 * component consumes these functions (through TanStack Query) and never calls
 * `fetch` directly.
 *
 * Right now every function resolves mock data from `src/lib/mock/dataset.ts`
 * after a small simulated latency. To connect the real backend, delete the mock
 * body and uncomment the `request(...)` call above it — the return shapes in
 * `src/lib/types.ts` are the contract.
 */
import {
  content,
  contentById,
  creatorById,
  creators,
  demographicsFor,
  keywords,
  kpis,
  platforms,
  propagationFor,
  scrapeState,
  sentimentSeries,
  trendById,
  trends,
} from "./mock/dataset";
import type {
  ChatResponse,
  ContentItem,
  Creator,
  Demographics,
  Keyword,
  Platform,
  PlatformId,
  PropagationGraph,
  ScrapeResult,
  Trend,
} from "./types";

export const API_BASE_URL = "/api";

/** Simulated network latency so loading states are exercised in development. */
const delay = (ms = 260) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Thin fetch wrapper kept ready for the real integration.
 * Unused while the service layer is mocked.
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${path}`);
  return (await res.json()) as T;
}

export interface GlobalFilters {
  platform?: PlatformId | "all";
  range?: string;
  search?: string;
}

/* -------------------------------------------------------------------------- */
/* Overview                                                                    */
/* -------------------------------------------------------------------------- */

export async function getOverviewKpis(_filters?: GlobalFilters) {
  // TODO: Replace mock data with:
  // return request<typeof kpis>(`/overview/kpis?platform=${_filters?.platform ?? "all"}`);
  await delay(180);
  return kpis;
}

export async function getSentimentSeries(_filters?: GlobalFilters) {
  // TODO: Replace mock data with:
  // return request<typeof sentimentSeries>('/sentiment/series');
  await delay(220);
  return sentimentSeries;
}

/* -------------------------------------------------------------------------- */
/* Trends                                                                      */
/* -------------------------------------------------------------------------- */

export async function getTrends(filters?: GlobalFilters): Promise<Trend[]> {
  // TODO: Replace mock data with:
  // return request<Trend[]>(`/trends?platform=${filters?.platform ?? "all"}&range=${filters?.range ?? "24h"}`);
  await delay(240);
  let rows = trends;
  if (filters?.platform && filters.platform !== "all") {
    rows = rows.filter((t) => t.platforms.includes(filters.platform as PlatformId));
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter((t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }
  return rows;
}

export async function getTrend(trendId: string): Promise<Trend> {
  // TODO: Replace mock data with:
  // return request<Trend>(`/trends/${trendId}`);
  await delay(200);
  const trend = trendById(trendId);
  if (!trend) throw new Error(`Trend "${trendId}" not found`);
  return trend;
}

/* -------------------------------------------------------------------------- */
/* Keywords                                                                    */
/* -------------------------------------------------------------------------- */

export async function getKeywords(filters?: GlobalFilters): Promise<Keyword[]> {
  // TODO: Replace mock data with:
  // return request<Keyword[]>('/keywords');
  await delay(230);
  if (filters?.platform && filters.platform !== "all") {
    return keywords.filter((k) => k.platforms.includes(filters.platform as PlatformId));
  }
  return keywords;
}

/* -------------------------------------------------------------------------- */
/* Sentiment                                                                   */
/* -------------------------------------------------------------------------- */

export async function getSentiment(_filters?: GlobalFilters) {
  // TODO: Replace mock data with:
  // return request('/sentiment');
  await delay(250);
  const byPlatform = platforms.map((p) => ({
    platform: p.id,
    ...p.sentiment,
    net: Number(((p.sentiment.positive - p.sentiment.negative) / 100).toFixed(2)),
  }));
  const byTrend = trends.map((t) => ({
    id: t.id,
    name: t.name,
    ...t.sentimentSplit,
    net: t.sentiment,
    posts: t.posts,
  }));
  const byCreator = [...creators]
    .sort((a, b) => b.influence - a.influence)
    .slice(0, 10)
    .map((c) => ({
      id: c.id,
      handle: c.handle,
      platform: c.platform,
      sentiment: c.sentiment,
      net: Number((c.sentiment === "positive" ? 0.42 : c.sentiment === "negative" ? -0.38 : 0.03).toFixed(2)),
      volume: c.posts,
    }));
  return { series: sentimentSeries, byPlatform, byTrend, byCreator };
}

/* -------------------------------------------------------------------------- */
/* Demographics                                                                */
/* -------------------------------------------------------------------------- */

export async function getDemographics(
  trendId: string,
  platform: PlatformId | "all",
): Promise<Demographics> {
  // TODO: Replace mock data with:
  // return request<Demographics>(`/demographics?trend=${trendId}&platform=${platform}`);
  await delay(280);
  return demographicsFor(trendId, platform);
}

/* -------------------------------------------------------------------------- */
/* Propagation                                                                 */
/* -------------------------------------------------------------------------- */

export async function getPropagation(trendId: string): Promise<PropagationGraph> {
  // TODO: Replace mock data with:
  // return request<PropagationGraph>(`/propagation/${trendId}`);
  await delay(320);
  return propagationFor(trendId);
}

/* -------------------------------------------------------------------------- */
/* Platforms                                                                   */
/* -------------------------------------------------------------------------- */

export async function getPlatformAnalytics(): Promise<Platform[]> {
  // TODO: Replace mock data with:
  // return request<Platform[]>('/platforms');
  await delay(200);
  return platforms;
}

export async function getPlatformMigrations() {
  // TODO: Replace mock data with:
  // return request('/platforms/migrations');
  await delay(200);
  return trends.slice(0, 8).map((t) => {
    const g = propagationFor(t.id);
    return {
      trendId: t.id,
      trend: t.name,
      path: [t.platforms[0]!, ...g.metrics.crossPlatformHops.map((h) => h.to)].slice(0, 4),
      hops: g.metrics.crossPlatformHops.length,
      reach: g.metrics.estimatedReach,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Content + creators                                                          */
/* -------------------------------------------------------------------------- */

export async function getContent(filters?: GlobalFilters): Promise<ContentItem[]> {
  // TODO: Replace mock data with:
  // return request<ContentItem[]>('/content');
  await delay(240);
  let rows = content;
  if (filters?.platform && filters.platform !== "all") {
    rows = rows.filter((c) => c.platform === filters.platform);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter((c) => c.body.toLowerCase().includes(q) || c.topic.toLowerCase().includes(q));
  }
  return rows;
}

export async function getContentItem(id: string): Promise<ContentItem> {
  // TODO: Replace mock data with:
  // return request<ContentItem>(`/content/${id}`);
  await delay(160);
  const item = contentById(id);
  if (!item) throw new Error(`Content "${id}" not found`);
  return item;
}

export async function getCreators(): Promise<Creator[]> {
  // TODO: Replace mock data with:
  // return request<Creator[]>('/creators');
  await delay(180);
  return creators;
}

export async function getCreator(id: string): Promise<Creator> {
  // TODO: Replace mock data with:
  // return request<Creator>(`/creators/${id}`);
  await delay(140);
  const c = creatorById(id);
  if (!c) throw new Error(`Creator "${id}" not found`);
  return c;
}

/* -------------------------------------------------------------------------- */
/* Data explorer                                                               */
/* -------------------------------------------------------------------------- */

export interface ExplorerQuery {
  platform: PlatformId | "all";
  sentiment: "all" | "positive" | "neutral" | "negative";
  topic: string;
  keyword: string;
  creator: string;
  minEngagement: number;
  minVirality: number;
}

export async function queryDataExplorer(q: Partial<ExplorerQuery>): Promise<ContentItem[]> {
  // TODO: Replace mock data with:
  // return request<ContentItem[]>('/explorer/query', { method: 'POST', body: JSON.stringify(q) });
  await delay(260);
  return content.filter((row) => {
    if (q.platform && q.platform !== "all" && row.platform !== q.platform) return false;
    if (q.sentiment && q.sentiment !== "all" && row.sentiment !== q.sentiment) return false;
    if (q.topic && q.topic !== "all" && row.topic !== q.topic) return false;
    if (q.keyword && !row.body.toLowerCase().includes(q.keyword.toLowerCase())) return false;
    if (q.creator && q.creator !== "all" && row.creatorId !== q.creator) return false;
    if (q.minEngagement && row.engagement < q.minEngagement) return false;
    if (q.minVirality && row.virality < q.minVirality) return false;
    return true;
  });
}

export async function exportDataset(_q: Partial<ExplorerQuery>): Promise<{ url: string; rows: number }> {
  // TODO: Replace mock implementation with:
  // return request('/explorer/export', { method: 'POST', body: JSON.stringify(_q) });
  await delay(900);
  return { url: "signal-export-2026-08-28.csv", rows: content.length };
}

/* -------------------------------------------------------------------------- */
/* Scraping                                                                    */
/* -------------------------------------------------------------------------- */

export async function getScrapeStatus() {
  // TODO: Replace mock data with:
  // return request('/scrape/status');
  await delay(120);
  return scrapeState;
}

export async function triggerScrape(
  onProgress?: (pct: number, stage: string) => void,
): Promise<ScrapeResult> {
  // TODO: Replace mock implementation with:
  // return request<ScrapeResult>('/scrape', { method: 'POST' });
  const stages = [
    "Authenticating collectors",
    "Fetching X timeline shards",
    "Fetching Reddit listings",
    "Fetching YouTube metadata",
    "Fetching Telegram channels",
    "Deduplicating documents",
    "Running sentiment inference",
    "Recomputing trend clusters",
  ];
  for (let i = 0; i < stages.length; i++) {
    await delay(340 + i * 40);
    onProgress?.(Math.round(((i + 1) / stages.length) * 100), stages[i]!);
  }
  return {
    completedAt: new Date().toISOString(),
    newPosts: 14_281,
    newTrends: 327,
    platforms: [
      { platform: "x", posts: 6_142 },
      { platform: "reddit", posts: 2_884 },
      { platform: "youtube", posts: 1_209 },
      { platform: "telegram", posts: 2_461 },
      { platform: "instagram", posts: 934 },
      { platform: "facebook", posts: 651 },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* Chatbot                                                                     */
/* -------------------------------------------------------------------------- */

export interface ChatContext {
  platform: PlatformId | "all";
  range: string;
  topic: string;
}

export async function sendChatMessage(message: string, ctx: ChatContext): Promise<ChatResponse> {
  // TODO: Replace mock implementation with:
  // return request<ChatResponse>('/chat', {
  //   method: 'POST',
  //   body: JSON.stringify({ message, context: ctx }),
  // });
  await delay(700 + Math.random() * 600);

  const q = message.toLowerCase();
  const topTrends = [...trends].sort((a, b) => b.growth - a.growth).slice(0, 3);
  const topicTrend = trends.find((t) => t.name === ctx.topic) ?? topTrends[0]!;
  const graph = propagationFor(topicTrend.id);
  const originNode = graph.nodes.find((n) => n.id === graph.origin.nodeId)!;
  const fmt = (n: number) => n.toLocaleString("en-US");

  const scoped = `Scope: ${ctx.platform === "all" ? "all platforms" : ctx.platform.toUpperCase()} · ${ctx.range} · ${ctx.topic}`;

  if (q.includes("origin") || q.includes("start")) {
    return {
      id: crypto.randomUUID(),
      answer: `Earliest matching post for **${topicTrend.name}** is attributed to **@${originNode.handle}** on ${originNode.platform.toUpperCase()}, ${new Date(originNode.timestamp).toUTCString().slice(17, 22)} UTC, with ${Math.round(graph.origin.confidence * 100)}% attribution confidence.\n\nNo matching n-gram cluster appears in the 6-hour lookback window before that post. ${graph.edges.filter((e) => e.source === originNode.id).length} first-degree amplifications followed within 90 minutes, and the cascade reached depth ${graph.metrics.depth} across ${graph.metrics.communities} communities.\n\n${scoped}`,
      citations: [
        { label: "Origin account", value: `@${originNode.handle}` },
        { label: "Confidence", value: `${Math.round(graph.origin.confidence * 100)}%` },
        { label: "Estimated reach", value: fmt(graph.metrics.estimatedReach) },
      ],
      followUps: [
        "Which users amplified it the most?",
        "Did it cross platforms?",
        "What is the sentiment trajectory?",
      ],
    };
  }

  if (q.includes("spread") || q.includes("responsible") || q.includes("influence") || q.includes("creators")) {
    const top = [...graph.nodes].sort((a, b) => b.influence - a.influence).slice(0, 4);
    return {
      id: crypto.randomUUID(),
      answer: `Four accounts carry most of the propagation weight for **${topicTrend.name}**:\n\n${top
        .map(
          (n, i) =>
            `${i + 1}. **@${n.handle}** — ${n.platform.toUpperCase()} · ${fmt(n.followers)} followers · influence ${n.influence} · depth ${n.depth}`,
        )
        .join(
          "\n",
        )}\n\nRemoving the top two from the cascade model reduces estimated reach by roughly 46%, which suggests a concentrated rather than organic diffusion pattern.\n\n${scoped}`,
      citations: top.slice(0, 3).map((n) => ({ label: "Account", value: `@${n.handle}` })),
      followUps: ["Where did this trend originate?", "Show me the propagation depth", "Compare sentiment on X and YouTube."],
    };
  }

  if (q.includes("sentiment")) {
    const t = topicTrend;
    const x = platforms.find((p) => p.id === "x")!;
    const yt = platforms.find((p) => p.id === "youtube")!;
    if (q.includes("compare") || q.includes("youtube")) {
      return {
        id: crypto.randomUUID(),
        answer: `Sentiment split, ${ctx.range}:\n\n**X** — ${x.sentiment.positive}% positive / ${x.sentiment.neutral}% neutral / ${x.sentiment.negative}% negative (net ${((x.sentiment.positive - x.sentiment.negative) / 100).toFixed(2)})\n**YouTube** — ${yt.sentiment.positive}% positive / ${yt.sentiment.neutral}% neutral / ${yt.sentiment.negative}% negative (net ${((yt.sentiment.positive - yt.sentiment.negative) / 100).toFixed(2)})\n\nYouTube runs ${yt.sentiment.positive - x.sentiment.positive} points more positive, largely because long-form explainer content attracts lower-conflict replies. X carries the adversarial reply networks.\n\n${scoped}`,
        citations: [
          { label: "X net sentiment", value: ((x.sentiment.positive - x.sentiment.negative) / 100).toFixed(2) },
          { label: "YouTube net sentiment", value: ((yt.sentiment.positive - yt.sentiment.negative) / 100).toFixed(2) },
        ],
        followUps: ["Why is sentiment becoming negative?", "Which demographic drives negativity?", "Show sentiment by trend."],
      };
    }
    return {
      id: crypto.randomUUID(),
      answer: `**${t.name}** currently sits at net sentiment ${t.sentiment.toFixed(2)} (${t.sentimentSplit.positive}% positive / ${t.sentimentSplit.neutral}% neutral / ${t.sentimentSplit.negative}% negative).\n\nNegative share rose most sharply in the 4 hours following the announcement window, concentrated in reply threads under three high-follower accounts. Positive share is stable in long-form contexts, so the shift is driven by reply volume rather than by a change in original posting.\n\n${scoped}`,
      citations: [
        { label: "Net sentiment", value: t.sentiment.toFixed(2) },
        { label: "Negative share", value: `${t.sentimentSplit.negative}%` },
        { label: "Posts in window", value: fmt(t.posts) },
      ],
      followUps: ["Compare sentiment on X and YouTube.", "Which creators drive the negative share?", "What changed in the last 12 hours?"],
    };
  }

  if (q.includes("platform") && (q.includes("driving") || q.includes("which"))) {
    const lead = [...platforms].sort((a, b) => b.growth - a.growth)[0]!;
    return {
      id: crypto.randomUUID(),
      answer: `**${lead.name}** is driving the conversation right now: ${fmt(lead.posts)} posts, ${lead.growth > 0 ? "+" : ""}${lead.growth}% volume change and ${fmt(lead.activeUsers)} active accounts in the window.\n\nSecondary volume is on X, but X has the higher engagement per post (${platforms.find((p) => p.id === "x")!.avgEngagement} vs ${lead.avgEngagement}), so X remains the amplification surface even where origination happens elsewhere.\n\n${scoped}`,
      citations: [
        { label: "Lead platform", value: lead.name },
        { label: "Volume change", value: `${lead.growth}%` },
      ],
      followUps: ["How do trends move between platforms?", "Show cross-platform migration paths", "Which creators have the highest influence?"],
    };
  }

  if (q.includes("12 hours") || q.includes("changed") || q.includes("last")) {
    return {
      id: crypto.randomUUID(),
      answer: `Three material changes in the last 12 hours:\n\n1. **${topTrends[0]!.name}** accelerated to +${topTrends[0]!.growth}% with velocity ${topTrends[0]!.velocity} mentions/hr — the largest single-trend move in the window.\n2. **${topTrends[1]!.name}** crossed into a second platform, adding ${fmt(Math.round(topTrends[1]!.posts * 0.22))} posts outside its origin surface.\n3. Aggregate sentiment index moved from −0.06 to −0.12, driven mostly by reply-level negativity rather than original posts.\n\n${scoped}`,
      citations: topTrends.slice(0, 3).map((t) => ({ label: t.name, value: `${t.growth > 0 ? "+" : ""}${t.growth}%` })),
      followUps: ["Why did sentiment drop?", "What are the fastest growing trends today?", "Which platform is driving this?"],
    };
  }

  return {
    id: crypto.randomUUID(),
    answer: `Fastest-growing trends in the current window:\n\n${topTrends
      .map(
        (t, i) =>
          `${i + 1}. **${t.name}** (${t.category}) — ${t.growth > 0 ? "+" : ""}${t.growth}% · ${fmt(t.posts)} posts · velocity ${t.velocity}/hr · net sentiment ${t.sentiment.toFixed(2)}`,
      )
      .join(
        "\n",
      )}\n\n${topTrends[0]!.summary}\n\n${scoped}`,
    citations: topTrends.map((t) => ({ label: t.name, value: `${t.growth > 0 ? "+" : ""}${t.growth}%` })),
    followUps: [
      "Where did this trend originate?",
      "Which users were responsible for spreading it?",
      "Compare sentiment on X and YouTube.",
    ],
  };
}
