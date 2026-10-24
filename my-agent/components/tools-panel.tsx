"use client";

import { useState } from "react";
import { ChevronDown, Code, Play, Terminal } from "lucide-react";
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

interface ToolParam {
  name: string;
  type: string;
  required: boolean;
  desc?: string;
}

// Verified tool metadata reflecting actual schemas in agent/tools.ts
const TOOL_META: Record<
  string,
  {
    category: "COMMERCE" | "WALLET" | "UTILITY";
    actionType: "STATE-CHANGING" | "READ-ONLY";
    samplePrompt: string;
    params: ToolParam[];
  }
> = {
  list_wares: {
    category: "COMMERCE",
    actionType: "READ-ONLY",
    samplePrompt: "Show me what wares you have for sale in the bazaar.",
    params: [],
  },
  haggle_offer: {
    category: "COMMERCE",
    actionType: "STATE-CHANGING",
    samplePrompt: "I offer 75 silver for the Brass Astrolabe.",
    params: [
      { name: "itemId", type: "string", required: true, desc: "Item unique ID (e.g. brass-astrolabe)" },
      { name: "offer", type: "integer", required: true, desc: "Silver offered (positive integer)" },
    ],
  },
  pay_invoice: {
    category: "COMMERCE",
    actionType: "STATE-CHANGING",
    samplePrompt: "Yes, I confirm purchase of the deal.",
    params: [
      { name: "dealId", type: "string", required: true, desc: "Agreed deal ID (e.g. deal-xxxxxxxx)" },
    ],
  },
  get_receipt: {
    category: "COMMERCE",
    actionType: "READ-ONLY",
    samplePrompt: "Show me the receipt for my last bazaar purchase.",
    params: [
      { name: "receiptId", type: "string", required: false, desc: "Optional receipt identifier" },
      { name: "dealId", type: "string", required: false, desc: "Optional deal identifier" },
      { name: "itemId", type: "string", required: false, desc: "Optional item identifier" },
    ],
  },
  get_stall_status: {
    category: "COMMERCE",
    actionType: "READ-ONLY",
    samplePrompt: "What is the current mood and status of Marzban's bazaar stall?",
    params: [],
  },
  get_my_wallet: {
    category: "WALLET",
    actionType: "READ-ONLY",
    samplePrompt: "What is your wallet address and balance?",
    params: [],
  },
  get_weather: {
    category: "UTILITY",
    actionType: "STATE-CHANGING",
    samplePrompt: "What's the weather in Mumbai?",
    params: [
      { name: "city", type: "string", required: true, desc: "City name for micropayment weather query" },
    ],
  },
  get_joke: {
    category: "UTILITY",
    actionType: "READ-ONLY",
    samplePrompt: "Tell me a programming joke.",
    params: [],
  },
  get_country_info: {
    category: "UTILITY",
    actionType: "READ-ONLY",
    samplePrompt: "Tell me about Japan.",
    params: [
      { name: "country", type: "string", required: true, desc: "Target country name" },
    ],
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
    <Card className="bazaar-border border border-border/80 bg-card/95 shadow-xl">
      <CardHeader className="border-b border-border/40 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-brass">02</span>
            <span className="font-serif text-xs font-semibold tracking-wider text-parchment uppercase">
              MERCHANT TOOL REGISTRY
            </span>
          </div>
          <span className="font-mono text-[10px] text-brass px-1.5 py-0.5 border border-brass/30 bg-brass/10">
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
            params: [],
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
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
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

                {/* Header Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setExpandedTool(isExpanded ? null : t.name)}
                    className="size-6 text-muted-foreground hover:text-foreground"
                    title={isExpanded ? "Collapse tool details" : "Expand tool details"}
                    aria-label={`Toggle details for ${t.name}`}
                  >
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform duration-200",
                        isExpanded && "rotate-180 text-primary"
                      )}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onSelectPrompt(meta.samplePrompt)}
                    className="size-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    title="Populate and focus sample directive"
                    aria-label={`Try tool ${t.name}`}
                  >
                    <Play className="size-3" />
                  </Button>
                </div>
              </div>

              {/* Collapsed Compact Params View */}
              {!isExpanded && meta.params.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/30 text-[10px] font-mono text-muted-foreground">
                  <span className="text-muted-foreground/80">PARAMS:</span>
                  {meta.params.map((p) => (
                    <code
                      key={p.name}
                      className="border border-border/40 bg-muted/60 px-1 py-0.2 text-foreground"
                    >
                      {p.name}{p.required ? "*" : ""}
                    </code>
                  ))}
                </div>
              )}

              {/* Expanded Detailed Schema View */}
              {isExpanded && (
                <div className="mt-3 flex flex-col gap-2.5 pt-2.5 border-t border-border/40 font-mono text-xs">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Code className="size-3 text-primary" /> Schema Parameters:
                    </span>
                    {meta.params.length === 0 ? (
                      <span className="text-[11px] text-muted-foreground italic">No input parameters required.</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {meta.params.map((p) => (
                          <div key={p.name} className="flex flex-col text-[11px] bg-muted/30 p-1.5 border border-border/30">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground">{p.name}</span>
                              <span className="text-[9px] text-muted-foreground">
                                {p.type} {p.required ? "(required)" : "(optional)"}
                              </span>
                            </div>
                            {p.desc && <span className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 pt-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Terminal className="size-3 text-primary" /> Sample Directive:
                    </span>
                    <div className="flex items-center justify-between gap-2 bg-background p-2 border border-border/50 text-[11px] text-foreground">
                      <span className="truncate">{meta.samplePrompt}</span>
                      <button
                        onClick={() => onSelectPrompt(meta.samplePrompt)}
                        className="text-[10px] text-primary hover:underline uppercase shrink-0 font-bold cursor-pointer"
                      >
                        Try Directive ↵
                      </button>
                    </div>
                  </div>
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
