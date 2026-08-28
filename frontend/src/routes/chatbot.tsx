import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CornerDownLeft, Sparkles } from "lucide-react";

import { getTrends, sendChatMessage } from "@/lib/api";
import { useAppState } from "@/lib/app-state";
import { MetaItem, PageHeader, Panel, PanelHeader } from "@/components/common/panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ChatResponse } from "@/lib/types";

export const Route = createFileRoute("/chatbot")({
  head: () => ({
    meta: [
      { title: "Intelligence Assistant — SIGNAL" },
      {
        name: "description",
        content: "Ask questions about trends, sentiment, propagation and audiences and get cited answers from the corpus.",
      },
      { property: "og:title", content: "Intelligence Assistant — SIGNAL" },
      {
        property: "og:description",
        content: "A conversational analyst over your social intelligence corpus, with citations and suggested follow-ups.",
      },
    ],
  }),
  component: ChatbotPage,
});

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: ChatResponse["citations"];
  followUps?: string[];
}

const STARTERS = [
  "What is trending right now?",
  "Where did the top trend originate?",
  "Compare sentiment on X and YouTube.",
  "Which creators drive the spread?",
  "Which platform is driving the conversation?",
];

function ChatbotPage() {
  const { platform, range } = useAppState();
  const [topic, setTopic] = useState("auto");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "intro",
      role: "assistant",
      text: "I'm connected to the live corpus — 4.2M documents across six platforms. Ask about trends, origins, sentiment shifts, propagation paths or audience composition. Every answer is scoped to the filters in the top bar.",
      followUps: STARTERS.slice(0, 3),
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const trendsQuery = useQuery({ queryKey: ["trends", platform, range], queryFn: () => getTrends({ platform, range }) });

  const mutation = useMutation({
    mutationFn: (text: string) => sendChatMessage(text, { platform, range, topic }),
    onSuccess: (res) =>
      setMessages((m) => [
        ...m,
        { id: res.id, role: "assistant", text: res.answer, citations: res.citations, followUps: res.followUps },
      ]),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, mutation.isPending]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || mutation.isPending) return;
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text: value }]);
    setInput("");
    mutation.mutate(value);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 p-6">
      <PageHeader
        title="Intelligence Assistant"
        description="A conversational layer over the corpus. Answers are grounded in the current dataset and returned with the figures they were derived from."
        meta={
          <>
            <MetaItem label="Scope" value={platform === "all" ? "All platforms" : platform.toUpperCase()} />
            <MetaItem label="Window" value={range} />
            <MetaItem label="Grounding" value="retrieval over 4.2M documents" />
          </>
        }
        actions={
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="h-8 w-[260px] text-xs">
              <SelectValue placeholder="Topic focus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto" className="text-xs">
                Auto-detect topic
              </SelectItem>
              {(trendsQuery.data ?? []).slice(0, 12).map((t) => (
                <SelectItem key={t.id} value={t.name} className="text-xs">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Panel className="flex h-[calc(100vh-260px)] min-h-[520px] flex-col lg:col-span-3">
          <PanelHeader
            title="Session"
            subtitle="Grounded answers with citations"
            actions={<Sparkles className="size-3.5 text-primary" />}
          />
          <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-md border px-3.5 py-2.5 text-[13px] leading-relaxed",
                    m.role === "user"
                      ? "border-primary/30 bg-primary/10 text-foreground"
                      : "border-border bg-surface text-foreground/90",
                  )}
                >
                  <Markdownish text={m.text} />
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-2.5">
                      {m.citations.map((c) => (
                        <span
                          key={`${c.label}-${c.value}`}
                          className="num rounded-sm border border-border bg-surface-raised px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {c.label}: <span className="text-foreground/80">{c.value}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {m.followUps && m.followUps.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {m.followUps.map((f) => (
                        <button
                          key={f}
                          onClick={() => send(f)}
                          className="rounded-sm border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {mutation.isPending && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-1.5 animate-pulse rounded-full bg-primary"
                      style={{ animationDelay: `${i * 140}ms` }}
                    />
                  ))}
                </span>
                Querying corpus…
              </div>
            )}
          </div>

          <div className="border-t border-border p-3">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask about a trend, its origin, sentiment shift, or audience…"
                className="min-h-[72px] resize-none pr-24 text-[13px]"
              />
              <Button
                size="sm"
                className="absolute bottom-2.5 right-2.5 h-7 gap-1.5 px-2.5 text-[11px]"
                disabled={!input.trim() || mutation.isPending}
                onClick={() => send(input)}
              >
                Send <CornerDownLeft className="size-3" />
              </Button>
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Suggested queries" subtitle="Common analyst questions" />
            <div className="space-y-1.5 p-3">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full rounded-sm border border-border bg-surface px-2.5 py-2 text-left text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Active context" subtitle="Applied to every answer" />
            <dl className="divide-y divide-border">
              {[
                ["Platform", platform === "all" ? "All platforms" : platform.toUpperCase()],
                ["Time window", range],
                ["Topic focus", topic === "auto" ? "Auto-detect" : topic],
                ["Corpus", "4,196,610 documents"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-4 py-2.5">
                  <dt className="label-xs">{k}</dt>
                  <dd className="num max-w-[55%] truncate text-right text-xs">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Markdownish({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split("\n").map((line, i) =>
        line.trim() === "" ? null : (
          <p key={i}>
            {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} className="font-semibold text-foreground">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{part}</span>
              ),
            )}
          </p>
        ),
      )}
    </div>
  );
}
