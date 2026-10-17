"use client";

import { useState } from "react";
import { ChevronDown, Code, ExternalLink, Play, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ToolDef {
  name: string;
  description: string;
}

interface ToolsPanelProps {
  tools: ToolDef[];
  onSelectPrompt: (prompt: string) => void;
}

// Map known tools to categories, action types, and example usage
const TOOL_META: Record<
  string,
  {
    category: "COMMERCE" | "WALLET" | "UTILITY";
    actionType: "STATE-CHANGING" | "READ-ONLY";
    samplePrompt: string;
    params?: string[];
  }
> = {
  list_wares: {
    category: "COMMERCE",
    actionType: "READ-ONLY",
    samplePrompt: "Show me what wares you have for sale in the bazaar.",
  },
  haggle_offer: {
    category: "COMMERCE",
    actionType: "STATE-CHANGING",
    samplePrompt: "I offer 75 silver for the Brass Astrolabe.",
    params: ["itemId", "offerPrice"],
  },
  pay_invoice: {
    category: "COMMERCE",
    actionType: "STATE-CHANGING",
    samplePrompt: "Yes, I confirm purchase of the deal.",
    params: ["dealId", "amount"],
  },
  get_receipt: {
    category: "COMMERCE",
    actionType: "READ-ONLY",
    samplePrompt: "Show me the receipt for my last bazaar purchase.",
    params: ["receiptId"],
  },
  get_stall_status: {
    category: "COMMERCE",
    actionType: "READ-ONLY",
    samplePrompt: "What is the current mood and status of Marzban's bazaar stall?",
  },
  get_my_wallet: {
    category: "WALLET",
    actionType: "READ-ONLY",
    samplePrompt: "What is your wallet address and balance?",
  },
  get_weather: {
    category: "UTILITY",
    actionType: "STATE-CHANGING",
    samplePrompt: "What's the weather in Mumbai?",
    params: ["city"],
  },
  get_joke: {
    category: "UTILITY",
    actionType: "READ-ONLY",
    samplePrompt: "Tell me a programming joke.",
  },
  get_country_info: {
    category: "UTILITY",
    actionType: "READ-ONLY",
    samplePrompt: "Tell me about Japan.",
    params: ["country"],
  },
};

export function ToolsPanel({ tools, onSelectPrompt }: ToolsPanelProps) {
  const [filter, setFilter] = useState<"ALL" | "COMMERCE" | "WALLET" | "UTILITY">("ALL");
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const filteredTools = tools.filter((t) => {
    if (filter === "ALL") return true;
    const meta = TOOL_META[t.name];
    return meta?.category === filter;
  });

  return (
    <Card className="border border-border/80 bg-card/90 shadow-lg">
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary">02</span>
            <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              // TOOL REGISTRY
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground uppercase">
            {tools.length} CAPABILITIES
          </span>
        </div>

        {/* Filter Category Chips */}
        <div className="flex flex-wrap gap-1.5 pt-3">
          {(["ALL", "COMMERCE", "WALLET", "UTILITY"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "font-mono text-[10px] px-2 py-0.5 border transition-all cursor-pointer uppercase",
                filter === cat
                  ? "border-primary bg-primary/20 text-primary font-semibold"
                  : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-4">
        {filteredTools.map((t) => {
          const meta = TOOL_META[t.name] ?? {
            category: "UTILITY" as const,
            actionType: "READ-ONLY" as const,
            samplePrompt: `Execute tool ${t.name}`,
          };
          const isExpanded = expandedTool === t.name;

          return (
            <div
              key={t.name}
              className={cn(
                "group flex flex-col border p-3 transition-colors bg-background/50",
                isExpanded ? "border-primary/50 bg-background" : "border-border/60 hover:border-border"
              )}
            >
              {/* Tool Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">&gt; {t.name}</span>
                    <span
                      className={cn(
                        "font-mono text-[9px] px-1.5 py-0.2 border uppercase",
                        meta.actionType === "STATE-CHANGING"
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                          : "border-cyan/40 bg-cyan/10 text-cyan"
                      )}
                    >
                      {meta.actionType}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {t.description}
                  </p>
                </div>

                {/* Quick Try Prompt Action */}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onSelectPrompt(meta.samplePrompt)}
                  className="size-6 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  title="Run sample prompt"
                  aria-label={`Try tool ${t.name}`}
                >
                  <Play className="size-3" />
                </Button>
              </div>

              {/* Expandable Parameters / Details */}
              {meta.params && meta.params.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/30 text-[10px] font-mono text-muted-foreground">
                  <span className="text-muted-foreground/80">PARAMS:</span>
                  {meta.params.map((p) => (
                    <code
                      key={p}
                      className="border border-border/40 bg-muted/60 px-1 py-0.2 text-foreground"
                    >
                      {p}
                    </code>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredTools.length === 0 && (
          <p className="py-4 text-center font-mono text-xs text-muted-foreground">
            No tools in this category.
          </p>
        )}

        {/* Footer Note */}
        <div className="mt-2 border-t border-border/40 pt-3 text-[11px] text-muted-foreground leading-normal">
          Tools are registered in <code className="font-mono text-primary bg-muted px-1 py-0.5">agent/tools.ts</code> and dynamically bound to Gemini tool declarations.
        </div>
      </CardContent>
    </Card>
  );
}
