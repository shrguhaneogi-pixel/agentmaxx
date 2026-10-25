"use client";

import { Compass, ShieldCheck, ShoppingBag, Coins } from "lucide-react";

interface HeroProps {
  ready: boolean;
  walletCreated: boolean;
  toolsCount: number;
}

export function Hero({ ready, walletCreated, toolsCount }: HeroProps) {
  return (
    <section className="relative flex flex-col gap-4 pt-1 pb-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 font-mono text-xs text-brass tracking-widest uppercase">
          <span className="inline-block size-2 border border-brass bg-crimson" />
          <span>MARZBAN&apos;S GRAND BAZAAR // AUTONOMOUS AI MERCHANT</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-tight leading-[0.95] text-parchment">
          THE BAZAAR OF <span className="text-brass glow-brass">MARZBAN.</span>
        </h1>

        <p className="max-w-3xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          Step into a stateful merchant stall where ancient barter meets modern Web3 cryptography.
          Haggle for rare wares, counter offers in silver coins, and settle trades on-chain via{" "}
          <span className="text-parchment font-medium">Base Sepolia</span> and{" "}
          <span className="text-brass font-medium">EIP-712 typed data signatures</span>.
        </p>
      </div>

      {/* Telemetry Indicator Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 font-mono text-xs">
        {/* Indicator 1 */}
        <div className="flex items-center gap-3 border border-border/70 bg-card/80 p-3 shadow-sm">
          <div className="flex size-7 shrink-0 items-center justify-center border border-brass/40 bg-crimson/30 text-brass">
            <Compass className="size-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">01 // MERCHANT COGNITION</span>
            <span className="font-semibold text-parchment">
              {ready ? "ACTIVE REASONING LOOP" : "PENDING GEMINI KEY"}
            </span>
          </div>
        </div>

        {/* Indicator 2 */}
        <div className="flex items-center gap-3 border border-border/70 bg-card/80 p-3 shadow-sm">
          <div className="flex size-7 shrink-0 items-center justify-center border border-cyan/40 bg-cyan/10 text-cyan">
            <ShoppingBag className="size-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">02 // STALL WARES</span>
            <span className="font-semibold text-parchment">
              {toolsCount > 0 ? "6 EXOTIC WARES ONLINE" : "PREPARING STALL..."}
            </span>
          </div>
        </div>

        {/* Indicator 3 */}
        <div className="flex items-center gap-3 border border-border/70 bg-card/80 p-3 shadow-sm">
          <div className="flex size-7 shrink-0 items-center justify-center border border-brass/40 bg-brass/10 text-brass">
            <ShieldCheck className="size-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">03 // CRYPTO SETTLEMENT</span>
            <span className="font-semibold text-parchment">
              {walletCreated ? "BASE SEPOLIA SECURED" : "AWAITING COIN POUCH"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
