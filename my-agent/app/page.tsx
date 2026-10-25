"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Compass,
  CircleAlert,
  RotateCcw,
  Sparkles,
  Terminal,
  User,
  ShoppingBag,
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
import { BazaarInventory } from "@/components/bazaar-inventory";
import { BazaarSplineEnvironment } from "@/components/bazaar-spline-environment";
import { BazaarAstrolabe3D } from "@/components/astrolabe";
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
  const [stallRefresh, setStallRefresh] = useState<number>(0);
  const [negotiationRound, setNegotiationRound] = useState<number>(1);
  const [isNegotiating, setIsNegotiating] = useState<boolean>(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<boolean>(false);
  const [showAstrolabe, setShowAstrolabe] = useState<boolean>(false);

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

      const lowerText = text.toLowerCase();
      const isOfferOrHaggle = /offer|silver|haggle|bid|price|buy|ware|counter|discount/.test(lowerText);
      const isCheckout = /pay|invoice|checkout|settle|transfer|send coin|signature/.test(lowerText);
      if (isCheckout) {
        setIsProcessingCheckout(true);
        setIsNegotiating(false);
      } else if (isOfferOrHaggle) {
        setIsNegotiating(true);
        setIsProcessingCheckout(false);
      }

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
            : { role: "agent", text: data.answer || "Trade evaluation complete.", steps: data.steps, timestamp: agentTimestamp },
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
              setIsProcessingCheckout(false);
            }
            if (typeof resObj?.roundsConsumed === "number") {
              setNegotiationRound(Math.min(4, Math.max(1, (resObj.roundsConsumed as number) + 1)));
            } else if (typeof resObj?.round === "number") {
              setNegotiationRound(Math.min(4, Math.max(1, resObj.round as number)));
            }
          }
          // Refresh wares inventory to reflect new rounds, status, or reservations
          setStallRefresh((c) => c + 1);
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
        setIsNegotiating(false);
        setIsProcessingCheckout(false);
      }
    },
    [messages, thinking, loadWallet]
  );

  const ready = Boolean(status?.hasApiKey);
  const totalToolCalls = messages.reduce((acc, m) => acc + (m.steps?.length || 0), 0);

  return (
    <main className="mx-auto flex min-h-screen max-w-[1560px] flex-col gap-6 px-4 py-6 md:px-10 md:py-8">
      {/* Precision Bazaar Header */}
      <Header
        model={status?.model}
        hasApiKey={ready}
        walletAddress={wallet?.address ?? null}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Hero Atmosphere Anchor */}
      <Hero
        ready={ready}
        walletCreated={Boolean(wallet?.address)}
        toolsCount={status?.tools?.length || 0}
      />

      {/* Interactive Visual Wares Inventory */}
      <BazaarInventory
        onSelectPrompt={send}
        disabled={!ready || thinking}
        refreshTrigger={stallRefresh}
      />

      {/* Asymmetrical Sticky Workspace Section */}
      <section className="w-full max-w-screen-2xl mx-auto px-4 py-12 relative">
        <h2 className="text-2xl md:text-3xl font-serif text-[#C5A059] tracking-wide mb-8 flex items-center gap-3">
          👨💼 MARZABAN
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Scrollable Panels 01 & 02 */}
          <div className="lg:col-span-4 flex flex-col gap-6">
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
          </div>

          {/* Right Column: Sticky Workspace Panel 03 */}
          <div className="lg:col-span-8 sticky top-6 lg:h-[calc(100vh-3rem)] flex flex-col">
            <Card className="bazaar-border flex h-[620px] lg:h-full min-h-[520px] flex-1 flex-col border border-[#C5A059]/30 bg-card/95 shadow-2xl overflow-hidden relative">
              {/* 3D / Procedural Environmental Backdrop */}
              <BazaarSplineEnvironment />

              {/* Workspace Header with Telemetry & Actions */}
              <CardHeader className="relative z-10 border-b border-border/50 py-3 px-4 bg-background/80 shrink-0">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brass">03</span>
                    <span className="font-serif text-xs font-semibold tracking-wider text-parchment uppercase">
                      MERCHANT REASONING WORKSPACE
                    </span>
                    <Badge variant="outline" className="ml-2 font-mono text-[10px] uppercase text-muted-foreground border-border/60">
                      {messages.length} EVENTS
                    </Badge>
                    {totalToolCalls > 0 && (
                      <Badge variant="outline" className="font-mono text-[10px] uppercase text-brass border-brass/40 bg-brass/10">
                        {totalToolCalls} TOOLS DISPATCHED
                      </Badge>
                    )}
                  </div>

                  <CardAction>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAstrolabe((prev) => !prev)}
                        className={cn(
                          "font-mono text-xs uppercase h-7 px-2",
                          showAstrolabe
                            ? "text-brass bg-brass/10 border border-brass/40"
                            : "text-muted-foreground hover:text-parchment"
                        )}
                        aria-label={showAstrolabe ? "Hide 3D Astrolabe" : "View 3D Astrolabe"}
                        title="Toggle 3D Cybernetic Astrolabe & Reactive HUD"
                      >
                        <Compass className="size-3 mr-1.5" />
                        <span className="hidden sm:inline">{showAstrolabe ? "Hide HUD" : "Astrolabe HUD"}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMessages([]);
                          setNegotiationRound(1);
                          setIsNegotiating(false);
                          setIsProcessingCheckout(false);
                        }}
                        disabled={messages.length === 0 || thinking}
                        className="font-mono text-xs text-muted-foreground hover:text-parchment uppercase h-7 px-2"
                        aria-label="Clear session history"
                      >
                        <RotateCcw className="size-3 mr-1.5" /> Clear
                      </Button>
                    </div>
                  </CardAction>
                </div>
              </CardHeader>

              {/* Marzban's Bazaar Status Banner */}
              <div className="relative z-10 shrink-0">
                <BazaarStatusBanner
                  mood={bazaarMood}
                  onSendPrompt={send}
                  disabled={!ready || thinking}
                />
              </div>

              {/* Collapsible 3D Cybernetic Astrolabe & Reactive HUD */}
              {showAstrolabe && messages.length > 0 && (
                <div className="relative z-10 border-b border-border/70 p-2 bg-void/70 shrink-0">
                  <BazaarAstrolabe3D
                    mood={bazaarMood}
                    round={negotiationRound}
                    isNegotiating={isNegotiating || thinking}
                    isProcessingCheckout={isProcessingCheckout}
                    size="sm"
                  />
                </div>
              )}

              {/* Scrollable Conversation Feed */}
              <ScrollArea className="relative z-10 min-h-0 flex-1 px-4 py-4">
                <div className="flex flex-col gap-5">
                  {messages.length === 0 && (
                    <EmptyState
                      ready={ready}
                      walletCreated={Boolean(wallet?.address)}
                      onSelectPrompt={(p) => send(p)}
                      mood={bazaarMood}
                      round={negotiationRound}
                      isNegotiating={isNegotiating || thinking}
                      isProcessingCheckout={isProcessingCheckout}
                    />
                  )}

                  {messages.map((m, i) => (
                    <div key={i} className="flex flex-col gap-1 w-full animate-in fade-in duration-150">
                      {m.role === "user" ? (
                        /* User Directive Bubble */
                        <div className="max-w-[85%] self-end flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase">
                            <span>BUYER OFFER / DIRECTIVE</span>
                            {m.timestamp && <span>{m.timestamp}</span>}
                            <User className="size-3 text-brass" />
                          </div>
                          <div className="border border-brass/50 bg-brass/10 px-4 py-2.5 font-mono text-sm text-parchment shadow-sm">
                            <span className="text-brass font-bold mr-2">&gt;</span>
                            {m.text}
                          </div>
                        </div>
                      ) : (
                        /* Marzban Merchant Response Container */
                        <div className="flex max-w-[94%] gap-3 self-start items-start">
                          <div className="flex size-9 shrink-0 items-center justify-center border border-brass/50 bg-crimson/50 text-brass mt-1 shadow-md">
                            <Compass className="size-5" />
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col gap-2">
                            {/* Agent Metadata Header */}
                            <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase">
                              <span className="font-serif font-bold text-parchment tracking-wide">
                                MARZBAN // BAZAAR MERCHANT
                              </span>
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

                            {/* Merchant Dialogue Parchment Card */}
                            <div
                              className={cn(
                                "border px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans transition-all",
                                m.error
                                  ? "border-destructive/40 bg-destructive/10 text-destructive font-mono"
                                  : "border-brass/30 bg-card/80 text-parchment shadow-sm"
                              )}
                            >
                              {m.error && (
                                <div className="flex items-center gap-1.5 font-bold mb-1 uppercase tracking-wider text-xs">
                                  <CircleAlert className="size-3.5" /> Trade Negotiation Error
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
                    <div className="flex items-center gap-3 font-mono text-xs text-brass bg-brass/5 border border-brass/30 p-3 self-start animate-pulse">
                      <Compass className="size-4 animate-spin text-brass" />
                      <div className="flex flex-col">
                        <span className="font-bold uppercase tracking-wider font-serif">
                          MARZBAN IS EVALUATING THE OFFER // REASONING...
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Assessing stall mood, private threshold formula, and state transitions
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              {/* Interactive Bazaar Shell Composer */}
              <CardFooter className="relative z-10 border-t border-border/50 bg-background/95 p-4 shrink-0">
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
        </div>
      </section>

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
