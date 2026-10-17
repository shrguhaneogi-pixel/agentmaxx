"use client";

import { Activity, ShieldCheck, Zap } from "lucide-react";

interface HeroProps {
  ready: boolean;
  walletCreated: boolean;
  toolsCount: number;
}

export function Hero({ ready, walletCreated, toolsCount }: HeroProps) {
  return (
    <section className="relative flex flex-col gap-5 pt-2 pb-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 font-mono text-xs text-primary tracking-widest uppercase">
          <span className="inline-block size-1.5 bg-primary" />
          <span>AUTONOMOUS AGENT SYSTEM // PROTOCOL V1</span>
        </div>

        <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-bold uppercase tracking-[-0.04em] leading-[0.92] text-foreground">
          AGENT COMMAND <span className="text-primary glow-accent">CENTER.</span>
        </h1>

        <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          An autonomous AI agent with cryptographic wallet execution, multi-step tool reasoning,
          and conversational merchant commerce via <span className="text-foreground font-medium">Marzban's Bazaar</span>.
        </p>
      </div>

      {/* Telemetry Indicator Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs">
        {/* Indicator 1 */}
        <div className="flex items-center gap-3 border border-border/60 bg-card/60 p-3">
          <div className="flex size-7 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
            <Zap className="size-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">01 // REASONING CORE</span>
            <span className="font-semibold text-foreground">
              {ready ? "ONLINE // ACTIVE LOOP" : "PENDING API KEY"}
            </span>
          </div>
        </div>

        {/* Indicator 2 */}
        <div className="flex items-center gap-3 border border-border/60 bg-card/60 p-3">
          <div className="flex size-7 shrink-0 items-center justify-center border border-cyan/30 bg-cyan/10 text-cyan">
            <Activity className="size-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">02 // TOOL REGISTRY</span>
            <span className="font-semibold text-foreground">
              {toolsCount > 0 ? `${toolsCount} TOOLS REGISTERED` : "INITIALIZING..."}
            </span>
          </div>
        </div>

        {/* Indicator 3 */}
        <div className="flex items-center gap-3 border border-border/60 bg-card/60 p-3">
          <div className="flex size-7 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
            <ShieldCheck className="size-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">03 // SETTLEMENT GATE</span>
            <span className="font-semibold text-foreground">
              {walletCreated ? "BASE SEPOLIA CONNECTED" : "AWAITING WALLET"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
