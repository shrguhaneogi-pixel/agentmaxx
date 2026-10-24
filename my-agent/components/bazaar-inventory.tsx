"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Compass,
  Sparkles,
  ShoppingBag,
  Coins,
  RefreshCw,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  Flame,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PublicWare {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  askingPrice: number;
  availability: "available" | "reserved" | "sold";
  roundsConsumed: number;
  roundsRemaining: number;
}

interface BazaarInventoryProps {
  onSelectPrompt: (prompt: string) => void;
  disabled: boolean;
  refreshTrigger?: number;
}

const WARE_ICONS: Record<string, string> = {
  "brass-astrolabe": "🧭",
  "saffron-tin": "🏺",
  "silk-scarf": "🧣",
  "haunted-lamp": "🪔",
  "spice-box": "📦",
  "map-scroll": "📜",
};

export function BazaarInventory({
  onSelectPrompt,
  disabled,
  refreshTrigger = 0,
}: BazaarInventoryProps) {
  const [wares, setWares] = useState<PublicWare[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [customOffer, setCustomOffer] = useState<string>("");

  const fetchWares = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bazaar");
      if (res.ok) {
        const data = await res.json();
        if (data.wares && Array.isArray(data.wares)) {
          setWares(data.wares);
        }
      }
    } catch (err) {
      console.error("Failed to load bazaar inventory:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWares();
  }, [fetchWares, refreshTrigger]);

  const handleQuickHaggle = (ware: PublicWare) => {
    // Generate a reasonable opening haggle offer (~75% of asking price, rounded)
    const suggestedOffer = Math.max(Math.round(ware.askingPrice * 0.75), 1);
    onSelectPrompt(`I offer ${suggestedOffer} silver for the ${ware.name}.`);
  };

  const handleCustomHaggle = (ware: PublicWare) => {
    const offerNum = parseInt(customOffer, 10);
    if (!isNaN(offerNum) && offerNum > 0) {
      onSelectPrompt(`I offer ${offerNum} silver for the ${ware.name}.`);
      setCustomOffer("");
      setSelectedItemId(null);
    } else {
      handleQuickHaggle(ware);
    }
  };

  return (
    <div
      data-cursor-interactive="true"
      className="bazaar-border flex flex-col gap-4 bg-card/95 p-4 sm:p-5 shadow-2xl relative overflow-hidden"
    >
      {/* Ornamental Bazaar Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center border border-brass/40 bg-crimson/30 text-brass shadow-sm">
            <ShoppingBag className="size-4" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold tracking-wide uppercase text-parchment flex items-center gap-2">
              <span>Marzban&apos;s Merchant Stall</span>
              <span className="text-[10px] font-mono font-normal text-brass px-1.5 py-0.2 border border-brass/30 bg-brass/10">
                6 EXOTIC WARES
              </span>
            </h3>
            <p className="text-[11px] font-mono text-muted-foreground">
              Direct off-chain negotiation with Base Sepolia cryptographic settlement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={fetchWares}
            disabled={loading}
            className="font-mono text-[10px] text-muted-foreground hover:text-brass flex items-center gap-1 border border-border/40"
            aria-label="Refresh inventory"
          >
            <RefreshCw className={cn("size-3", loading && "animate-spin text-brass")} />
            <span>SYNC STALL</span>
          </Button>
        </div>
      </div>

      {/* Wares Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {wares.map((ware) => {
          const isSelected = selectedItemId === ware.id;
          const isSold = ware.availability === "sold";
          const isReserved = ware.availability === "reserved";
          const icon = WARE_ICONS[ware.id] || "🏺";

          return (
            <div
              key={ware.id}
              data-cursor-interactive="true"
              className={cn(
                "group relative flex flex-col justify-between border p-3.5 transition-all duration-200",
                isSold
                  ? "border-border/30 bg-muted/20 opacity-60 grayscale-[40%]"
                  : isReserved
                  ? "border-amber-500/40 bg-amber-950/10"
                  : isSelected
                  ? "border-brass bg-crimson/20 shadow-[0_0_15px_rgba(197,160,89,0.2)]"
                  : "border-border/60 bg-card hover:border-brass/70 hover:bg-card-elevated"
              )}
            >
              {/* Corner Ornament on hover */}
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-brass opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              {/* Item Header */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl select-none" role="img" aria-label={ware.name}>
                      {icon}
                    </span>
                    <h4 className="font-serif text-xs sm:text-sm font-bold text-parchment leading-tight group-hover:text-brass transition-colors">
                      {ware.name}
                    </h4>
                  </div>

                  {/* Status Badge */}
                  {isSold ? (
                    <Badge
                      variant="outline"
                      className="border-destructive/40 bg-destructive/10 text-destructive text-[9px] font-mono shrink-0"
                    >
                      CLAIMED / SOLD
                    </Badge>
                  ) : isReserved ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 text-amber-400 text-[9px] font-mono shrink-0 animate-pulse"
                    >
                      RESERVED
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-brass/40 bg-brass/10 text-brass text-[9px] font-mono shrink-0"
                    >
                      AVAILABLE
                    </Badge>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {ware.description}
                </p>
              </div>

              {/* Price & Negotiation Rounds */}
              <div className="mt-3 flex flex-col gap-2 pt-2 border-t border-border/30">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-brass">
                    <Coins className="size-3.5" />
                    <span className="font-bold text-sm text-parchment">
                      {ware.askingPrice}{" "}
                      <span className="text-[10px] text-brass uppercase font-normal">Silver</span>
                    </span>
                    {ware.askingPrice < ware.basePrice && (
                      <span className="text-[10px] line-through text-muted-foreground">
                        {ware.basePrice}
                      </span>
                    )}
                  </div>

                  <div
                    className="flex items-center gap-1 text-[10px] text-muted-foreground"
                    title={`${ware.roundsRemaining} of 4 bargaining rounds remaining`}
                  >
                    <Clock className="size-3" />
                    <span>
                      Rounds:{" "}
                      <strong className={cn(ware.roundsRemaining <= 1 ? "text-destructive" : "text-parchment")}>
                        {ware.roundsRemaining}/4
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Action Controls */}
                {!isSold && !isReserved && (
                  <div className="flex items-center gap-1.5 pt-1">
                    {isSelected ? (
                      <div className="flex items-center gap-1.5 w-full">
                        <input
                          type="number"
                          placeholder="Your offer (silver)"
                          value={customOffer}
                          onChange={(e) => setCustomOffer(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCustomHaggle(ware);
                          }}
                          className="h-7 w-full border border-brass/60 bg-background px-2 text-xs font-mono text-parchment outline-none focus:ring-1 focus:ring-brass"
                          autoFocus
                          disabled={disabled}
                        />
                        <Button
                          size="xs"
                          onClick={() => handleCustomHaggle(ware)}
                          disabled={disabled}
                          className="h-7 px-2 bg-brass text-background hover:bg-brass-light font-mono text-[10px] font-bold"
                        >
                          Offer
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setSelectedItemId(null)}
                          className="h-7 px-1.5 text-muted-foreground hover:text-parchment text-[10px]"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 w-full">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleQuickHaggle(ware)}
                          disabled={disabled}
                          className="h-7 flex-1 border-brass/40 bg-crimson/20 text-brass hover:border-brass hover:bg-crimson/40 hover:text-parchment font-mono text-[10px] flex items-center justify-center gap-1"
                        >
                          <Flame className="size-3 text-brass" />
                          <span>Quick Haggle (~75%)</span>
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            setSelectedItemId(ware.id);
                            setCustomOffer(String(Math.round(ware.askingPrice * 0.8)));
                          }}
                          disabled={disabled}
                          className="h-7 px-2 border border-border/40 text-muted-foreground hover:text-parchment font-mono text-[10px]"
                          title="Enter custom silver offer"
                        >
                          Custom
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {isReserved && (
                  <Button
                    size="xs"
                    onClick={() => onSelectPrompt(`Yes, I confirm purchase and settlement for ${ware.name}.`)}
                    disabled={disabled}
                    className="h-7 w-full border border-amber-500/50 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-mono text-[10px] flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="size-3" />
                    <span>Authorize Settlement</span>
                  </Button>
                )}

                {isSold && (
                  <div className="flex items-center justify-center gap-1.5 py-1 text-[10px] font-mono text-muted-foreground">
                    <Lock className="size-3" />
                    <span>Purchased & Recorded in Receipts</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
