"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Bot,
  CircleAlert,
  RotateCcw,
  Sparkles,
  Terminal,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { SetupPanel, WalletInfo } from "@/components/setup-panel";
import { ToolsPanel, ToolDef } from "@/components/tools-panel";
import { ToolTelemetry, Step } from "@/components/chat/tool-telemetry";
import { BazaarStatusBanner, Mood } from "@/components/chat/bazaar-status-banner";
import { EmptyState } from "@/components/chat/empty-state";
import { Composer } from "@/components/chat/composer";
import { CommandPalette } from "@/components/command-palette";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "agent";
  text: string;
  steps?: Step[];
  error?: boolean;
  timestamp?: string;
};

type Status = {
  hasApiKey: boolean;
  model: string;
  tools: ToolDef[];
};

export default function Home() {
  const [status, setStatus] = useState<Status | null>(null);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [creating, setCreating] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [bazaarMood, setBazaarMood] = useState<Mood>("neutral");

  const bottomRef = useRef<HTMLDivElement>(null);
  const composerInputRef = useRef<HTMLInputElement>(null);

  const loadWallet = useCallback(() => {
    fetch("/api/wallet")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
      .then((data: unknown) => {
        if (typeof data === "object" && data !== null && "address" in data) {
          const info = data as WalletInfo;
          setWallet({
            address: typeof info.address === "string" ? info.address : null,
            balance: typeof info.balance === "string" ? info.balance : undefined,
          });
        } else {
          setWallet({ address: null });
        }
      })
      .catch(() => setWallet({ address: null }));
  }, []);

  useEffect(() => {
    fetch("/api/agent")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
      .then((data: unknown) => {
        const obj = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
        setStatus({
          hasApiKey: Boolean(obj.hasApiKey),
          model: typeof obj.model === "string" ? obj.model : "gemini-flash-latest",
          tools: Array.isArray(obj.tools) ? (obj.tools as ToolDef[]) : [],
        });
      })
      .catch(() => setStatus({ hasApiKey: false, model: "gemini-flash-latest", tools: [] }));

    loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // Global Ctrl+K / Cmd+K Command Palette listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function createWallet() {
    setCreating(true);
    try {
      await fetch("/api/wallet", { method: "POST" });
      await loadWallet();
    } catch (err) {
      console.error("Wallet creation error:", err);
    } finally {
      setCreating(false);
    }
  }

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || thinking) return;

      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const history: Message[] = [...messages, { role: "user", text, timestamp: now }];
      setMessages(history);
      setInput("");
      setThinking(true);

      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.filter((m) => !m.error).map(({ role, text }) => ({ role, text })),
          }),
        });

        const rawText = await res.text();
        interface AgentApiResponse {
          answer?: string;
          error?: string;
          steps?: Step[];
        }
        let data: AgentApiResponse;
        try {
          data = JSON.parse(rawText) as AgentApiResponse;
        } catch {
          throw new Error(
            res.ok ? "Invalid response received from server." : `Server error (${res.status}): ${rawText.slice(0, 150)}`
          );
        }

        const agentTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        setMessages((m) => [
          ...m,
          data.error
            ? { role: "agent", text: data.error, error: true, timestamp: agentTimestamp }
            : { role: "agent", text: data.answer || "Directive execution complete with no output.", steps: data.steps, timestamp: agentTimestamp },
        ]);

        // Inspect tool results to update live UI states (e.g. bazaar mood or wallet balances)
        if (data.steps && data.steps.length > 0) {
          for (const s of data.steps) {
            const resObj = typeof s.result === "object" && s.result !== null ? (s.result as Record<string, unknown>) : null;
            if (resObj?.mood && typeof resObj.mood === "string" && ["cheerful", "neutral", "grumpy"].includes(resObj.mood)) {
              setBazaarMood(resObj.mood as Mood);
            }
            if (resObj?.payment) {
              loadWallet();
            }
          }
        }
      } catch (err: unknown) {
        const messageText =
          err instanceof Error
            ? err.message
            : "Could not reach the server. Please check your network connection or deployment status.";

        setMessages((m) => [
          ...m,
          {
            role: "agent",
            text: messageText,
            error: true,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          },
        ]);
      } finally {
        setThinking(false);
      }
    },
    [messages, thinking, loadWallet]
  );

  const ready = Boolean(status?.hasApiKey);
  const totalToolCalls = messages.reduce((acc, m) => acc + (m.steps?.length || 0), 0);

  return (
    <main className="mx-auto flex min-h-screen max-w-[1560px] flex-col gap-8 px-4 py-6 md:px-10 md:py-10">
      {/* Precision Header */}
      <Header
        model={status?.model}
        hasApiKey={ready}
        walletAddress={wallet?.address ?? null}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Hero Mission Anchor */}
      <Hero
        ready={ready}
        walletCreated={Boolean(wallet?.address)}
        toolsCount={status?.tools?.length || 0}
      />

      {/* Two-Column Command Layout */}
      <div className="grid flex-1 gap-6 lg:grid-cols-[400px_1fr] items-start">
        {/* Left Column: Setup & Capabilities Sidebar */}
        <aside className="flex flex-col gap-6">
          <SetupPanel
            hasApiKey={ready}
            wallet={wallet}
            creating={creating}
            hasInteracted={messages.length > 0}
            onCreateWallet={createWallet}
            onRefreshWallet={loadWallet}
          />

          <ToolsPanel
            tools={status?.tools || []}
            onSelectPrompt={(p) => {
              setInput(p);
              setTimeout(() => composerInputRef.current?.focus(), 50);
            }}
          />
        </aside>

        {/* Right Column: Autonomous Agent Command Workspace */}
        <Card className="flex h-[600px] lg:h-[calc(100vh-5rem)] min-h-[500px] flex-col border border-border/80 bg-card/90 shadow-2xl lg:sticky lg:top-6 overflow-hidden">
          {/* Workspace Header with Telemetry & Actions */}
          <CardHeader className="border-b border-border/50 py-3.5 px-4 bg-background/60">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary">03</span>
                <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  // REASONING WORKSPACE
                </span>
                <Badge variant="outline" className="ml-2 font-mono text-[10px] uppercase text-muted-foreground">
                  {messages.length} EVENTS
                </Badge>
                {totalToolCalls > 0 && (
                  <Badge variant="outline" className="font-mono text-[10px] uppercase text-cyan border-cyan/40 bg-cyan/10">
                    {totalToolCalls} TOOLS DISPATCHED
                  </Badge>
                )}
              </div>

              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMessages([])}
                  disabled={messages.length === 0 || thinking}
                  className="font-mono text-xs text-muted-foreground hover:text-foreground uppercase h-7 px-2"
                  aria-label="Clear session history"
                >
                  <RotateCcw className="size-3 mr-1.5" /> Clear
                </Button>
              </CardAction>
            </div>
          </CardHeader>

          {/* Marzban's Bazaar Status Banner */}
          <BazaarStatusBanner
            mood={bazaarMood}
            onSendPrompt={send}
            disabled={!ready || thinking}
          />

          {/* Scrollable Conversation Feed */}
          <ScrollArea className="min-h-0 flex-1 px-4 py-4">
            <div className="flex flex-col gap-5">
              {messages.length === 0 && (
                <EmptyState
                  ready={ready}
                  walletCreated={Boolean(wallet?.address)}
                  onSelectPrompt={(p) => send(p)}
                />
              )}

              {messages.map((m, i) => (
                <div key={i} className="flex flex-col gap-1 w-full animate-in fade-in duration-150">
                  {m.role === "user" ? (
                    /* User Directive Bubble */
                    <div className="max-w-[85%] self-end flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase">
                        <span>OPERATOR DIRECTIVE</span>
                        {m.timestamp && <span>{m.timestamp}</span>}
                        <User className="size-3 text-primary" />
                      </div>
                      <div className="border border-primary/50 bg-primary/10 px-4 py-2.5 font-mono text-sm text-foreground shadow-sm">
                        <span className="text-primary font-bold mr-2">&gt;</span>
                        {m.text}
                      </div>
                    </div>
                  ) : (
                    /* Agent Response Container */
                    <div className="flex max-w-[92%] gap-3 self-start items-start">
                      <div className="flex size-8 shrink-0 items-center justify-center border border-border/80 bg-background text-primary mt-1 shadow-sm">
                        <Bot className="size-4.5" />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        {/* Agent Metadata Header */}
                        <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase">
                          <span className="font-bold text-foreground">AGENTMAXX // GEMINI</span>
                          {m.timestamp && <span>• {m.timestamp}</span>}
                        </div>

                        {/* Tool Execution Telemetry Steps */}
                        {m.steps && m.steps.length > 0 && (
                          <div className="flex flex-col gap-1.5 my-1">
                            {m.steps.map((s, stepIdx) => (
                              <ToolTelemetry key={stepIdx} step={s} />
                            ))}
                          </div>
                        )}

                        {/* Agent Narrative Text Body */}
                        <div
                          className={cn(
                            "border px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans",
                            m.error
                              ? "border-destructive/40 bg-destructive/10 text-destructive font-mono"
                              : "border-border/60 bg-muted/30 text-foreground"
                          )}
                        >
                          {m.error && (
                            <div className="flex items-center gap-1.5 font-bold mb-1 uppercase tracking-wider text-xs">
                              <CircleAlert className="size-3.5" /> Directive Execution Error
                            </div>
                          )}
                          {m.text}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Reasoning Telemetry Indicator */}
              {thinking && (
                <div className="flex items-center gap-3 font-mono text-xs text-primary bg-primary/5 border border-primary/30 p-3 self-start animate-pulse">
                  <Terminal className="size-4 animate-spin" />
                  <div className="flex flex-col">
                    <span className="font-bold uppercase tracking-wider">
                      AGENT REASONING // DISPATCHING TOOLS...
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Executing multi-step Gemini tool loop and evaluating state transitions
                    </span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Interactive Shell Composer */}
          <CardFooter className="border-t border-border/50 bg-background/90 p-4">
            <div className="w-full">
              <Composer
                input={input}
                inputRef={composerInputRef}
                ready={ready}
                thinking={thinking}
                onChange={setInput}
                onSubmit={send}
              />
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        walletAddress={wallet?.address ?? null}
        onClose={() => setCommandPaletteOpen(false)}
        onSendPrompt={(p) => send(p)}
        onClearMessages={() => setMessages([])}
        onFocusInput={() => {
          setTimeout(() => composerInputRef.current?.focus(), 50);
        }}
        onCreateWallet={createWallet}
      />
    </main>
  );
}
