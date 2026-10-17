"use client";

import { useState } from "react";
import {
  Check,
  CircleAlert,
  Copy,
  ExternalLink,
  KeyRound,
  RefreshCw,
  Wallet,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface WalletInfo {
  address: string | null;
  balance?: string;
}

interface SetupPanelProps {
  hasApiKey: boolean;
  wallet: WalletInfo | null;
  creating: boolean;
  hasInteracted: boolean;
  onCreateWallet: () => Promise<void>;
  onRefreshWallet: () => void;
}

export function SetupPanel({
  hasApiKey,
  wallet,
  creating,
  hasInteracted,
  onCreateWallet,
  onRefreshWallet,
}: SetupPanelProps) {
  return (
    <Card className="border border-border/80 bg-card/90 shadow-lg">
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary">01</span>
            <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              // PROTOCOL SETUP
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground uppercase">
            REQUIRED PREREQUISITES
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col pt-6 gap-6">
        {/* Step 1: Gemini API Key */}
        <SetupStep
          number={1}
          title="Gemini API Key"
          done={hasApiKey}
          icon={<KeyRound className="size-3.5" />}
        >
          {hasApiKey ? (
            <div className="flex items-center gap-2 text-xs font-mono text-primary">
              <Check className="size-3.5" />
              <span>Key detected and operational.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2 text-xs">
              <p className="text-muted-foreground">
                Set <code className="bg-muted px-1.5 py-0.5 font-mono text-foreground">GEMINI_API_KEY</code> in{" "}
                <code className="bg-muted px-1.5 py-0.5 font-mono text-foreground">.env</code> to activate agent reasoning.
              </p>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Get API key from Google AI Studio <ExternalLink className="size-3" />
              </a>
            </div>
          )}
        </SetupStep>

        {/* Step 2: Agent Crypto Wallet */}
        <SetupStep
          number={2}
          title="Agent Autonomous Wallet"
          done={Boolean(wallet?.address)}
          icon={<Wallet className="size-3.5" />}
        >
          {wallet && !wallet.address ? (
            <div className="flex flex-col gap-3 text-xs">
              <p className="text-muted-foreground">
                The agent signs and authorizes payments autonomously via Viem to purchase Bazaar wares and pay for x402-gated APIs.
              </p>
              <Button
                onClick={onCreateWallet}
                disabled={creating}
                className="w-full sm:w-fit font-mono tracking-wider uppercase bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Wallet className="size-3.5 mr-2" />
                {creating ? "INITIALIZING KEYPAIR..." : "GENERATE AGENT WALLET"}
              </Button>
            </div>
          ) : wallet?.address ? (
            <WalletTerminalCard wallet={wallet} onRefresh={onRefreshWallet} />
          ) : (
            <p className="text-xs text-muted-foreground">Checking local wallet state...</p>
          )}
        </SetupStep>

        {/* Step 3: Conversational Directives */}
        <SetupStep
          number={3}
          title="Autonomous Directives"
          done={hasInteracted}
          icon={<Sparkles className="size-3.5" />}
          last
        >
          <p className="text-xs text-muted-foreground">
            Execute commands, haggle in Marzban&apos;s Bazaar, or dispatch tool calls via the command console.
          </p>
        </SetupStep>
      </CardContent>
    </Card>
  );
}

function SetupStep({
  number,
  title,
  done,
  last,
  icon,
  children,
}: {
  number: number;
  title: string;
  done: boolean;
  last?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center border font-mono text-xs font-bold transition-all",
            done
              ? "border-primary bg-primary text-primary-foreground shadow-[0_0_12px_rgba(211,246,90,0.3)]"
              : "border-border/80 bg-muted/40 text-muted-foreground"
          )}
        >
          {done ? <Check className="size-4" strokeWidth={2.5} /> : number}
        </span>
        {!last && (
          <span
            className={cn(
              "w-px flex-1 my-2 transition-colors",
              done ? "bg-primary/40" : "bg-border/40"
            )}
          />
        )}
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col gap-2.5", !last && "pb-6")}>
        <div className="flex items-center gap-2">
          {icon && <span className={cn(done ? "text-primary" : "text-muted-foreground")}>{icon}</span>}
          <h3 className="font-heading text-sm font-bold tracking-tight uppercase text-foreground">
            {title}
          </h3>
          <span
            className={cn(
              "ml-auto font-mono text-[10px] px-1.5 py-0.5 border uppercase",
              done
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-muted-foreground"
            )}
          >
            {done ? "READY" : "PENDING"}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

function WalletTerminalCard({
  wallet,
  onRefresh,
}: {
  wallet: WalletInfo;
  onRefresh: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const address = wallet.address ?? "";

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3 border border-border/80 bg-background/80 p-3.5 font-mono text-xs shadow-inner">
      {/* Address Header with Copy */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">WALLET ADDRESS:</span>
          <span className="truncate text-xs font-semibold text-primary">{address}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={copyAddress}
          className="shrink-0 h-7 px-2 font-mono text-[10px] border-border/60 hover:border-primary/50"
          aria-label="Copy wallet address"
        >
          {copied ? (
            <span className="flex items-center gap-1 text-primary">
              <Check className="size-3" /> COPIED
            </span>
          ) : (
            <span className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <Copy className="size-3" /> COPY
            </span>
          )}
        </Button>
      </div>

      {/* Balance Indicator with Refresh */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">BALANCE:</span>
          <span className="text-sm font-bold text-foreground">
            {wallet.balance !== undefined ? wallet.balance : "0.00 ETH"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onRefresh}
          className="size-6 text-muted-foreground hover:text-primary"
          aria-label="Refresh wallet balance"
        >
          <RefreshCw className="size-3" />
        </Button>
      </div>

      {/* External Explorer & Faucet Links */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border/40 pt-2.5 text-[11px] text-muted-foreground">
        <a
          href={`https://sepolia.basescan.org/address/${address}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:text-primary transition-colors"
        >
          BaseScan <ExternalLink className="size-3" />
        </a>
        <span className="text-border">|</span>
        <a
          href="https://docs.base.org/base-chain/tools/network-faucets"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:text-primary transition-colors"
        >
          Get Test ETH <ExternalLink className="size-3" />
        </a>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className="size-1.5 rounded-full bg-cyan" />
        <span>Base Sepolia testnet. Saved securely in local .agent-wallet.json.</span>
      </div>
    </div>
  );
}
