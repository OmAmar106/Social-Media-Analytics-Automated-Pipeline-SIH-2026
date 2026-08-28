export type PlatformId =
  | "x"
  | "youtube"
  | "facebook"
  | "telegram"
  | "reddit"
  | "instagram";

export type Sentiment = "positive" | "neutral" | "negative";

export type TrendStatus = "surging" | "rising" | "steady" | "cooling" | "declining";

export interface Platform {
  id: PlatformId;
  name: string;
  short: string;
  posts: number;
  engagement: number;
  growth: number;
  activeUsers: number;
  avgEngagement: number;
  sentiment: { positive: number; neutral: number; negative: number };
  topTopics: string[];
  viralContentCount: number;
}

export interface SeriesPoint {
  t: string;
  mentions: number;
  engagement: number;
  creators: number;
  sentiment: number;
}

export interface Trend {
  id: string;
  name: string;
  category: string;
  status: TrendStatus;
  growth: number;
  velocity: number;
  posts: number;
  engagement: number;
  sentiment: number;
  sentimentSplit: { positive: number; neutral: number; negative: number };
  firstDetected: string;
  peakActivity: string;
  platforms: PlatformId[];
  creators: number;
  summary: string;
  series: SeriesPoint[];
  platformBreakdown: { platform: PlatformId; mentions: number; engagement: number; sentiment: number }[];
  sparkline: number[];
}

export interface Keyword {
  id: string;
  term: string;
  volume: number;
  growth: number;
  velocity: number;
  sentiment: number;
  engagement: number;
  platforms: PlatformId[];
  firstDetected: string;
  related: string[];
  cluster: string;
  series: number[];
}

export interface Creator {
  id: string;
  handle: string;
  displayName: string;
  platform: PlatformId;
  followers: number;
  engagementRate: number;
  influence: number;
  sentiment: Sentiment;
  bio: string;
  posts: number;
  topics: string[];
  verified: boolean;
}

export interface ContentItem {
  id: string;
  preview: string;
  body: string;
  platform: PlatformId;
  creatorId: string;
  timestamp: string;
  engagement: number;
  likes: number;
  shares: number;
  comments: number;
  sentiment: Sentiment;
  sentimentScore: number;
  topic: string;
  trendId: string;
  virality: number;
  reach: number;
}

export interface PropagationNode {
  id: string;
  creatorId: string;
  handle: string;
  platform: PlatformId;
  followers: number;
  engagement: number;
  influence: number;
  timestamp: string;
  sentiment: Sentiment;
  origin: boolean;
  depth: number;
  community: string;
  contentId?: string | undefined;
}

export interface PropagationEdge {
  source: string;
  target: string;
  type: "repost" | "reply" | "quote" | "cross-platform" | "mention";
  lagMinutes: number;
  weight: number;
}

export interface PropagationGraph {
  trendId: string;
  nodes: PropagationNode[];
  edges: PropagationEdge[];
  origin: {
    nodeId: string;
    confidence: number;
    evidence: string[];
    earliestPost: string;
  };
  metrics: {
    depth: number;
    estimatedReach: number;
    communities: number;
    crossPlatformHops: { from: PlatformId; to: PlatformId; at: string }[];
  };
  timeline: {
    id: string;
    time: string;
    nodeId?: string | undefined;
    label: string;
    detail: string;
    kind: "origin" | "spread" | "cross-platform" | "milestone";
  }[];
}

export interface Demographics {
  age: { bucket: string; share: number }[];
  gender: { label: string; share: number }[];
  locations: { region: string; share: number; growth: number }[];
  interests: { label: string; affinity: number }[];
  professions: { label: string; share: number }[];
  behaviors: { label: string; value: number; benchmark: number }[];
  hourly: { hour: string; activity: number }[];
  confidence: number;
  sampleSize: number;
}

export interface ScrapeResult {
  completedAt: string;
  newPosts: number;
  newTrends: number;
  platforms: { platform: PlatformId; posts: number }[];
}

export interface ChatResponse {
  id: string;
  answer: string;
  citations: { label: string; value: string }[];
  followUps: string[];
}
