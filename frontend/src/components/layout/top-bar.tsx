import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, Search, Settings, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIME_RANGES, useAppState, type RangeId } from "@/lib/app-state";
import { PLATFORM_IDS, PLATFORM_META, creators, keywords, trends } from "@/lib/mock/dataset";
import type { PlatformId } from "@/lib/types";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const { platform, setPlatform, range, setRange, workspace } = useAppState();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const rangeLabel = useMemo(
    () => TIME_RANGES.find((r) => r.id === range)?.label ?? "Last 24 hours",
    [range],
  );

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[13px] font-medium tracking-tight">{workspace}</span>
        <span className="hidden h-5 items-center rounded-sm border border-border bg-secondary/60 px-1.5 text-[10px] uppercase tracking-wider text-muted-foreground sm:inline-flex">
          Production
        </span>
      </div>

      <button
        onClick={() => setOpen(true)}
        className="group ml-2 flex h-8 min-w-0 flex-1 max-w-md items-center gap-2 rounded-sm border border-border bg-background px-2.5 text-left text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="truncate">Search trends, keywords, creators, posts, platforms…</span>
        <kbd className="num ml-auto hidden shrink-0 rounded-sm border border-border px-1 text-[10px] text-muted-foreground sm:block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden h-8 gap-1.5 text-xs md:inline-flex">
              {rangeLabel}
              <ChevronDown className="size-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs">Time range</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={range} onValueChange={(v) => setRange(v as RangeId)}>
              {TIME_RANGES.map((r) => (
                <DropdownMenuRadioItem key={r.id} value={r.id} className="text-xs">
                  {r.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <SlidersHorizontal className="size-3.5 opacity-70" />
              {platform === "all" ? "All platforms" : PLATFORM_META[platform].name}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs">Platform filter</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={platform}
              onValueChange={(v) => setPlatform(v as PlatformId | "all")}
            >
              <DropdownMenuRadioItem value="all" className="text-xs">
                All platforms
              </DropdownMenuRadioItem>
              {PLATFORM_IDS.map((p) => (
                <DropdownMenuRadioItem key={p} value={p} className="text-xs">
                  {PLATFORM_META[p].name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              <span className="absolute right-1 top-1 size-1.5 rounded-full bg-negative" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="text-xs">Alerts</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[
              { t: "Velocity threshold breached", d: "AI Regulation · +182% in 60 min", a: "4m ago" },
              { t: "Cross-platform migration", d: "Election Debate · X → Telegram", a: "22m ago" },
              { t: "Sentiment shift", d: "GPU Pricing net sentiment −0.31", a: "1h ago" },
            ].map((n) => (
              <DropdownMenuItem key={n.t} className="flex-col items-start gap-0.5 py-2">
                <span className="text-xs font-medium">{n.t}</span>
                <span className="text-[11px] text-muted-foreground">{n.d}</span>
                <span className="num text-[10px] text-muted-foreground">{n.a}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Settings"
        >
          <Settings className="size-4" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-sm border border-border bg-secondary/50 py-1 pl-1 pr-2 transition-colors hover:bg-accent">
              <span className="num flex size-6 items-center justify-center rounded-sm bg-primary/20 text-[10px] font-semibold text-primary">
                AR
              </span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-xs font-medium">A. Reyes</span>
              <span className="text-[11px] font-normal text-muted-foreground">Lead analyst · Intelligence</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs">Workspace settings</DropdownMenuItem>
            <DropdownMenuItem className="text-xs">API credentials</DropdownMenuItem>
            <DropdownMenuItem className="text-xs">Collector configuration</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search trends, keywords, creators, posts, topics…" />
        <CommandList>
          <CommandEmpty>No matches in the current corpus.</CommandEmpty>
          <CommandGroup heading="Trends">
            {trends.slice(0, 6).map((t) => (
              <CommandItem
                key={t.id}
                value={`trend ${t.name} ${t.category}`}
                onSelect={() => {
                  setOpen(false);
                  navigate({ to: "/trends/$trendId", params: { trendId: t.id } });
                }}
              >
                <span className="flex-1">{t.name}</span>
                <span className="num text-[11px] text-muted-foreground">{t.category}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Keywords">
            {keywords.slice(0, 5).map((k) => (
              <CommandItem
                key={k.id}
                value={`keyword ${k.term}`}
                onSelect={() => {
                  setOpen(false);
                  navigate({ to: "/keywords" });
                }}
              >
                <span className="flex-1">{k.term}</span>
                <span className="num text-[11px] text-muted-foreground">{k.cluster}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Creators">
            {creators.slice(0, 5).map((c) => (
              <CommandItem
                key={c.id}
                value={`creator ${c.handle} ${c.displayName}`}
                onSelect={() => {
                  setOpen(false);
                  navigate({ to: "/content" });
                }}
              >
                <span className="num flex-1">@{c.handle}</span>
                <span className="text-[11px] text-muted-foreground">{PLATFORM_META[c.platform].name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Platforms">
            {PLATFORM_IDS.map((p) => (
              <CommandItem
                key={p}
                value={`platform ${PLATFORM_META[p].name}`}
                onSelect={() => {
                  setOpen(false);
                  setPlatform(p);
                  navigate({ to: "/platforms" });
                }}
              >
                <span className={cn("flex-1")}>{PLATFORM_META[p].name}</span>
                <span className="text-[11px] text-muted-foreground">Set as filter</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
