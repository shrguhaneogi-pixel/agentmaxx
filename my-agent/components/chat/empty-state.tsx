"use client";

import { ShoppingBag, Compass, Coins, CloudSun } from "lucide-react";
import { BazaarAstrolabe3D } from "@/components/astrolabe";
import type { AstrolabeMood } from "@/components/astrolabe/types";

interface EmptyStateProps {
  ready: boolean;
  walletCreated: boolean;
  onSelectPrompt: (prompt: string) => void;
  mood?: AstrolabeMood;
  round?: number;
  isNegotiating?: boolean;
  isProcessingCheckout?: boolean;
}

const CATEGORIZED_PROMPTS = [
  {
    category: "MARZBAN'S BAZAAR & COMMERCE",
    icon: <ShoppingBag className="size-3 text-brass" />,
    prompts: [
      "Show me what wares you have for sale in the bazaar.",
      "I offer 75 silver for the Brass Astrolabe.",
      "What is the current mood and status of Marzban's bazaar stall?",
    ],
  },
  {
    category: "CRYPTOGRAPHIC COIN POUCH",
    icon: <Coins className="size-3 text-cyan" />,
    prompts: [
      "What's in your wallet and Base Sepolia coin pouch?",
      "Can you check your Base Sepolia balance?",
    ],
  },
  {
    category: "AUTONOMOUS TOOLS & REASONING",
    icon: <CloudSun className="size-3 text-brass" />,
    prompts: [
      "What's the weather in Mumbai?",
      "Tell me a programming joke.",
      "Tell me about Japan.",
    ],
  },
];

export function EmptyState({
  ready,
  walletCreated,
  onSelectPrompt,
  mood = "neutral",
  round = 1,
  isNegotiating = false,
  isProcessingCheckout = false,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-4 px-2 text-center">
      {/* Visual Anchor: Cybernetic Bazaar Astrolabe & Reactive HUD */}
      <div className="w-full max-w-lg mx-auto">
        <BazaarAstrolabe3D
          mood={mood}
          round={round}
          isNegotiating={isNegotiating}
          isProcessingCheckout={isProcessingCheckout}
          size="sm"
        />
      </div>

      {/* Main Headline & Context */}
      <div className="max-w-md flex flex-col gap-1.5">
        <div className="flex items-center justify-center gap-2 font-mono text-xs text-brass uppercase">
          <Compass className="size-3" />
          <span>MARZBAN MERCHANT REASONING ACTIVE</span>
        </div>
        <h2 className="font-serif text-2xl font-bold tracking-tight uppercase text-parchment">
          Awaiting Trade Directives
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {!ready
            ? "Configure your Gemini API key in the stall panel to awaken Marzban's reasoning."
            : !walletCreated
            ? "Create an agent coin pouch on the left to authorize purchases, or haggle for wares above."
            : "Dispatch trade offers, inspect stall wares, or settle transactions on Base Sepolia below."}
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
                  className="group flex items-center justify-between border border-border/70 bg-card/60 p-2.5 font-mono text-xs text-parchment/90 transition-all hover:border-brass/70 hover:bg-card-elevated cursor-pointer disabled:opacity-50 text-left"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-brass font-bold transition-transform group-hover:translate-x-0.5">
                      &gt;
                    </span>
                    <span className="truncate">{p}</span>
                  </div>
                  <span className="font-mono text-[10px] text-brass opacity-0 transition-opacity group-hover:opacity-100 uppercase ml-2 shrink-0">
                    Propose ↵
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
