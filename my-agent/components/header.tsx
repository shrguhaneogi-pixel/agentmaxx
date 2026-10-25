"use client";

import { Cpu, Globe, Compass, Coins, Command } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  model?: string;
  hasApiKey: boolean;
  walletAddress: string | null;
  onOpenCommandPalette: () => void;
}

export function Header({
  model = "gemini-flash-latest",
  hasApiKey,
  walletAddress,
  onOpenCommandPalette,
}: HeaderProps) {
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  return (
    <header className="flex flex-col gap-4 border-b border-border/40 pb-5">
      {/* Top Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Brand & Merchant Identity */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center border border-brass/50 bg-crimson/40 text-brass shadow-sm">
            <Compass className="size-4.5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-base font-bold tracking-wider uppercase text-parchment">
              MARZBAN
            </span>
            <span className="text-muted-foreground hidden sm:inline text-xs font-mono">
              / AUTONOMOUS BAZAAR MERCHANT &amp; COMMERCE AGENT
            </span>
          </div>
        </div>

        {/* Live System Badges & Telemetry */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Model Status */}
          <div className="flex items-center gap-1.5 border border-border/70 bg-card px-2.5 py-1 text-muted-foreground shadow-sm">
            <Cpu className="size-3.5 text-brass" />
            <span className="text-[10px] tracking-wider uppercase text-muted-foreground">ENGINE:</span>
            <span className="text-parchment font-semibold">{model}</span>
            <span className="relative flex size-2 ml-1">
              {hasApiKey ? (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brass opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-brass" />
                </>
              ) : (
                <span className="inline-flex size-2 rounded-full bg-destructive" />
              )}
            </span>
          </div>

          {/* Network Badge */}
          <div className="flex items-center gap-1.5 border border-border/70 bg-card px-2.5 py-1 text-muted-foreground shadow-sm">
            <Globe className="size-3.5 text-cyan" />
            <span className="text-[10px] tracking-wider uppercase text-muted-foreground">NET:</span>
            <span className="text-parchment">BASE SEPOLIA</span>
          </div>

          {/* Wallet State Chip */}
          <div className="flex items-center gap-1.5 border border-border/70 bg-card px-2.5 py-1 shadow-sm">
            <Coins className="size-3.5 text-brass" />
            <span className="text-[10px] tracking-wider uppercase text-muted-foreground">POUCH:</span>
            {walletAddress ? (
              <span className="text-brass font-semibold">{shortAddress}</span>
            ) : (
              <span className="text-amber-400 font-medium">EMPTY POUCH</span>
            )}
          </div>

          {/* Command Palette Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-parchment border-border/70 hover:border-brass/50 bg-card"
            aria-label="Open command palette"
          >
            <Command className="size-3" />
            <span>COMMANDS</span>
            <kbd className="ml-1 rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
        </div>
      </div>
    </header>
  );
}
