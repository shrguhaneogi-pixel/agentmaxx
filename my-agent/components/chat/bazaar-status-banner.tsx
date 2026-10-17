"use client";

import { ShoppingBag, Smile, Meh, Frown, Sparkles } from "lucide-react";
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
      borderClass: "border-emerald-500/30 bg-emerald-500/10",
      description: "Merchant is in good spirits; negotiation thresholds are favorable (0.95x).",
    },
    neutral: {
      label: "NEUTRAL",
      icon: <Meh className="size-3.5 text-amber-400" />,
      textClass: "text-amber-400",
      borderClass: "border-amber-500/30 bg-amber-500/10",
      description: "Merchant is calm and evaluating offers according to standard pricing (1.0x).",
    },
    grumpy: {
      label: "GRUMPY",
      icon: <Frown className="size-3.5 text-rose-400" />,
      textClass: "text-rose-400",
      borderClass: "border-rose-500/30 bg-rose-500/10",
      description: "Merchant has been insulted by lowball offers; counter prices are steep (1.15x).",
    },
  }[mood];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 border border-border/80 bg-card/90 px-3.5 py-2 font-mono text-xs shadow-inner">
      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
          <ShoppingBag className="size-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">MARZBAN&apos;S BAZAAR</span>
          <span className="text-muted-foreground">|</span>
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
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSendPrompt("Show me what wares you have for sale in the bazaar.")}
          disabled={disabled}
          className="text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer underline underline-offset-4 disabled:opacity-50"
        >
          View Wares
        </button>
        <span className="text-border">|</span>
        <button
          onClick={() => onSendPrompt("What is the current mood and status of Marzban's bazaar stall?")}
          disabled={disabled}
          className="text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer underline underline-offset-4 disabled:opacity-50"
        >
          Check Stall Status
        </button>
      </div>
    </div>
  );
}
