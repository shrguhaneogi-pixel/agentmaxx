"use client";

import { useState } from "react";
import {
  Check,
  CircleAlert,
  Copy,
  ExternalLink,
  KeyRound,
  RefreshCw,
  Coins,
  Sparkles,
  ShieldCheck,
  Compass,
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
    <Card className="bazaar-border border border-border/80 bg-card/95 shadow-xl">
      <CardHeader className="border-b border-border/40 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-brass">01</span>
            <span className="font-serif text-xs font-semibold tracking-wider text-parchment uppercase">
              MERCHANT STALL PROTOCOL
            </span>
          </div>
          <span className="font-mono text-[10px] text-brass px-1.5 py-0.5 border border-brass/30 bg-brass/10">
            PREREQUISITES
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col pt-5 gap-5">
        {/* Step 1: Gemini API Key */}
        <SetupStep
          number={1}
          title="Merchant Cognition (Gemini)"
          done={hasApiKey}
          icon={<KeyRound className="size-3.5" />}
        >
          {hasApiKey ? (
            <div className="flex items-center gap-2 text-xs font-mono text-brass">
              <Check className="size-3.5" />
              <span>Cognition key active and reasoning.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                Set <code className="bg-muted px-1.5 py-0.5 font-mono text-parchment">GEMINI_API_KEY</code> in{" "}
                <code className="bg-muted px-1.5 py-0.5 font-mono text-parchment">.env</code> to awaken Marzban&apos;s negotiation engine.
              </p>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brass underline underline-offset-4 hover:text-brass-light"
              >
                Get API key from Google AI Studio <ExternalLink className="size-3" />
              </a>
            </div>
          )}
        </SetupStep>

        {/* Step 2: Agent Crypto Wallet / Coin Pouch */}
        <SetupStep
          number={2}
          title="Merchant Coin Pouch (Wallet)"
          done={Boolean(wallet?.address)}
          icon={<Coins className="size-3.5" />}
        >
          {wallet && !wallet.address ? (
            <div className="flex flex-col gap-3 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                Autonomous wallet powered by Viem for EIP-712 typed-data signing and on-chain Base Sepolia settlement.
              </p>
              <Button
                onClick={onCreateWallet}
                disabled={creating}
                className="w-full sm:w-fit font-mono tracking-wider uppercase bg-brass text-background hover:bg-brass-light font-bold"
              >
                <Coins className="size-3.5 mr-2" />
                {creating ? "FORGING KEYPAIR..." : "GENERATE COIN POUCH"}
              </Button>
            </div>
          ) : wallet?.address ? (
            <WalletTerminalCard wallet={wallet} onRefresh={onRefreshWallet} />
          ) : (
            <p className="text-xs text-muted-foreground">Checking local coin pouch state...</p>
          )}
        </SetupStep>

        {/* Step 3: Conversational Directives */}
        <SetupStep
          number={3}
          title="Bazaar Directives"
          done={hasInteracted}
          icon={<Compass className="size-3.5" />}
          last
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            Haggle with Marzban for wares, inspect stall receipts, or dispatch autonomous tool calls.
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
    <div className="flex gap-3.5">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center border font-mono text-xs font-bold transition-all",
            done
              ? "border-brass bg-brass text-background shadow-[0_0_12px_rgba(197,160,89,0.35)]"
              : "border-border/80 bg-muted/40 text-muted-foreground"
          )}
        >
          {done ? <Check className="size-4" strokeWidth={2.5} /> : number}
        </span>
        {!last && (
          <span
            className={cn(
              "w-px flex-1 my-2 transition-colors",
              done ? "bg-brass/40" : "bg-border/40"
            )}
          />
        )}
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col gap-2", !last && "pb-5")}>
        <div className="flex items-center gap-2">
          {icon && <span className={cn(done ? "text-brass" : "text-muted-foreground")}>{icon}</span>}
          <h3 className="font-serif text-sm font-bold tracking-tight uppercase text-parchment">
            {title}
          </h3>
          <span
            className={cn(
              "ml-auto font-mono text-[10px] px-1.5 py-0.5 border uppercase",
              done
                ? "border-brass/40 bg-brass/10 text-brass"
                : "border-border bg-muted/30 text-muted-foreground"
            )}
          >
            {done ? "ACTIVE" : "PENDING"}
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
  const [refreshing, setRefreshing] = useState(false);
  const address = wallet.address ?? "";

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRefresh() {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 1200);
  }

  return (
    <div className="flex flex-col gap-2.5 border border-border/80 bg-background/90 p-3 font-mono text-xs shadow-inner">
      {/* Address Header with Copy */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">COIN POUCH ADDRESS:</span>
          <span className="truncate text-xs font-semibold text-brass">{address}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={copyAddress}
          className="shrink-0 h-6 px-2 font-mono text-[10px] border-border/60 hover:border-brass/50 text-muted-foreground hover:text-parchment"
          aria-label="Copy wallet address"
        >
          {copied ? (
            <span className="flex items-center gap-1 text-brass font-bold">
              <Check className="size-3" /> COPIED
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Copy className="size-3" /> COPY
            </span>
          )}
        </Button>
      </div>

      {/* Balance Indicator with Refresh */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">SETTLEMENT BALANCE:</span>
          <span className="text-sm font-bold text-parchment">
            {wallet.balance !== undefined ? (
              wallet.balance === "unavailable" ? (
                <span className="text-muted-foreground font-normal text-xs uppercase">OFFLINE RPC</span>
              ) : (
                wallet.balance
              )
            ) : (
              <span className="text-muted-foreground font-normal text-xs animate-pulse">CHECKING...</span>
            )}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleRefresh}
          className="size-6 text-muted-foreground hover:text-brass"
          aria-label="Refresh wallet balance"
          disabled={refreshing}
        >
          <RefreshCw className={cn("size-3", refreshing && "animate-spin text-brass")} />
        </Button>
      </div>

      {/* External Explorer & Faucet Links */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
        <a
          href={`https://sepolia.basescan.org/address/${address}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:text-brass transition-colors"
        >
          BaseScan Explorer <ExternalLink className="size-3" />
        </a>
        <span className="text-border">|</span>
        <a
          href="https://docs.base.org/base-chain/tools/network-faucets"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:text-brass transition-colors"
        >
          Base Sepolia Faucet <ExternalLink className="size-3" />
        </a>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className="size-1.5 rounded-full bg-cyan" />
        <span>Base Sepolia (Chain 84532). Private keys isolated in .agent-wallet.json.</span>
      </div>
    </div>
  );
}
