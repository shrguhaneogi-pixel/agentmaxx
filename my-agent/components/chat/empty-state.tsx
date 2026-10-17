"use client";

import { Bot, ShoppingBag, Sparkles, Terminal, Wallet, CloudSun } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  ready: boolean;
  walletCreated: boolean;
  onSelectPrompt: (prompt: string) => void;
}

const CATEGORIZED_PROMPTS = [
  {
    category: "COMMERCE & BAZAAR",
    icon: <ShoppingBag className="size-3 text-primary" />,
    prompts: [
      "Show me what wares you have for sale in the bazaar.",
      "I offer 75 silver for the Brass Astrolabe.",
      "What is the current mood and status of Marzban's bazaar stall?",
    ],
  },
  {
    category: "CRYPTOGRAPHIC WALLET",
    icon: <Wallet className="size-3 text-cyan" />,
    prompts: [
      "What's in your wallet?",
      "Can you check your Base Sepolia balance?",
    ],
  },
  {
    category: "AUTONOMOUS TOOLS",
    icon: <CloudSun className="size-3 text-amber-400" />,
    prompts: [
      "What's the weather in Mumbai?",
      "Tell me a programming joke.",
    ],
  },
];

export function EmptyState({ ready, walletCreated, onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 px-4 text-center">
      {/* Visual Anchor: Precision Terminal Reticle */}
      <div className="relative flex size-20 items-center justify-center border border-primary/40 bg-card shadow-[0_0_25px_rgba(211,246,90,0.15)]">
        {/* Reticle Corner Marks */}
        <span className="absolute -top-1 -left-1 size-2 border-t-2 border-l-2 border-primary" />
        <span className="absolute -top-1 -right-1 size-2 border-t-2 border-r-2 border-primary" />
        <span className="absolute -bottom-1 -left-1 size-2 border-b-2 border-l-2 border-primary" />
        <span className="absolute -bottom-1 -right-1 size-2 border-b-2 border-r-2 border-primary" />

        <div className="flex size-14 items-center justify-center bg-primary/10 text-primary">
          <Bot className="size-8 animate-pulse" />
        </div>
      </div>

      {/* Main Headline & Context */}
      <div className="max-w-md flex flex-col gap-1.5">
        <div className="flex items-center justify-center gap-2 font-mono text-xs text-primary uppercase">
          <Terminal className="size-3" />
          <span>AUTONOMOUS AGENT ACTIVE</span>
        </div>
        <h2 className="font-heading text-2xl font-bold tracking-tight uppercase text-foreground">
          Awaiting Directives
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {!ready
            ? "Configure your Gemini API key in the setup panel on the left to begin reasoning."
            : !walletCreated
            ? "Create an agent wallet on the left to authorize paid APIs and Bazaar transactions, or explore read-only tools below."
            : "Dispatch tool calls, haggle in the bazaar, or inspect agent telemetry with the directives below."}
        </p>
      </div>

      {/* Categorized Example Prompts */}
      <div className="w-full max-w-xl flex flex-col gap-4 text-left">
        {CATEGORIZED_PROMPTS.map((group) => (
          <div key={group.category} className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground tracking-wider uppercase">
              {group.icon}
              <span>{group.category}</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {group.prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => onSelectPrompt(p)}
                  disabled={!ready}
                  className="group flex items-center justify-between border border-border/70 bg-background/60 p-2.5 font-mono text-xs text-foreground/90 transition-all hover:border-primary/60 hover:bg-muted/40 cursor-pointer disabled:opacity-50 text-left"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-primary font-bold transition-transform group-hover:translate-x-0.5">
                      &gt;
                    </span>
                    <span className="truncate">{p}</span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 uppercase ml-2 shrink-0">
                    Run Directive ↵
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
