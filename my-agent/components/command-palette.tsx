"use client";

import { useEffect, useState, useRef } from "react";
import {
  Command,
  Search,
  ShoppingBag,
  Wallet,
  CloudSun,
  RotateCcw,
  ExternalLink,
  MessageSquare,
  Terminal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: "COMMERCE" | "WALLET" | "SYSTEM";
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  walletAddress: string | null;
  onClose: () => void;
  onSendPrompt: (prompt: string) => void;
  onClearMessages: () => void;
  onFocusInput: () => void;
  onCreateWallet?: () => void;
}

export function CommandPalette({
  open,
  walletAddress,
  onClose,
  onSendPrompt,
  onClearMessages,
  onFocusInput,
  onCreateWallet,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: "focus-input",
      title: "Focus Chat Composer",
      subtitle: "Jump cursor directly to directive prompt bar",
      category: "SYSTEM",
      icon: <MessageSquare className="size-4 text-primary" />,
      action: () => {
        onClose();
        onFocusInput();
      },
    },
    {
      id: "list-wares",
      title: "Browse Marzban's Bazaar Wares",
      subtitle: "Query stall inventory and current asking prices",
      category: "COMMERCE",
      icon: <ShoppingBag className="size-4 text-primary" />,
      action: () => {
        onSendPrompt("Show me what wares you have for sale in the bazaar.");
        onClose();
      },
    },
    {
      id: "haggle-astrolabe",
      title: "Haggle for Brass Astrolabe",
      subtitle: "Propose an offer of 75 silver for the astrolabe",
      category: "COMMERCE",
      icon: <ShoppingBag className="size-4 text-amber-400" />,
      action: () => {
        onSendPrompt("I offer 75 silver for the Brass Astrolabe.");
        onClose();
      },
    },
    {
      id: "stall-status",
      title: "Check Bazaar Stall Status & Mood",
      subtitle: "Inspect merchant mood and active reservations",
      category: "COMMERCE",
      icon: <ShoppingBag className="size-4 text-primary" />,
      action: () => {
        onSendPrompt("What is the current mood and status of Marzban's bazaar stall?");
        onClose();
      },
    },
    {
      id: "check-wallet",
      title: "Inspect Agent Crypto Wallet",
      subtitle: "Check Base Sepolia address and current balance",
      category: "WALLET",
      icon: <Wallet className="size-4 text-cyan" />,
      action: () => {
        onSendPrompt("What's in your wallet?");
        onClose();
      },
    },
    {
      id: "check-weather",
      title: "Query Weather via Paid API",
      subtitle: "Autonomous agent micropayment weather query",
      category: "SYSTEM",
      icon: <CloudSun className="size-4 text-blue-soft" />,
      action: () => {
        onSendPrompt("What's the weather in Mumbai?");
        onClose();
      },
    },
    {
      id: "clear-chat",
      title: "Clear Conversation History",
      subtitle: "Reset chat messages in current session",
      category: "SYSTEM",
      icon: <RotateCcw className="size-4 text-rose-400" />,
      action: () => {
        onClearMessages();
        onClose();
      },
    },
    ...(walletAddress
      ? [
          {
            id: "copy-address",
            title: "Copy Agent Wallet Address",
            subtitle: `Copy ${walletAddress.slice(0, 10)}... to clipboard`,
            category: "WALLET" as const,
            icon: <Wallet className="size-4 text-primary" />,
            action: () => {
              navigator.clipboard.writeText(walletAddress);
              onClose();
            },
          },
          {
            id: "view-basescan",
            title: "Open BaseScan Explorer",
            subtitle: `View address ${walletAddress.slice(0, 8)}... on Base Sepolia`,
            category: "WALLET" as const,
            icon: <ExternalLink className="size-4 text-cyan" />,
            action: () => {
              window.open(`https://sepolia.basescan.org/address/${walletAddress}`, "_blank");
              onClose();
            },
          },
        ]
      : onCreateWallet
      ? [
          {
            id: "create-wallet",
            title: "Generate Agent Crypto Wallet",
            subtitle: "Initialize new Viem keypair on Base Sepolia",
            category: "WALLET" as const,
            icon: <Wallet className="size-4 text-primary" />,
            action: () => {
              onCreateWallet();
              onClose();
            },
          },
        ]
      : []),
    {
      id: "get-faucet",
      title: "Get Base Sepolia Test ETH",
      subtitle: "Open official Base faucet documentation",
      category: "WALLET",
      icon: <ExternalLink className="size-4 text-cyan" />,
      action: () => {
        window.open("https://docs.base.org/base-chain/tools/network-faucets", "_blank");
        onClose();
      },
    },
  ];

  const filtered = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation inside command palette
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filtered, selectedIndex, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg border border-border/80 bg-card shadow-2xl overflow-hidden font-mono text-xs flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Palette Search Input Bar */}
        <div className="flex items-center gap-2.5 border-b border-border/50 px-3.5 py-3 bg-background">
          <Search className="size-4 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or filter directives..."
            className="w-full bg-transparent font-mono text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={onClose}
            className="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Close command palette"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Commands List */}
        <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No matching directives found.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "flex items-center gap-3 p-2.5 text-left transition-colors cursor-pointer border",
                    isSelected
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-transparent hover:bg-muted/40 text-foreground/90"
                  )}
                >
                  <div className="flex size-7 items-center justify-center border border-border/60 bg-background shrink-0">
                    {cmd.icon}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">{cmd.title}</span>
                      <span className="text-[9px] px-1.5 py-0.2 border border-border/50 bg-muted/40 text-muted-foreground uppercase">
                        {cmd.category}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {cmd.subtitle}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] text-primary shrink-0 uppercase font-semibold">
                      ENTER ↵
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-border/50 bg-background/90 px-3 py-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>AGENTMAXX COMMAND DISPATCH</span>
        </div>
      </div>
    </div>
  );
}
