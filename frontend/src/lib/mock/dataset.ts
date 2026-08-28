/**
 * Centralized mock dataset for the SIGNAL intelligence platform.
 *
 * Everything here is deterministic (seeded PRNG + fixed base timestamp) so the
 * server-rendered markup matches the client render. When the real backend is
 * wired up, this whole module goes away and `src/lib/api.ts` starts calling the
 * live endpoints instead.
 */
import type {
  ContentItem,
  Creator,
  Demographics,
  Keyword,
  Platform,
  PlatformId,
  PropagationEdge,
  PropagationGraph,
  PropagationNode,
  Sentiment,
  SeriesPoint,
  Trend,
  TrendStatus,
} from "../types";

/** Fixed "now" for the mock corpus — keeps SSR and client output identical. */
export const NOW = new Date("2026-08-28T18:00:00Z");

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry(20260828);
const pick = <T,>(arr: readonly T[], r = rnd()) => arr[Math.floor(r * arr.length) % arr.length]!;
const between = (min: number, max: number) => min + rnd() * (max - min);
const int = (min: number, max: number) => Math.round(between(min, max));

export function minutesAgo(m: number) {
  return new Date(NOW.getTime() - m * 60_000).toISOString();
}
export function hoursAgo(h: number) {
  return minutesAgo(h * 60);
}

export const PLATFORM_META: Record<PlatformId, { name: string; short: string; color: string }> = {
  x: { name: "X", short: "X", color: "var(--chart-1)" },
  youtube: { name: "YouTube", short: "YT", color: "var(--chart-4)" },
  facebook: { name: "Facebook", short: "FB", color: "var(--chart-5)" },
  telegram: { name: "Telegram", short: "TG", color: "var(--chart-2)" },
  reddit: { name: "Reddit", short: "RD", color: "var(--chart-3)" },
  instagram: { name: "Instagram", short: "IG", color: "var(--chart-6)" },
};

export const PLATFORM_IDS = Object.keys(PLATFORM_META) as PlatformId[];

export const platforms: Platform[] = [
  {
    id: "x",
    name: "X",
    short: "X",
    posts: 1_842_119,
    engagement: 24_318_402,
    growth: 12.4,
    activeUsers: 412_800,
    avgEngagement: 13.2,
    sentiment: { positive: 31, neutral: 44, negative: 25 },
    topTopics: ["AI Regulation", "Election Debate", "Semiconductor Supply"],
    viralContentCount: 1_284,
  },
  {
    id: "reddit",
    name: "Reddit",
    short: "RD",
    posts: 486_302,
    engagement: 9_114_880,
    growth: 8.1,
    activeUsers: 158_400,
    avgEngagement: 18.7,
    sentiment: { positive: 28, neutral: 47, negative: 25 },
    topTopics: ["Open Source Models", "GPU Pricing", "Remote Work Policy"],
    viralContentCount: 612,
  },
  {
    id: "youtube",
    name: "YouTube",
    short: "YT",
    posts: 214_557,
    engagement: 18_902_331,
    growth: 6.9,
    activeUsers: 96_200,
    avgEngagement: 88.1,
    sentiment: { positive: 41, neutral: 40, negative: 19 },
    topTopics: ["New Smartphone Launch", "Space Launch", "Creator Economy"],
    viralContentCount: 388,
  },
  {
    id: "telegram",
    name: "Telegram",
    short: "TG",
    posts: 731_044,
    engagement: 5_612_775,
    growth: 21.7,
    activeUsers: 204_100,
    avgEngagement: 7.7,
    sentiment: { positive: 22, neutral: 49, negative: 29 },
    topTopics: ["Election Debate", "Crypto Custody Rules", "Energy Prices"],
    viralContentCount: 501,
  },
  {
    id: "instagram",
    name: "Instagram",
    short: "IG",
    posts: 398_770,
    engagement: 21_440_918,
    growth: 4.2,
    activeUsers: 187_600,
    avgEngagement: 53.8,
    sentiment: { positive: 48, neutral: 38, negative: 14 },
    topTopics: ["New Smartphone Launch", "Climate Policy", "Retail Layoffs"],
    viralContentCount: 447,
  },
  {
    id: "facebook",
    name: "Facebook",
    short: "FB",
    posts: 522_918,
    engagement: 11_204_663,
    growth: -2.6,
    activeUsers: 143_900,
    avgEngagement: 21.4,
    sentiment: { positive: 34, neutral: 43, negative: 23 },
    topTopics: ["Climate Policy", "Election Debate", "Healthcare Costs"],
    viralContentCount: 259,
  },
];

const TREND_SEEDS: {
  name: string;
  category: string;
  status: TrendStatus;
  platforms: PlatformId[];
  summary: string;
}[] = [
  {
    name: "AI Regulation",
    category: "Policy",
    status: "surging",
    platforms: ["x", "reddit", "youtube", "telegram"],
    summary:
      "Draft compliance timelines for frontier-model providers pulled policy analysts, founders and civil-society accounts into a single thread of debate.",
  },
  {
    name: "Open Source Models",
    category: "Technology",
    status: "rising",
    platforms: ["reddit", "x", "youtube"],
    summary:
      "A permissively licensed 70B release triggered benchmark reruns and self-hosting guides across developer communities.",
  },
  {
    name: "Election Debate",
    category: "Politics",
    status: "surging",
    platforms: ["x", "facebook", "telegram", "youtube"],
    summary:
      "Post-debate clip fragments are being recirculated with competing captions, producing sharply polarised reply networks.",
  },
  {
    name: "Semiconductor Supply",
    category: "Markets",
    status: "steady",
    platforms: ["x", "reddit", "telegram"],
    summary:
      "Fab capacity guidance and export-control commentary keep a durable, low-volatility conversation among industry accounts.",
  },
  {
    name: "Space Launch",
    category: "Science",
    status: "cooling",
    platforms: ["youtube", "x", "instagram"],
    summary:
      "Launch-window coverage peaked during the broadcast and is now decaying into highlight reposts.",
  },
  {
    name: "Climate Policy",
    category: "Policy",
    status: "rising",
    platforms: ["facebook", "x", "instagram", "reddit"],
    summary:
      "Regional adaptation funding announcements are driving locally clustered discussion with strong civic engagement.",
  },
  {
    name: "New Smartphone Launch",
    category: "Consumer Tech",
    status: "surging",
    platforms: ["youtube", "instagram", "x"],
    summary:
      "Hands-on embargo lift produced a synchronised burst of review content and camera comparisons.",
  },
  {
    name: "GPU Pricing",
    category: "Markets",
    status: "rising",
    platforms: ["reddit", "x", "telegram"],
    summary:
      "Retail availability screenshots and scalper reports are fuelling sustained frustration in hardware communities.",
  },
  {
    name: "Creator Economy Payouts",
    category: "Media",
    status: "steady",
    platforms: ["youtube", "x", "instagram"],
    summary:
      "Revised revenue-share tiers prompted creators to publish earnings breakdowns and platform comparisons.",
  },
  {
    name: "Remote Work Policy",
    category: "Labor",
    status: "cooling",
    platforms: ["reddit", "facebook", "x"],
    summary:
      "Return-to-office mandates continue to generate anonymised employee accounts, though volume is easing.",
  },
  {
    name: "Crypto Custody Rules",
    category: "Finance",
    status: "rising",
    platforms: ["telegram", "x", "reddit"],
    summary:
      "Custody-segregation guidance triggered exchange statements and rapid rumour propagation in trading channels.",
  },
  {
    name: "Healthcare Costs",
    category: "Policy",
    status: "steady",
    platforms: ["facebook", "x", "reddit"],
    summary:
      "Insurance premium notices are being shared as personal testimony, producing high-empathy engagement.",
  },
  {
    name: "Energy Prices",
    category: "Markets",
    status: "declining",
    platforms: ["telegram", "facebook", "x"],
    summary:
      "Wholesale price relief has reduced volume, but regional pockets remain highly negative.",
  },
  {
    name: "Retail Layoffs",
    category: "Labor",
    status: "rising",
    platforms: ["x", "facebook", "instagram"],
    summary:
      "Store-closure lists are circulating faster than official confirmations, creating verification gaps.",
  },
  {
    name: "Sports Transfer Window",
    category: "Sports",
    status: "surging",
    platforms: ["x", "instagram", "youtube", "telegram"],
    summary:
      "Deadline-day rumour velocity is the highest recorded this quarter, dominated by aggregator accounts.",
  },
  {
    name: "Streaming Price Hike",
    category: "Media",
    status: "cooling",
    platforms: ["reddit", "x", "facebook"],
    summary:
      "Subscription increase announcements drove a short cancellation-intent spike now returning to baseline.",
  },
  {
    name: "Quantum Error Correction",
    category: "Science",
    status: "rising",
    platforms: ["x", "reddit", "youtube"],
    summary:
      "A logical-qubit milestone paper is being translated for general audiences by science communicators.",
  },
];

const STATUS_GROWTH: Record<TrendStatus, [number, number]> = {
  surging: [64, 212],
  rising: [18, 58],
  steady: [-4, 12],
  cooling: [-26, -6],
  declining: [-58, -28],
};

function buildSeries(points: number, base: number, growth: number, stepMinutes: number): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const progress = (points - 1 - i) / (points - 1);
    const shape = 1 + (growth / 100) * progress;
    const wobble = 0.86 + rnd() * 0.3;
    const mentions = Math.max(40, Math.round(base * shape * wobble));
    out.push({
      t: minutesAgo(i * stepMinutes),
      mentions,
      engagement: Math.round(mentions * between(4.2, 11.5)),
      creators: Math.round(mentions * between(0.14, 0.31)),
      sentiment: Number((between(-0.45, 0.55) * (1 - progress * 0.3)).toFixed(3)),
    });
  }
  return out;
}

export const trends: Trend[] = TREND_SEEDS.map((seed, i) => {
  const [gLo, gHi] = STATUS_GROWTH[seed.status];
  const growth = Number(between(gLo, gHi).toFixed(1));
  const posts = int(4_200, 148_000);
  const series = buildSeries(48, posts / 90, growth, 30);
  const positive = int(14, 52);
  const negative = int(10, 100 - positive - 20);
  const neutral = 100 - positive - negative;
  const platformBreakdown = seed.platforms.map((p, idx) => {
    const share = (seed.platforms.length - idx) / ((seed.platforms.length * (seed.platforms.length + 1)) / 2);
    const mentions = Math.round(posts * share * between(0.85, 1.15));
    return {
      platform: p,
      mentions,
      engagement: Math.round(mentions * between(5, 14)),
      sentiment: Number(between(-0.5, 0.6).toFixed(2)),
    };
  });
  return {
    id: seed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: seed.name,
    category: seed.category,
    status: seed.status,
    growth,
    velocity: Number(between(12, 940).toFixed(0)),
    posts,
    engagement: Math.round(posts * between(6, 16)),
    sentiment: Number(((positive - negative) / 100).toFixed(2)),
    sentimentSplit: { positive, neutral, negative },
    firstDetected: hoursAgo(int(6, 96)),
    peakActivity: hoursAgo(int(1, 20)),
    platforms: seed.platforms,
    creators: int(320, 22_400),
    summary: seed.summary,
    series,
    platformBreakdown,
    sparkline: series.slice(-16).map((s) => s.mentions),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ...(i === -1 ? {} : {}),
  };
});

export const trendById = (id: string) => trends.find((t) => t.id === id);

const KEYWORD_SEEDS: { term: string; cluster: string; related: string[] }[] = [
  { term: "frontier model", cluster: "AI", related: ["compute threshold", "safety audit", "model card"] },
  { term: "compliance deadline", cluster: "AI", related: ["frontier model", "policy draft", "enforcement"] },
  { term: "safety audit", cluster: "AI", related: ["frontier model", "red team", "evals"] },
  { term: "open weights", cluster: "AI", related: ["fine-tune", "license", "self-host"] },
  { term: "fine-tune", cluster: "AI", related: ["open weights", "LoRA", "dataset"] },
  { term: "self-host", cluster: "AI", related: ["open weights", "inference cost", "vram"] },
  { term: "inference cost", cluster: "AI", related: ["self-host", "gpu shortage", "token price"] },
  { term: "gpu shortage", cluster: "Hardware", related: ["fab capacity", "inference cost", "scalping"] },
  { term: "fab capacity", cluster: "Hardware", related: ["gpu shortage", "export controls", "yield"] },
  { term: "export controls", cluster: "Hardware", related: ["fab capacity", "policy draft", "tariff"] },
  { term: "debate clip", cluster: "Politics", related: ["fact check", "turnout", "poll swing"] },
  { term: "fact check", cluster: "Politics", related: ["debate clip", "misinformation", "correction"] },
  { term: "poll swing", cluster: "Politics", related: ["turnout", "debate clip", "battleground"] },
  { term: "turnout", cluster: "Politics", related: ["poll swing", "ballot access", "battleground"] },
  { term: "misinformation", cluster: "Politics", related: ["fact check", "bot network", "amplification"] },
  { term: "bot network", cluster: "Integrity", related: ["amplification", "misinformation", "coordinated"] },
  { term: "amplification", cluster: "Integrity", related: ["bot network", "reach", "coordinated"] },
  { term: "coordinated", cluster: "Integrity", related: ["bot network", "amplification", "brigading"] },
  { term: "carbon budget", cluster: "Climate", related: ["adaptation fund", "emissions cap", "net zero"] },
  { term: "adaptation fund", cluster: "Climate", related: ["carbon budget", "flood risk", "grid"] },
  { term: "flood risk", cluster: "Climate", related: ["adaptation fund", "insurance", "resilience"] },
  { term: "grid", cluster: "Energy", related: ["outage", "capacity market", "renewables"] },
  { term: "capacity market", cluster: "Energy", related: ["grid", "wholesale price", "renewables"] },
  { term: "wholesale price", cluster: "Energy", related: ["capacity market", "bill relief", "outage"] },
  { term: "camera sensor", cluster: "Consumer", related: ["battery life", "teardown", "benchmark"] },
  { term: "battery life", cluster: "Consumer", related: ["camera sensor", "charging", "teardown"] },
  { term: "teardown", cluster: "Consumer", related: ["camera sensor", "repairability", "benchmark"] },
  { term: "benchmark", cluster: "Consumer", related: ["teardown", "thermals", "battery life"] },
  { term: "custody rules", cluster: "Finance", related: ["segregation", "exchange proof", "audit"] },
  { term: "exchange proof", cluster: "Finance", related: ["custody rules", "reserves", "audit"] },
  { term: "layoff list", cluster: "Labor", related: ["severance", "hiring freeze", "store closure"] },
  { term: "return to office", cluster: "Labor", related: ["hybrid", "attrition", "commute"] },
  { term: "transfer deadline", cluster: "Sports", related: ["medical", "release clause", "loan deal"] },
  { term: "release clause", cluster: "Sports", related: ["transfer deadline", "agent fee", "medical"] },
];

export const keywords: Keyword[] = KEYWORD_SEEDS.map((k, i) => {
  const volume = int(1_800, 96_000);
  const growth = Number(between(-38, 260).toFixed(1));
  const series = Array.from({ length: 24 }, (_, j) => {
    const p = j / 23;
    return Math.max(30, Math.round((volume / 26) * (1 + (growth / 100) * p) * (0.85 + rnd() * 0.3)));
  });
  return {
    id: `kw-${i + 1}`,
    term: k.term,
    volume,
    growth,
    velocity: int(8, 1_240),
    sentiment: Number(between(-0.7, 0.7).toFixed(2)),
    engagement: Math.round(volume * between(3, 12)),
    platforms: PLATFORM_IDS.filter(() => rnd() > 0.45).slice(0, 4).length
      ? PLATFORM_IDS.filter((_, idx) => (i + idx) % 3 !== 2).slice(0, int(2, 4))
      : ["x"],
    firstDetected: hoursAgo(int(2, 120)),
    related: k.related,
    cluster: k.cluster,
    series,
  };
});

const HANDLE_SEEDS: { handle: string; name: string; platform: PlatformId; bio: string; topics: string[] }[] = [
  { handle: "policy_ledger", name: "Policy Ledger", platform: "x", bio: "Regulatory tracking for emerging tech. Weekly briefs.", topics: ["AI Regulation", "Climate Policy"] },
  { handle: "m_okonkwo", name: "Maya Okonkwo", platform: "x", bio: "Tech policy correspondent. Formerly standards desk.", topics: ["AI Regulation", "Semiconductor Supply"] },
  { handle: "the_eval_desk", name: "The Eval Desk", platform: "x", bio: "Model evaluations, benchmarks, reproducibility notes.", topics: ["Open Source Models"] },
  { handle: "kernelpanic_dev", name: "kernelpanic", platform: "reddit", bio: "r/LocalInference moderator. Self-hosting write-ups.", topics: ["Open Source Models", "GPU Pricing"] },
  { handle: "silicon_notes", name: "Silicon Notes", platform: "x", bio: "Fab capacity, yields, supply chain analysis.", topics: ["Semiconductor Supply"] },
  { handle: "ravi_bhatt", name: "Ravi Bhatt", platform: "youtube", bio: "Long-form explainers on hardware economics.", topics: ["GPU Pricing", "Semiconductor Supply"] },
  { handle: "civic_signal", name: "Civic Signal", platform: "facebook", bio: "Local government coverage and civic data.", topics: ["Election Debate", "Climate Policy"] },
  { handle: "debate_room", name: "Debate Room", platform: "telegram", bio: "Unaffiliated clip archive and discussion channel.", topics: ["Election Debate"] },
  { handle: "l_fernandes", name: "Lucia Fernandes", platform: "instagram", bio: "Visual storytelling on climate adaptation.", topics: ["Climate Policy"] },
  { handle: "orbital_brief", name: "Orbital Brief", platform: "youtube", bio: "Launch coverage, mission recaps, flight data.", topics: ["Space Launch"] },
  { handle: "handset_lab", name: "Handset Lab", platform: "youtube", bio: "Controlled device testing. No sponsored reviews.", topics: ["New Smartphone Launch"] },
  { handle: "a_novak", name: "Anna Novak", platform: "instagram", bio: "Product photography and hands-on first looks.", topics: ["New Smartphone Launch"] },
  { handle: "market_undertow", name: "Market Undertow", platform: "telegram", bio: "Macro and commodity flow notes. Not advice.", topics: ["Energy Prices", "Crypto Custody Rules"] },
  { handle: "ledger_counsel", name: "Ledger Counsel", platform: "x", bio: "Financial regulation, custody and compliance.", topics: ["Crypto Custody Rules"] },
  { handle: "j_whitfield", name: "James Whitfield", platform: "reddit", bio: "r/WorkReform contributor. Labour data threads.", topics: ["Remote Work Policy", "Retail Layoffs"] },
  { handle: "shift_report", name: "Shift Report", platform: "x", bio: "Retail and logistics workforce reporting.", topics: ["Retail Layoffs"] },
  { handle: "care_costs", name: "Care Costs Project", platform: "facebook", bio: "Documenting healthcare pricing experiences.", topics: ["Healthcare Costs"] },
  { handle: "streamwatch", name: "Streamwatch", platform: "reddit", bio: "Subscription pricing tracker and archive.", topics: ["Streaming Price Hike"] },
  { handle: "t_ibrahim", name: "Tariq Ibrahim", platform: "x", bio: "Transfer news aggregation. Tier-1 sources only.", topics: ["Sports Transfer Window"] },
  { handle: "qubit_review", name: "Qubit Review", platform: "youtube", bio: "Quantum computing research, explained slowly.", topics: ["Quantum Error Correction"] },
  { handle: "grid_operator", name: "Grid Operator Notes", platform: "telegram", bio: "Wholesale energy market commentary.", topics: ["Energy Prices"] },
  { handle: "s_marchetti", name: "Sofia Marchetti", platform: "x", bio: "Creator economy analyst. Payout data archive.", topics: ["Creator Economy Payouts"] },
  { handle: "openweights_org", name: "OpenWeights Collective", platform: "reddit", bio: "Community releases and license tracking.", topics: ["Open Source Models"] },
  { handle: "d_park", name: "Daniel Park", platform: "x", bio: "Infrastructure engineer. Inference cost breakdowns.", topics: ["Open Source Models", "GPU Pricing"] },
];

export const creators: Creator[] = HANDLE_SEEDS.map((c, i) => ({
  id: `cr-${i + 1}`,
  handle: c.handle,
  displayName: c.name,
  platform: c.platform,
  followers: int(4_200, 2_400_000),
  engagementRate: Number(between(0.6, 9.4).toFixed(2)),
  influence: Number(between(31, 98).toFixed(1)),
  sentiment: (["positive", "neutral", "negative"] as Sentiment[])[i % 3]!,
  bio: c.bio,
  posts: int(48, 4_800),
  topics: c.topics,
  verified: i % 3 !== 1,
}));

export const creatorById = (id: string) => creators.find((c) => c.id === id);
export const creatorByHandle = (handle: string) => creators.find((c) => c.handle === handle);

const CONTENT_TEMPLATES: Record<string, string[]> = {
  "AI Regulation": [
    "The 18-month compliance window only applies above the compute threshold. Everyone below it is still covered by the transparency clause — that distinction is getting lost in the coverage.",
    "Read the annex, not the summary. Audit obligations kick in at deployment, not training, which changes the cost model completely for smaller labs.",
    "Three separate drafts are circulating and people are quoting whichever one supports their position. Here is a side-by-side of what actually differs.",
  ],
  "Open Source Models": [
    "Reran the benchmark suite on the new open weights release with fixed seeds. Reasoning scores hold up; long-context retrieval drops off after 64k.",
    "Self-hosting cost breakdown: two consumer cards get you interactive latency at batch size 1. Anything beyond that and rental economics win.",
    "The license is permissive but the acceptable-use appendix is not. Worth reading before you build a product on it.",
  ],
  "Election Debate": [
    "The clip circulating without the preceding 40 seconds inverts the meaning of the answer. Full transcript section is linked below.",
    "Turnout modelling from the last three cycles suggests debate-night movement decays within nine days. Treat tonight's polling with caution.",
    "Same 14-second segment, four different captions, three different framings. Coordinated or just convergent — worth measuring.",
  ],
  "Semiconductor Supply": [
    "Capacity guidance revised down again for advanced packaging. That is the actual bottleneck, not wafer starts.",
    "Export control expansion covers the tooling, not just the chips. Second-order effects on maintenance contracts are underdiscussed.",
  ],
  "Space Launch": [
    "Clean insertion, telemetry nominal through second stage cutoff. Recovery vessel confirmed on station.",
    "Launch window slipped 46 minutes on upper-level winds. Full flight profile and timestamps in the description.",
  ],
  "Climate Policy": [
    "Adaptation funding is allocated per-region but the flood risk mapping it relies on has not been updated since 2019.",
    "Three council areas received under 4% of the fund while holding 22% of the modelled risk. Data and methodology attached.",
  ],
  "New Smartphone Launch": [
    "Controlled lighting comparison across three generations. Sensor gain is real but the processing is doing most of the work.",
    "Battery test under identical load: 11h 40m screen-on. Thermals throttle at minute 38 in sustained capture.",
  ],
  "GPU Pricing": [
    "Retail listings up 14% week over week with no supply change. Third-party sellers now hold most of the inventory.",
    "Availability tracker for the last 30 days across six retailers. Restocks last under four minutes on average.",
  ],
  "Creator Economy Payouts": [
    "Published my full payout breakdown for the quarter. RPM fell 9% while watch time rose — the tier revision explains most of it.",
  ],
  "Remote Work Policy": [
    "Mandate went from three days to four with two weeks' notice. Attrition in my team is now the highest it has been.",
  ],
  "Crypto Custody Rules": [
    "Segregation requirement means commingled hot wallets need restructuring before the deadline. Most mid-tier venues are not ready.",
  ],
  "Healthcare Costs": [
    "Premium notice arrived: 19% increase, same coverage, higher deductible. Posting the itemised comparison.",
  ],
  "Energy Prices": [
    "Wholesale down 31% from peak but retail tariffs have not moved. The lag is contractual, not market driven.",
  ],
  "Retail Layoffs": [
    "Closure list circulating is partially wrong — two of those locations have signed leases through 2028. Verify before resharing.",
  ],
  "Sports Transfer Window": [
    "Medical scheduled for tomorrow morning. Fee structure is base plus appearance-based add-ons, not the figure being reported.",
  ],
  "Streaming Price Hike": [
    "Cancellation intent spiked for 48 hours then returned to baseline. Same pattern as the previous two increases.",
  ],
  "Quantum Error Correction": [
    "The logical qubit result is significant but the overhead ratio is still the story. Here is what the paper actually claims.",
  ],
};

export const content: ContentItem[] = (() => {
  const items: ContentItem[] = [];
  let n = 0;
  for (const trend of trends) {
    const templates = (CONTENT_TEMPLATES[trend.name] ?? CONTENT_TEMPLATES["AI Regulation"])!;
    const count = trend.status === "surging" ? 5 : 3;
    for (let i = 0; i < count; i++) {
      n++;
      const body = templates[i % templates.length]!;
      const creator =
        creators.find((c) => c.topics.includes(trend.name)) ?? creators[n % creators.length]!;
      const platform = trend.platforms[i % trend.platforms.length]!;
      const sentimentScore = Number(between(-0.9, 0.9).toFixed(2));
      const engagement = int(420, 184_000);
      items.push({
        id: `pc-${n}`,
        preview: body.slice(0, 96) + (body.length > 96 ? "…" : ""),
        body,
        platform,
        creatorId: creator.id,
        timestamp: minutesAgo(int(8, 2_600)),
        engagement,
        likes: Math.round(engagement * 0.72),
        shares: Math.round(engagement * 0.14),
        comments: Math.round(engagement * 0.14),
        sentiment: sentimentScore > 0.2 ? "positive" : sentimentScore < -0.2 ? "negative" : "neutral",
        sentimentScore,
        topic: trend.category,
        trendId: trend.id,
        virality: Number(between(11, 99).toFixed(1)),
        reach: Math.round(engagement * between(9, 42)),
      });
    }
  }
  return items.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
})();

export const contentById = (id: string) => content.find((c) => c.id === id);

/* ------------------------------------------------------------------ */
/* Propagation graphs                                                  */
/* ------------------------------------------------------------------ */

const COMMUNITIES = [
  "Policy analysts",
  "ML practitioners",
  "Tech journalists",
  "Hardware enthusiasts",
  "Civic groups",
  "Trading channels",
  "General audience",
  "Creator network",
];

function buildPropagation(trend: Trend): PropagationGraph {
  const nodes: PropagationNode[] = [];
  const edges: PropagationEdge[] = [];
  const originCreator =
    creators.find((c) => c.topics.includes(trend.name)) ?? creators[0]!;
  const startMinutes = 20 * 60;

  const originNode: PropagationNode = {
    id: `${trend.id}-n0`,
    creatorId: originCreator.id,
    handle: originCreator.handle,
    platform: originCreator.platform,
    followers: originCreator.followers,
    engagement: int(2_400, 68_000),
    influence: 96.4,
    timestamp: minutesAgo(startMinutes),
    sentiment: originCreator.sentiment,
    origin: true,
    depth: 0,
    community: COMMUNITIES[0]!,
    contentId: content.find((c) => c.trendId === trend.id)?.id,
  };
  nodes.push(originNode);

  const targetCount = trend.status === "surging" ? 46 : trend.status === "rising" ? 34 : 24;
  let frontier = [originNode];
  let depth = 0;

  while (nodes.length < targetCount && depth < 6) {
    depth++;
    const next: PropagationNode[] = [];
    for (const parent of frontier) {
      const fanout = depth === 1 ? int(3, 5) : int(1, 3);
      for (let i = 0; i < fanout && nodes.length < targetCount; i++) {
        const seedCreator = creators[(nodes.length * 7 + depth * 3) % creators.length]!;
        const lag = int(6, 74) * depth;
        const platform =
          rnd() > 0.78
            ? trend.platforms[(nodes.length + 1) % trend.platforms.length]!
            : parent.platform;
        const node: PropagationNode = {
          id: `${trend.id}-n${nodes.length}`,
          creatorId: seedCreator.id,
          handle:
            depth <= 1
              ? seedCreator.handle
              : `${seedCreator.handle.split("_")[0]}_${["hub", "daily", "watch", "notes", "live", "desk", "feed"][nodes.length % 7]!}${depth}${i}`,
          platform,
          followers: Math.max(220, Math.round(parent.followers * between(0.04, 0.62))),
          engagement: Math.max(18, Math.round(parent.engagement * between(0.08, 0.7))),
          influence: Number(Math.max(6, parent.influence * between(0.42, 0.88)).toFixed(1)),
          timestamp: new Date(new Date(parent.timestamp).getTime() + lag * 60_000).toISOString(),
          sentiment: (["positive", "neutral", "negative"] as Sentiment[])[(nodes.length + depth) % 3]!,
          origin: false,
          depth,
          community: COMMUNITIES[(nodes.length + depth) % COMMUNITIES.length]!,
          contentId: content.find((c) => c.trendId === trend.id)?.id,
        };
        nodes.push(node);
        next.push(node);
        edges.push({
          source: parent.id,
          target: node.id,
          type:
            platform !== parent.platform
              ? "cross-platform"
              : (["repost", "quote", "reply", "mention"] as const)[nodes.length % 4]!,
          lagMinutes: lag,
          weight: Number(between(0.2, 1).toFixed(2)),
        });
      }
    }
    if (!next.length) break;
    frontier = next;
  }

  // A few lateral / re-amplification edges so the network is not a pure tree.
  for (let i = 0; i < Math.floor(nodes.length / 6); i++) {
    const a = nodes[int(1, nodes.length - 1)]!;
    const b = nodes[int(1, nodes.length - 1)]!;
    if (a.id === b.id) continue;
    const [from, to] = a.timestamp < b.timestamp ? [a, b] : [b, a];
    if (edges.some((e) => e.source === from.id && e.target === to.id)) continue;
    edges.push({
      source: from.id,
      target: to.id,
      type: "mention",
      lagMinutes: Math.round(
        (new Date(to.timestamp).getTime() - new Date(from.timestamp).getTime()) / 60_000,
      ),
      weight: Number(between(0.15, 0.6).toFixed(2)),
    });
  }

  const sorted = [...nodes].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
  const hops: { from: PlatformId; to: PlatformId; at: string }[] = [];
  for (const e of edges) {
    if (e.type !== "cross-platform") continue;
    const s = nodes.find((n) => n.id === e.source)!;
    const t = nodes.find((n) => n.id === e.target)!;
    if (hops.some((h) => h.from === s.platform && h.to === t.platform)) continue;
    hops.push({ from: s.platform, to: t.platform, at: t.timestamp });
  }

  const timeline: PropagationGraph["timeline"] = [];
  timeline.push({
    id: `${trend.id}-tl-0`,
    time: originNode.timestamp,
    nodeId: originNode.id,
    label: `@${originNode.handle} — origin detected`,
    detail: `Earliest matching post on ${PLATFORM_META[originNode.platform].name}. No prior matching content in the 6h lookback window.`,
    kind: "origin",
  });
  sorted.slice(1, 9).forEach((node, i) => {
    timeline.push({
      id: `${trend.id}-tl-${i + 1}`,
      time: node.timestamp,
      nodeId: node.id,
      label: `@${node.handle} — ${node.depth === 1 ? "first-degree amplification" : "secondary spread"}`,
      detail: `${PLATFORM_META[node.platform].name} · ${node.community} · influence ${node.influence}`,
      kind: "spread",
    });
  });
  hops.slice(0, 3).forEach((h, i) => {
    timeline.push({
      id: `${trend.id}-tl-x${i}`,
      time: h.at,
      label: `Trend crosses ${PLATFORM_META[h.from].name} → ${PLATFORM_META[h.to].name}`,
      detail: "First matching content detected on the receiving platform.",
      kind: "cross-platform",
    });
  });
  const last = sorted[sorted.length - 1]!;
  timeline.push({
    id: `${trend.id}-tl-end`,
    time: last.timestamp,
    nodeId: last.id,
    label: "Cascade reaches saturation in tracked communities",
    detail: `${new Set(nodes.map((n) => n.community)).size} distinct communities touched across ${new Set(nodes.map((n) => n.platform)).size} platforms.`,
    kind: "milestone",
  });
  timeline.sort((a, b) => (a.time < b.time ? -1 : 1));

  return {
    trendId: trend.id,
    nodes,
    edges,
    origin: {
      nodeId: originNode.id,
      confidence: Number(between(0.72, 0.96).toFixed(2)),
      earliestPost: originNode.timestamp,
      evidence: [
        "No matching n-gram cluster in the 6-hour lookback window prior to this post.",
        `${edges.filter((e) => e.source === originNode.id).length} first-degree reposts within 90 minutes.`,
        "Downstream phrasing retains two distinctive tokens from the source post.",
        "Account has prior first-mover history on this topic cluster (4 of last 9 events).",
      ],
    },
    metrics: {
      depth: Math.max(...nodes.map((n) => n.depth)),
      estimatedReach: nodes.reduce((s, n) => s + n.followers, 0),
      communities: new Set(nodes.map((n) => n.community)).size,
      crossPlatformHops: hops,
    },
    timeline,
  };
}

const propagationCache = new Map<string, PropagationGraph>();
export function propagationFor(trendId: string): PropagationGraph {
  const trend = trendById(trendId) ?? trends[0]!;
  if (!propagationCache.has(trend.id)) {
    propagationCache.set(trend.id, buildPropagation(trend));
  }
  return propagationCache.get(trend.id)!;
}

/* ------------------------------------------------------------------ */
/* Demographics                                                        */
/* ------------------------------------------------------------------ */

export function demographicsFor(trendId: string, platform: PlatformId | "all"): Demographics {
  const seed =
    (trendId.length * 37 + platform.length * 11 + trendId.charCodeAt(0) + platform.charCodeAt(0)) % 997;
  const r = mulberry(seed + 4211);
  const norm = (vals: number[]) => {
    const sum = vals.reduce((a, b) => a + b, 0);
    return vals.map((v) => Number(((v / sum) * 100).toFixed(1)));
  };
  const ageBuckets = ["13–17", "18–24", "25–34", "35–44", "45–54", "55–64", "65+"];
  const ageRaw = [r() * 4, r() * 22 + 12, r() * 26 + 20, r() * 18 + 14, r() * 12 + 8, r() * 8 + 4, r() * 5 + 2];
  const genderRaw = [r() * 20 + 42, r() * 20 + 34, r() * 4 + 2];
  return {
    age: ageBuckets.map((bucket, i) => ({ bucket, share: norm(ageRaw)[i]! })),
    gender: ["Male", "Female", "Undisclosed"].map((label, i) => ({ label, share: norm(genderRaw)[i]! })),
    locations: [
      "North America",
      "Western Europe",
      "South Asia",
      "Southeast Asia",
      "Latin America",
      "Middle East",
      "Africa",
      "Oceania",
    ].map((region, i) => ({
      region,
      share: norm(Array.from({ length: 8 }, () => r() * 20 + 4))[i]!,
      growth: Number((r() * 46 - 14).toFixed(1)),
    })),
    interests: [
      "Technology",
      "Public policy",
      "Finance & markets",
      "Science",
      "Gaming",
      "Sports",
      "Entertainment",
      "Education",
    ].map((label) => ({ label, affinity: Number((r() * 78 + 18).toFixed(0)) })),
    professions: (() => {
      const labels = [
        "Engineering & IT",
        "Media & journalism",
        "Academia & research",
        "Public sector",
        "Finance",
        "Student",
        "Other / unclassified",
      ];
      const shares = norm(labels.map(() => r() * 20 + 5));
      return labels.map((label, i) => ({ label, share: shares[i]! }));
    })(),
    behaviors: [
      "Shares before reading",
      "Replies with sources",
      "Cross-platform poster",
      "Night-time active",
      "High reshare depth",
      "Single-topic focus",
    ].map((label) => ({
      label,
      value: Number((r() * 70 + 14).toFixed(0)),
      benchmark: Number((r() * 40 + 28).toFixed(0)),
    })),
    hourly: Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, "0")}:00`,
      activity: Number((Math.sin((h - 6) / 3.4) * 34 + 52 + r() * 16).toFixed(0)),
    })),
    confidence: Number((r() * 0.16 + 0.78).toFixed(2)),
    sampleSize: Math.round(r() * 380_000 + 42_000),
  };
}

/* ------------------------------------------------------------------ */
/* Overview KPIs / sentiment                                           */
/* ------------------------------------------------------------------ */

const spark = (base: number, drift: number) =>
  Array.from({ length: 20 }, (_, i) => Math.round(base * (1 + (drift / 100) * (i / 19)) * (0.9 + rnd() * 0.2)));

export const kpis = [
  { id: "posts", label: "Posts analyzed", value: 4_196_610, delta: 8.4, unit: "", hint: "vs previous 24h", spark: spark(168_000, 12) },
  { id: "trends", label: "Active trends", value: 217, delta: 14.2, unit: "", hint: "detected in window", spark: spark(190, 18) },
  { id: "keywords", label: "Viral keywords", value: 1_842, delta: 22.7, unit: "", hint: "above velocity threshold", spark: spark(1_500, 24) },
  { id: "sentiment", label: "Sentiment index", value: -0.12, delta: -6.1, unit: "", hint: "weighted, −1 to +1", spark: spark(52, -8) },
  { id: "velocity", label: "Engagement velocity", value: 38_412, delta: 11.9, unit: "/hr", hint: "interactions per hour", spark: spark(34_000, 14) },
  { id: "conversations", label: "New conversations", value: 96_744, delta: 3.2, unit: "", hint: "root threads started", spark: spark(92_000, 4) },
  { id: "creators", label: "Active creators", value: 284_309, delta: -1.8, unit: "", hint: "posted in window", spark: spark(288_000, -2) },
  { id: "platforms", label: "Platforms monitored", value: 6, delta: 0, unit: "", hint: "all collectors healthy", spark: spark(6, 0) },
];

export const sentimentSeries = Array.from({ length: 72 }, (_, i) => {
  const positive = Math.round(between(26, 44));
  const negative = Math.round(between(18, 40));
  return {
    t: minutesAgo((71 - i) * 60),
    positive,
    negative,
    neutral: 100 - positive - negative,
    net: Number(((positive - negative) / 100).toFixed(3)),
    volume: int(9_000, 48_000),
  };
});

export const scrapeState = {
  status: "operational" as "operational" | "degraded" | "offline",
  lastScrapeMinutesAgo: 11,
  nextScrapeMinutes: 709,
  collectors: PLATFORM_IDS.map((p) => ({
    platform: p,
    healthy: true,
    lastBatch: int(4_000, 42_000),
  })),
};
