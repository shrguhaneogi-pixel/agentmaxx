"use client";

import { useRef, useEffect } from "react";
import { SendHorizontal, Compass, Sparkles, Coins, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComposerProps {
  input: string;
  ready: boolean;
  thinking: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onSubmit: (text: string) => void;
}

const QUICK_ACTIONS = [
  { label: "View Stall Wares", prompt: "Show me what wares you have for sale in the bazaar." },
  { label: "Coin Pouch Balance", prompt: "What's in your wallet?" },
  { label: "Stall Mood Status", prompt: "What is the current mood and status of Marzban's bazaar stall?" },
];

export function Composer({
  input,
  ready,
  thinking,
  inputRef: externalInputRef,
  onChange,
  onSubmit,
}: ComposerProps) {
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;

  useEffect(() => {
    if (ready && !thinking) {
      inputRef.current?.focus();
    }
  }, [ready, thinking, inputRef]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || thinking || !ready) return;
    onSubmit(input);
  }

  return (
    <div className="flex flex-col gap-2 pt-2">
      {/* Quick Action Chips */}
      <div className="flex flex-wrap items-center gap-1.5 px-1 font-mono text-[10px]">
        <span className="text-muted-foreground uppercase flex items-center gap-1">
          <Sparkles className="size-2.5 text-brass" /> QUICK:
        </span>
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => onSubmit(action.prompt)}
            disabled={!ready || thinking}
            className="border border-border/60 bg-card px-2 py-0.5 text-muted-foreground hover:text-parchment hover:border-brass/50 transition-colors disabled:opacity-50 cursor-pointer uppercase"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Main Bazaar Composer Bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div
          className={cn(
            "flex flex-1 items-center border bg-card/90 transition-colors focus-within:border-brass focus-within:shadow-[0_0_15px_rgba(197,160,89,0.25)]",
            !ready && "opacity-50 border-border/40",
            ready && "border-border/80"
          )}
        >
          {/* Bazaar Prompt Prefix */}
          <div className="flex items-center pl-3 pr-1 text-muted-foreground font-mono text-xs select-none">
            <span className="text-brass font-bold">marzban/stall</span>
            <span className="ml-1 text-brass/70">❯</span>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                onChange("");
              }
            }}
            placeholder={
              ready
                ? "Enter trade offer (e.g. 'I offer 75 silver for the Brass Astrolabe') or ask Marzban..."
                : "Configure Gemini API key to activate trade prompt..."
            }
            disabled={!ready}
            className="h-11 w-full bg-transparent px-2.5 font-mono text-xs sm:text-sm text-parchment placeholder:text-muted-foreground/60 outline-none disabled:cursor-not-allowed"
            aria-label="Merchant trade prompt"
          />

          <span className="hidden sm:inline-block pr-3 font-mono text-[10px] text-muted-foreground/60">
            ENTER ↵
          </span>
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          disabled={!ready || thinking || !input.trim()}
          className="h-11 px-5 font-mono text-xs font-bold uppercase tracking-wider bg-brass text-background hover:bg-brass-light disabled:opacity-40"
          aria-label="Send trade directive"
        >
          <SendHorizontal className="size-4" />
        </Button>
      </form>
    </div>
  );
}
