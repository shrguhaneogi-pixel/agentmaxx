/**
 * BAZAAR CHECKOUT API ROUTE
 *
 * Mock x402 paid endpoint for bazaar transactions.
 * Gated by signed x402 payment from the agent's wallet.
 * Unpaid -> 402 Payment Required.
 * Signed payment -> 200 OK + completed deal & receipt.
 */
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { completePayment, getDeal, getReceipt, type Receipt } from "@/agent/bazaar";
import { verifyPayment } from "@/agent/wallet";

export const dynamic = "force-dynamic";

const PRICE = "0.01";
const ASSET = "USDC";
const PAY_TO = "0x000000000000000000000000000000000000dEaD";

interface CheckoutSuccessResponse {
  success: true;
  dealId: string;
  itemId: string;
  itemName: string;
  silverPrice: number;
  receiptId: string;
  receipt: Receipt;
  paidBy: string;
  network: string;
  message: string;
}

interface CheckoutErrorResponse {
  error: string;
  price?: string;
  asset?: string;
  payTo?: string;
  dealId?: string;
}

export async function GET(
  req: NextRequest
): Promise<NextResponse<CheckoutSuccessResponse | CheckoutErrorResponse>> {
  const dealId = req.nextUrl.searchParams.get("dealId");

  if (!dealId) {
    return NextResponse.json(
      { error: "Missing required query parameter: dealId" },
      { status: 400 }
    );
  }

  const payment = await verifyPayment(req.headers.get("X-PAYMENT"));
  if (!payment || payment.to !== PAY_TO || Number(payment.amount) < Number(PRICE)) {
    return NextResponse.json(
      { error: "Payment Required", price: PRICE, asset: ASSET, payTo: PAY_TO },
      { status: 402 }
    );
  }

  const deal = getDeal(dealId);
  if (!deal) {
    return NextResponse.json(
      { error: `Deal "${dealId}" not found in bazaar records.`, dealId },
      { status: 404 }
    );
  }

  // Handle already completed deals idempotently
  if (deal.status === "completed") {
    const existingReceipt = getReceipt(dealId);
    return NextResponse.json({
      success: true,
      dealId,
      itemId: deal.itemId,
      itemName: deal.itemName,
      silverPrice: deal.agreedPrice,
      receiptId: existingReceipt?.id ?? "rcpt-completed",
      receipt: existingReceipt ?? {
        id: "rcpt-completed",
        dealId,
        itemId: deal.itemId,
        itemName: deal.itemName,
        silverPrice: deal.agreedPrice,
        payer: payment.from,
        timestamp: new Date().toISOString(),
      },
      paidBy: payment.from,
      network: "Base Sepolia (testnet)",
      message: `Deal "${dealId}" was previously completed.`,
    });
  }

  const txHash = `0x${crypto.createHash("sha256").update(payment.nonce || `${dealId}-${payment.from}`).digest("hex")}`;
  const result = completePayment(dealId, payment.from, txHash);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, dealId },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    dealId,
    itemId: deal.itemId,
    itemName: deal.itemName,
    silverPrice: deal.agreedPrice,
    receiptId: result.receipt.id,
    receipt: result.receipt,
    paidBy: payment.from,
    network: "Base Sepolia (testnet)",
    message: `Checkout successful! Purchased ${deal.itemName} for ${deal.agreedPrice} in-game silver.`,
  });
}
