import { NextResponse } from "next/server";
import { createWallet, getWalletAddress, getWalletBalance } from "@/agent/wallet";

export const dynamic = "force-dynamic";

interface WalletResponse {
  address: string | null;
  balance?: string;
}

// GET /api/wallet -> the agent's wallet address and balance (or null if none yet)
export async function GET(): Promise<NextResponse<WalletResponse>> {
  const address = getWalletAddress();
  if (!address) return NextResponse.json({ address: null });

  const balance = await getWalletBalance().catch(() => "unavailable");
  return NextResponse.json({ address, balance });
}

// POST /api/wallet -> create the agent's wallet
export async function POST(): Promise<NextResponse<{ address: string }>> {
  return NextResponse.json({ address: createWallet() });
}

