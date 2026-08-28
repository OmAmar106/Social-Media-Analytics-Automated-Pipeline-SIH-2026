import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_META } from "@/lib/mock/dataset";
import { clockUTC, compact } from "@/lib/format";
import type { PropagationEdge, PropagationNode } from "@/lib/types";

export type GraphLayout = "force" | "hierarchy" | "radial" | "timeline";

interface Positioned extends PropagationNode {
  x: number;
  y: number;
  r: number;
}

const W = 1000;
const H = 620;

function seeded(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function layoutNodes(
  nodes: PropagationNode[],
  edges: PropagationEdge[],
  layout: GraphLayout,
): Positioned[] {
  const radius = (n: PropagationNode) => 6 + (n.influence / 100) * 14 + (n.origin ? 4 : 0);
  const byDepth = new Map<number, PropagationNode[]>();
  nodes.forEach((n) => byDepth.set(n.depth, [...(byDepth.get(n.depth) ?? []), n]));
  const maxDepth = Math.max(1, ...nodes.map((n) => n.depth));

  if (layout === "hierarchy" || layout === "timeline") {
    const times = nodes.map((n) => new Date(n.timestamp).getTime());
    const tMin = Math.min(...times);
    const tMax = Math.max(...times);
    return nodes.map((n) => {
      const peers = byDepth.get(n.depth)!;
      const idx = peers.indexOf(n);
      const laneY = ((idx + 1) / (peers.length + 1)) * (H - 80) + 40;
      if (layout === "hierarchy") {
        return { ...n, r: radius(n), x: 70 + (n.depth / maxDepth) * (W - 150), y: laneY };
      }
      const t = (new Date(n.timestamp).getTime() - tMin) / Math.max(1, tMax - tMin);
      return { ...n, r: radius(n), x: 70 + t * (W - 140), y: laneY };
    });
  }

  if (layout === "radial") {
    return nodes.map((n, i) => {
      const peers = byDepth.get(n.depth)!;
      const idx = peers.indexOf(n);
      const angle = (idx / peers.length) * Math.PI * 2 + n.depth * 0.55 + seeded(i) * 0.12;
      const rr = (n.depth / (maxDepth + 0.4)) * (H / 2 - 46);
      return { ...n, r: radius(n), x: W / 2 + Math.cos(angle) * rr * 1.5, y: H / 2 + Math.sin(angle) * rr };
    });
  }

  // Force-directed: deterministic seeding + fixed iteration count.
  const pts = nodes.map((n, i) => ({
    ...n,
    r: radius(n),
    x: W / 2 + (seeded(i) - 0.5) * 520 + (n.depth - maxDepth / 2) * 60,
    y: H / 2 + (seeded(i + 99) - 0.5) * 380,
    vx: 0,
    vy: 0,
  }));
  const index = new Map(pts.map((p, i) => [p.id, i]));
  const links = edges
    .map((e) => ({ s: index.get(e.source), t: index.get(e.target) }))
    .filter((l): l is { s: number; t: number } => l.s !== undefined && l.t !== undefined);

  for (let iter = 0; iter < 320; iter++) {
    const alpha = 1 - iter / 320;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i]!;
        const b = pts[j]!;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          dx = seeded(i + j) - 0.5;
          dy = seeded(i * j + 7) - 0.5;
          d2 = 1;
        }
        const f = (2600 * alpha) / d2;
        const d = Math.sqrt(d2);
        a.vx -= (dx / d) * f;
        a.vy -= (dy / d) * f;
        b.vx += (dx / d) * f;
        b.vy += (dy / d) * f;
      }
    }
    for (const l of links) {
      const a = pts[l.s]!;
      const b = pts[l.t]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const target = 92;
      const f = ((d - target) / d) * 0.06 * alpha * 6;
      a.vx += dx * f;
      a.vy += dy * f;
      b.vx -= dx * f;
      b.vy -= dy * f;
    }
    for (const p of pts) {
      // gravity toward a depth-ordered column keeps the cascade legible
      p.vx += (70 + (p.depth / maxDepth) * (W - 160) - p.x) * 0.012 * alpha;
      p.vy += (H / 2 - p.y) * 0.006 * alpha;
      p.x += Math.max(-24, Math.min(24, p.vx));
      p.y += Math.max(-24, Math.min(24, p.vy));
      p.vx *= 0.72;
      p.vy *= 0.72;
      p.x = Math.max(40, Math.min(W - 40, p.x));
      p.y = Math.max(34, Math.min(H - 34, p.y));
    }
  }
  return pts.map(({ vx: _vx, vy: _vy, ...rest }) => rest);
}

export function NetworkGraph({
  nodes,
  edges,
  layout = "force",
  selectedId,
  onSelect,
  collapsed,
  onToggleCollapse,
  className,
}: {
  nodes: PropagationNode[];
  edges: PropagationEdge[];
  layout?: GraphLayout;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  collapsed?: string[];
  onToggleCollapse?: (id: string) => void;
  className?: string;
}) {
  const positioned = useMemo(() => layoutNodes(nodes, edges, layout), [nodes, edges, layout]);
  const posById = useMemo(() => new Map(positioned.map((p) => [p.id, p])), [positioned]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => setView({ k: 1, x: 0, y: 0 }), [layout]);

  const active = hovered ?? selectedId ?? null;
  const neighborIds = useMemo(() => {
    if (!active) return null;
    const set = new Set<string>([active]);
    edges.forEach((e) => {
      if (e.source === active) set.add(e.target);
      if (e.target === active) set.add(e.source);
    });
    return set;
  }, [active, edges]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setView((v) => ({ ...v, k: Math.min(3.2, Math.max(0.45, v.k * (e.deltaY < 0 ? 1.12 : 0.89))) }));
  }, []);

  const zoom = (dir: 1 | -1) =>
    setView((v) => ({ ...v, k: Math.min(3.2, Math.max(0.45, v.k * (dir === 1 ? 1.2 : 0.83))) }));

  return (
    <div className={cn("relative min-h-0 overflow-hidden rounded-md bg-background/60", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="size-full touch-none select-none"
        style={{ cursor: drag.current ? "grabbing" : "grab" }}
        onWheel={onWheel}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, ox: view.x, oy: view.y };
          (e.target as Element).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const scale = W / (svgRef.current?.clientWidth || W);
          setView((v) => ({
            ...v,
            x: drag.current!.ox + (e.clientX - drag.current!.x) * scale,
            y: drag.current!.oy + (e.clientY - drag.current!.y) * scale,
          }));
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerLeave={() => {
          drag.current = null;
          setHovered(null);
        }}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,1 L9,5 L0,9 Z" fill="var(--border-strong)" />
          </marker>
          <marker id="arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,1 L9,5 L0,9 Z" fill="var(--primary)" />
          </marker>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0 L0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.35" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />

        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          {edges.map((e, i) => {
            const s = posById.get(e.source);
            const t = posById.get(e.target);
            if (!s || !t) return null;
            const isActive = !!neighborIds && (e.source === active || e.target === active);
            const dim = !!neighborIds && !isActive;
            const mx = (s.x + t.x) / 2;
            const my = (s.y + t.y) / 2 - Math.min(60, Math.abs(t.x - s.x) * 0.16);
            return (
              <path
                key={`${e.source}-${e.target}-${i}`}
                d={`M${s.x},${s.y} Q${mx},${my} ${t.x},${t.y}`}
                fill="none"
                stroke={isActive ? "var(--primary)" : "var(--border-strong)"}
                strokeWidth={isActive ? 1.6 : e.type === "cross-platform" ? 1.2 : 0.9}
                strokeDasharray={e.type === "cross-platform" ? "4 3" : undefined}
                markerEnd={isActive ? "url(#arrow-active)" : "url(#arrow)"}
                opacity={dim ? 0.12 : isActive ? 0.95 : 0.5}
                className="transition-opacity duration-200"
              />
            );
          })}

          {positioned.map((n) => {
            const isActive = active === n.id;
            const dim = !!neighborIds && !neighborIds.has(n.id);
            const color = PLATFORM_META[n.platform].color;
            const isCollapsed = collapsed?.includes(n.id);
            return (
              <g
                key={n.id}
                transform={`translate(${n.x} ${n.y})`}
                opacity={dim ? 0.18 : 1}
                className="cursor-pointer transition-opacity duration-200"
                onPointerEnter={() => setHovered(n.id)}
                onPointerLeave={() => setHovered(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(selectedId === n.id ? null : n.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse?.(n.id);
                }}
              >
                {n.origin && (
                  <circle r={n.r + 7} fill="none" stroke="var(--primary)" strokeWidth="1" opacity="0.55" />
                )}
                {(isActive || selectedId === n.id) && (
                  <circle r={n.r + 4} fill="none" stroke="var(--primary)" strokeWidth="1.5" />
                )}
                <circle
                  r={n.r}
                  fill={color}
                  fillOpacity={n.origin ? 0.95 : 0.28}
                  stroke={color}
                  strokeWidth="1.4"
                />
                {isCollapsed && (
                  <text textAnchor="middle" y="3.5" fontSize="9" fill="var(--foreground)" className="num">
                    +
                  </text>
                )}
                {(n.r > 12 || isActive) && (
                  <text
                    y={n.r + 11}
                    textAnchor="middle"
                    fontSize="9.5"
                    className="num pointer-events-none"
                    fill={isActive ? "var(--foreground)" : "var(--muted-foreground)"}
                  >
                    @{n.handle.length > 18 ? `${n.handle.slice(0, 17)}…` : n.handle}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Hover card */}
      {hovered &&
        (() => {
          const n = posById.get(hovered)!;
          return (
            <div className="pointer-events-none absolute left-3 top-3 w-60 rounded-md border border-border bg-popover/95 p-3 text-xs shadow-lg backdrop-blur">
              <p className="num text-[13px] font-semibold text-foreground">@{n.handle}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {PLATFORM_META[n.platform].name} · {n.community}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <dt className="text-muted-foreground">Followers</dt>
                <dd className="num text-right">{compact(n.followers)}</dd>
                <dt className="text-muted-foreground">Influence</dt>
                <dd className="num text-right">{n.influence}</dd>
                <dt className="text-muted-foreground">Posted</dt>
                <dd className="num text-right">{clockUTC(n.timestamp)} UTC</dd>
                <dt className="text-muted-foreground">Depth</dt>
                <dd className="num text-right">{n.depth}</dd>
              </dl>
            </div>
          );
        })()}

      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md border border-border bg-surface/95 p-1 backdrop-blur">
        <button onClick={() => zoom(-1)} className="rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Zoom out">
          <Minus className="size-3.5" />
        </button>
        <span className="num w-10 text-center text-[11px] text-muted-foreground">{Math.round(view.k * 100)}%</span>
        <button onClick={() => zoom(1)} className="rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Zoom in">
          <Plus className="size-3.5" />
        </button>
        <button
          onClick={() => setView({ k: 1, x: 0, y: 0 })}
          className="rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Reset view"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        <span>Drag to pan · scroll to zoom · click a node to inspect · double-click to collapse</span>
      </div>
    </div>
  );
}
