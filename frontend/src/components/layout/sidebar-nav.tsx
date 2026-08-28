import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bot,
  Database,
  Gauge,
  Globe2,
  Hash,
  LayoutGrid,
  MessagesSquare,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrapeStatus } from "./scrape-status";

const NAV: { group: string; items: { to: string; label: string; icon: typeof Gauge }[] }[] = [
  {
    group: "Monitor",
    items: [
      { to: "/", label: "Overview", icon: LayoutGrid },
      { to: "/trends", label: "Trends", icon: TrendingUp },
      { to: "/keywords", label: "Viral Keywords", icon: Hash },
      { to: "/propagation", label: "Trend Propagation", icon: Network },
    ],
  },
  {
    group: "Analyze",
    items: [
      { to: "/sentiment", label: "Sentiment", icon: Gauge },
      { to: "/audience", label: "Audience & Demographics", icon: Users },
      { to: "/platforms", label: "Platforms", icon: Globe2 },
      { to: "/content", label: "Content Intelligence", icon: MessagesSquare },
    ],
  },
  {
    group: "Investigate",
    items: [
      { to: "/chatbot", label: "Chatbot", icon: Bot },
      { to: "/explorer", label: "Data Explorer", icon: Database },
    ],
  },
];

export function SidebarNav({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className={cn(
        "z-30 flex h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200",
        collapsed ? "w-[60px]" : "w-[248px]",
      )}
    >
      <div className={cn("flex h-14 items-center gap-2.5 border-b border-border px-3", collapsed && "justify-center px-0")}>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-primary/40 bg-primary/15">
          <Network className="size-3.5 text-primary" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold tracking-tight">SIGNAL</p>
            <p className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
              Intelligence Suite
            </p>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="size-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-2 rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen className="size-4" />
        </button>
      )}

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {NAV.map((group) => (
          <div key={group.group} className="mb-4 last:mb-0">
            {!collapsed && <p className="label-xs px-2 pb-1.5">{group.group}</p>}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "relative flex h-8 items-center gap-2.5 rounded-sm px-2 text-[13px] transition-colors",
                        collapsed && "justify-center px-0",
                        active
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {active && (
                        <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary" aria-hidden />
                      )}
                      <Icon className="size-4 shrink-0" strokeWidth={1.9} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <ScrapeStatus collapsed={collapsed} />
    </aside>
  );
}
