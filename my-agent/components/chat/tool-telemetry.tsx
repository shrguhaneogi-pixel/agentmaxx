"use client";

import { useState } from "react";
import { ChevronRight, DollarSign, Terminal, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type PaymentSummary = {
  status?: number;
  amount: string;
  to: string;
  signature: string;
};

export type StepResult = {
  payment?: PaymentSummary;
  error?: string;
  [key: string]: unknown;
};

export type Step = {
  tool: string;
  args: unknown;
  result: StepResult | unknown;
  error?: boolean;
};

export function ToolTelemetry({ step }: { step: Step }) {
  const [open, setOpen] = useState(false);
  const resultObj = typeof step.result === "object" && step.result !== null ? (step.result as StepResult) : null;
  const payment = resultObj?.payment;
  const isFailed = step.error || Boolean(resultObj?.error);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="my-1.5 border border-border/80 bg-background/90 font-mono text-xs transition-colors shadow-sm"
    >
      <CollapsibleTrigger
        className="group flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
        aria-label={`Toggle telemetry for tool ${step.tool}`}
      >
        <ChevronRight
          className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-200",
            open && "rotate-90 text-primary"
          )}
        />

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Terminal className="size-3 text-primary" />
          <span className="text-[10px] uppercase tracking-wider">EXEC:</span>
        </div>

        <span className="font-bold text-primary">{step.tool}</span>

        {/* State Badges */}
        <div className="ml-auto flex items-center gap-1.5">
          {payment && (
            <Badge className="bg-blue/20 text-blue-soft border border-blue/40 font-mono text-[10px] uppercase flex items-center gap-1">
              <DollarSign className="size-2.5" /> PAID {payment.amount}
            </Badge>
          )}

          {isFailed ? (
            <Badge
              variant="destructive"
              className="font-mono text-[10px] uppercase flex items-center gap-1"
            >
              <XCircle className="size-2.5" /> FAILED
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] uppercase flex items-center gap-1"
            >
              <CheckCircle2 className="size-2.5" /> SUCCESS
            </Badge>
          )}
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="flex flex-col gap-2.5 border-t border-border/40 p-3 bg-card/60">
        {/* Payment Summary Box if x402 payment occurred */}
        {payment && (
          <div className="border border-blue/30 bg-blue/10 p-2.5 text-[11px] text-blue-soft">
            <div className="flex items-center justify-between font-bold uppercase pb-1 border-b border-blue/20">
              <span>x402 Micropayment Settled</span>
              <span>Amount: {payment.amount}</span>
            </div>
            <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-foreground/80 font-mono">
              <p className="truncate">Recipient: {payment.to}</p>
              <p className="truncate">Signature: {payment.signature}</p>
            </div>
          </div>
        )}

        <JsonViewer label="Invocation Input Arguments" value={step.args} />
        <JsonViewer label="Execution Return Payload" value={step.result} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function JsonViewer({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <pre className="max-h-48 overflow-auto border border-border/50 bg-black/60 p-2.5 text-[11px] text-foreground/90 leading-relaxed font-mono selection:bg-primary selection:text-black">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
