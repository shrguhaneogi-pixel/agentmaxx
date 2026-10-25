"use client";

import { ShoppingBag, Smile, Meh, Frown, Sparkles, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export type Mood = "cheerful" | "neutral" | "grumpy";

interface BazaarStatusBannerProps {
  mood?: Mood;
  onSendPrompt: (prompt: string) => void;
  disabled: boolean;
}

export function BazaarStatusBanner({
  mood = "neutral",
  onSendPrompt,
  disabled,
}: BazaarStatusBannerProps) {
  const moodConfig = {
    cheerful: {
      label: "CHEERFUL",
      icon: <Smile className="size-3.5 text-emerald-400" />,
      textClass: "text-emerald-400",
      borderClass: "border-emerald-500/40 bg-emerald-950/20",
      description: "Merchant is in high spirits (0.95x price multiplier) and receptive to favorable counter-offers.",
    },
    neutral: {
      label: "NEUTRAL",
      icon: <Meh className="size-3.5 text-brass" />,
      textClass: "text-brass",
      borderClass: "border-brass/40 bg-brass/10",
      description: "Merchant is evaluating incoming offers with standard bazaar decorum (1.0x price multiplier).",
    },
    grumpy: {
      label: "GRUMPY",
      icon: <Frown className="size-3.5 text-rose-400" />,
      textClass: "text-rose-400",
      borderClass: "border-rose-500/40 bg-rose-950/20",
      description: "Merchant is irritated by low offers (1.15x price multiplier) and holding firm on counter-prices.",
    },
  }[mood];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/70 bg-card/90 px-4 py-2.5 font-mono text-xs shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex size-6 items-center justify-center border border-brass/40 bg-crimson/30 text-brass">
          <ShoppingBag className="size-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-parchment tracking-wide">MARZBAN&apos;S BAZAAR</span>
          <span className="text-muted-foreground/60">|</span>
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 border text-[10px] font-semibold",
              moodConfig.borderClass,
              moodConfig.textClass
            )}
            title={moodConfig.description}
          >
            {moodConfig.icon}
            <span>MOOD: {moodConfig.label}</span>
          </div>
        </div>
      </div>

      {/* Quick Bazaar Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSendPrompt("Show me what wares you have for sale in the bazaar.")}
          disabled={disabled}
          className="text-[11px] text-muted-foreground hover:text-brass transition-colors cursor-pointer underline underline-offset-4 disabled:opacity-50"
        >
          View Wares
        </button>
        <span className="text-border">|</span>
        <button
          onClick={() => onSendPrompt("What is the current mood and status of Marzban's bazaar stall?")}
          disabled={disabled}
          className="text-[11px] text-muted-foreground hover:text-brass transition-colors cursor-pointer underline underline-offset-4 disabled:opacity-50"
        >
          Stall Mood Status
        </button>
      </div>
    </div>
  );
}
