import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { triggerScrape } from "./api";
import { scrapeState } from "./mock/dataset";
import type { PlatformId, ScrapeResult } from "./types";

export const TIME_RANGES = [
  { id: "1h", label: "Last hour" },
  { id: "12h", label: "Last 12 hours" },
  { id: "24h", label: "Last 24 hours" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
] as const;

export type RangeId = (typeof TIME_RANGES)[number]["id"];

interface AppState {
  platform: PlatformId | "all";
  setPlatform: (p: PlatformId | "all") => void;
  range: RangeId;
  setRange: (r: RangeId) => void;
  workspace: string;
  /* scraping */
  scraping: boolean;
  progress: number;
  stage: string;
  lastScrapeMinutes: number;
  nextScrapeMinutes: number;
  lastResult: ScrapeResult | null;
  runScrape: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [platform, setPlatform] = useState<PlatformId | "all">("all");
  const [range, setRange] = useState<RangeId>("24h");
  const [scraping, setScraping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [lastScrapeMinutes, setLastScrapeMinutes] = useState(scrapeState.lastScrapeMinutesAgo);
  const [nextScrapeMinutes, setNextScrapeMinutes] = useState(scrapeState.nextScrapeMinutes);
  const [lastResult, setLastResult] = useState<ScrapeResult | null>(null);

  const runScrape = useCallback(async () => {
    if (scraping) return;
    setScraping(true);
    setProgress(0);
    setStage("Queuing collector run");
    try {
      // Service layer call — swap the mock for POST /api/scrape when the backend lands.
      const result = await triggerScrape((pct, s) => {
        setProgress(pct);
        setStage(s);
      });
      setLastResult(result);
      setLastScrapeMinutes(0);
      setNextScrapeMinutes(720);
      toast.success("Scrape completed", {
        description: `${result.newPosts.toLocaleString("en-US")} new posts analyzed · ${result.newTrends} new trends detected`,
      });
    } catch (e) {
      toast.error("Scrape failed", {
        description: e instanceof Error ? e.message : "Collector run could not be started.",
      });
    } finally {
      setScraping(false);
      setProgress(0);
      setStage("");
    }
  }, [scraping]);

  const value = useMemo(
    () => ({
      platform,
      setPlatform,
      range,
      setRange,
      workspace: "Global Signals — Q3 Monitoring",
      scraping,
      progress,
      stage,
      lastScrapeMinutes,
      nextScrapeMinutes,
      lastResult,
      runScrape,
    }),
    [platform, range, scraping, progress, stage, lastScrapeMinutes, nextScrapeMinutes, lastResult, runScrape],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
