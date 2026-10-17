"use client";

import { Cpu, Globe, Terminal, Wallet, Command } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  model?: string;
  hasApiKey: boolean;
  walletAddress: string | null;
  onOpenCommandPalette: () => void;
}

export function Header({ model = "gemini-flash-latest", hasApiKey, walletAddress, onOpenCommandPalette }: HeaderProps) {
  const shortAddress = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : null;

  return (
    <header className="flex flex-col gap-4 border-b border-border/40 pb-6">
      {/* Top Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center border border-primary/40 bg-primary/10 text-primary">
            <Terminal className="size-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-base font-bold tracking-wider uppercase text-foreground">
              AGENTMAXX
            </span>
            <span className="text-muted-foreground hidden sm:inline">
              / AUTONOMOUS COMMAND CENTER
            </span>
          </div>
        </div>

        {/* Live System Badges & Telemetry */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Model Status */}
          <div className="flex items-center gap-1.5 border border-border/60 bg-card px-2.5 py-1 text-muted-foreground">
            <Cpu className="size-3.5 text-primary" />
            <span className="text-[10px] tracking-wider uppercase text-muted-foreground">ENGINE:</span>
            <span className="text-foreground font-semibold">{model}</span>
            <span className="relative flex size-2 ml-1">
              {hasApiKey ? (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </>
              ) : (
                <span className="inline-flex size-2 rounded-full bg-destructive" />
              )}
            </span>
          </div>

          {/* Network Badge */}
          <div className="flex items-center gap-1.5 border border-border/60 bg-card px-2.5 py-1 text-muted-foreground">
            <Globe className="size-3.5 text-cyan" />
            <span className="text-[10px] tracking-wider uppercase text-muted-foreground">NET:</span>
            <span className="text-foreground">BASE SEPOLIA</span>
          </div>

          {/* Wallet State Chip */}
          <div className="flex items-center gap-1.5 border border-border/60 bg-card px-2.5 py-1">
            <Wallet className="size-3.5 text-primary" />
            <span className="text-[10px] tracking-wider uppercase text-muted-foreground">WALLET:</span>
            {walletAddress ? (
              <span className="text-primary font-semibold">{shortAddress}</span>
            ) : (
              <span className="text-amber-500 font-medium">NOT CREATED</span>
            )}
          </div>

          {/* Command Palette Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground border-border/70 hover:border-primary/50"
            aria-label="Open command palette"
          >
            <Command className="size-3" />
            <span>COMMANDS</span>
            <kbd className="ml-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
        </div>
      </div>
    </header>
  );
}
