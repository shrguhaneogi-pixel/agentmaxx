"use client";

import { useMemo } from "react";
import { AstrolabeMood, ASTROLABE_COLORS } from "./types";
import { cn } from "@/lib/utils";

interface AstrolabeHUDProps {
  mood: AstrolabeMood;
  round: number;
  isNegotiating: boolean;
  isProcessingCheckout: boolean;
}

/**
 * AstrolabeHUD
 *
 * Precision 2.5D HUD overlay positioned above the 3D astrolabe canvas.
 * Communicates verified negotiation rounds, network status, and celestial
 * mathematical calibration marks without interfering with pointer events.
 */
export function AstrolabeHUD({
  mood,
  round,
  isNegotiating,
  isProcessingCheckout,
}: AstrolabeHUDProps) {
  const clampedRound = Math.min(Math.max(round, 1), 4);

  const stateBadge = useMemo(() => {
    if (isProcessingCheckout) {
      return {
        label: "CRYPTOGRAPHIC SETTLEMENT VERIFICATION",
        colorClass: "border-brass text-brass bg-brass/10 animate-pulse",
      };
    }
    if (isNegotiating) {
      return {
        label: "ACTIVE BAZAAR HAGGLING",
        colorClass: "border-luminousBrass text-luminousBrass bg-luminousBrass/10 animate-pulse",
      };
    }
    return {
      label: `STANDBY // MOOD: ${mood.toUpperCase()}`,
      colorClass: "border-border/60 text-muted-foreground bg-background/40",
    };
  }, [isProcessingCheckout, isNegotiating, mood]);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-4 text-xs font-mono select-none">
      {/* Top Row: Round Status & Active Mode */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Validated Negotiation Round */}
        <div className="flex flex-col gap-0.5 bg-background/80 backdrop-blur-sm border border-brass/30 px-2.5 py-1.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest">
            <span className="size-1.5 rounded-full bg-brass" />
            <span>NEGOTIATION PROGRESS</span>
          </div>
          <div className="text-sm font-bold tracking-wider text-parchment">
            ROUND 0{clampedRound}{" "}
            <span className="text-[11px] font-normal text-muted-foreground">/ 04</span>
          </div>
        </div>

        {/* Top-Right: Dynamic Execution State Badge */}
        <div
          className={cn(
            "border px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase backdrop-blur-sm shadow-sm",
            stateBadge.colorClass
          )}
        >
          {stateBadge.label}
        </div>
      </div>

      {/* Bottom Row: Network Telemetry & Celestial Instrument Marks */}
      <div className="flex items-end justify-between w-full">
        {/* Bottom-Left: Verified Network & Telemetry Waveform */}
        <div className="flex flex-col gap-1 bg-background/80 backdrop-blur-sm border border-border/60 px-2.5 py-1.5 shadow-sm">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>BASE SEPOLIA // CHAIN 84532</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-brass/80">
            <span>TELEMETRY:</span>
            {/* Ambient waveform pulse */}
            <svg className="w-16 h-3 text-brass/70" viewBox="0 0 64 12" fill="none">
              <path
                d="M0 6 H14 L18 1 L24 11 L28 4 L34 8 L38 6 H64"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[10px] font-bold text-parchment">ONLINE</span>
          </div>
        </div>

        {/* Bottom-Right: Astrolabe Calibration & Celestial Coordinates */}
        <div className="hidden sm:flex flex-col items-end gap-0.5 bg-background/80 backdrop-blur-sm border border-brass/30 px-2.5 py-1.5 shadow-sm text-[10px] text-muted-foreground">
          <div className="text-[9px] uppercase tracking-widest text-brass font-bold">
            ASTROLABE COORDINATES
          </div>
          <div className="flex gap-2">
            <span>AZ: <b className="text-parchment font-normal">142.8°</b></span>
            <span>ALT: <b className="text-parchment font-normal">48.2°</b></span>
            <span>DEC: <b className="text-parchment font-normal">+18.4°</b></span>
          </div>
        </div>
      </div>
    </div>
  );
}
