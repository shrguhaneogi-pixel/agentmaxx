"use client";

import { ShoppingBag, Sparkles, Compass, Coins, CloudSun } from "lucide-react";

interface EmptyStateProps {
  ready: boolean;
  walletCreated: boolean;
  onSelectPrompt: (prompt: string) => void;
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

export function EmptyState({ ready, walletCreated, onSelectPrompt }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8 px-4 text-center">
      {/* Visual Anchor: Precision Brass Astrolabe & Merchant Reticle */}
      <div className="relative flex size-28 items-center justify-center border border-brass/50 bg-card/90 shadow-[0_0_35px_rgba(197,160,89,0.15)]">
        {/* Reticle Corner Marks */}
        <span className="absolute -top-1 -left-1 size-2.5 border-t-2 border-l-2 border-brass" />
        <span className="absolute -top-1 -right-1 size-2.5 border-t-2 border-r-2 border-brass" />
        <span className="absolute -bottom-1 -left-1 size-2.5 border-b-2 border-l-2 border-brass" />
        <span className="absolute -bottom-1 -right-1 size-2.5 border-b-2 border-r-2 border-brass" />

        {/* SVG Brass Astrolabe Visual Anchor */}
        <div className="relative flex size-22 items-center justify-center">
          {/* Outer Degree Ring */}
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 size-full animate-[spin_60s_linear_infinite] opacity-80"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#C5A059"
              strokeWidth="1"
              strokeDasharray="2 3"
              opacity="0.5"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#C5A059"
              strokeWidth="0.75"
              opacity="0.7"
            />
            {/* Cardinal ticks */}
            <line x1="50" y1="2" x2="50" y2="8" stroke="#C5A059" strokeWidth="1.5" />
            <line x1="50" y1="92" x2="50" y2="98" stroke="#C5A059" strokeWidth="1.5" />
            <line x1="2" y1="50" x2="8" y2="50" stroke="#C5A059" strokeWidth="1.5" />
            <line x1="92" y1="50" x2="98" y2="50" stroke="#C5A059" strokeWidth="1.5" />
          </svg>

          {/* Counter-Rotating Celestial Rete Ring */}
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 size-full animate-[spin_35s_linear_infinite_reverse] opacity-70"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="30"
              fill="none"
              stroke="#DFC27D"
              strokeWidth="0.8"
              strokeDasharray="4 4"
            />
            <ellipse
              cx="50"
              cy="42"
              rx="20"
              ry="14"
              fill="none"
              stroke="#DFC27D"
              strokeWidth="0.7"
              opacity="0.6"
            />
            {/* Celestial stars / pointers */}
            <circle cx="50" cy="28" r="1.5" fill="#C5A059" />
            <circle cx="68" cy="48" r="1.5" fill="#C5A059" />
            <circle cx="34" cy="54" r="1.5" fill="#C5A059" />
          </svg>

          {/* Central Astrolabe Alidade Cross & Core */}
          <div className="relative flex size-10 items-center justify-center border border-brass bg-crimson/50 shadow-[0_0_15px_rgba(197,160,89,0.35)]">
            <span className="font-serif text-[10px] font-bold text-brass select-none">
              MRZB
            </span>
          </div>
        </div>
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
