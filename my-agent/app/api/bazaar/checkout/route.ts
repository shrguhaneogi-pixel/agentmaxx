/**
 * BAZAAR CHECKOUT API ROUTE
 *
 * Mock x402 paid endpoint for bazaar transactions.
 * Hardened with EIP-712 typed structured data verification and distributed
 * atomic replay protection (nonce caching with TTL).
 *
 * Dynamic route: bypasses all static caching to guarantee fresh deadlines and nonce checks.
 */
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { completePayment, getDeal, type Receipt } from "../../../../agent/bazaar";
import { verifyPayment } from "../../../../agent/wallet";
import { getNonceStore } from "../../../../agent/nonce";

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
  code?: string;
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

  const header = req.headers.get("X-PAYMENT");
  if (!header) {
    return NextResponse.json(
      { error: "Payment Required", price: PRICE, asset: ASSET, payTo: PAY_TO },
      { status: 402 }
    );
  }

  // 1. Inspect deadline before cryptographic evaluation
  try {
    const rawJson = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
    const rawDeadline =
      typeof rawJson?.payment?.deadline === "number"
        ? rawJson.payment.deadline
        : typeof rawJson?.payment?.deadline === "string"
        ? Number(rawJson.payment.deadline)
        : NaN;

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!isNaN(rawDeadline) && nowSeconds > rawDeadline) {
      return NextResponse.json(
        { error: "Payment authorization has expired.", code: "PAYMENT_EXPIRED" },
        { status: 403 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Malformed X-PAYMENT header payload.", code: "INVALID_HEADER" },
      { status: 400 }
    );
  }

  // 2. Cryptographic EIP-712 Verification
  const payment = await verifyPayment(header);
  if (!payment || payment.to !== PAY_TO || payment.asset !== ASSET || Number(payment.amount) < Number(PRICE)) {
    return NextResponse.json(
      { error: "Payment Required: Invalid or insufficient EIP-712 payment authorization.", price: PRICE, asset: ASSET, payTo: PAY_TO },
      { status: 402 }
    );
  }

  // 3. State Machine & Deal Verification
  const deal = getDeal(dealId);
  if (!deal) {
    return NextResponse.json(
      { error: `Deal "${dealId}" not found in bazaar records.`, dealId },
      { status: 404 }
    );
  }

  // 4. Distributed Atomic Replay Protection (SET NX EX)
  const nonceStore = getNonceStore();
  const claim = await nonceStore.claimNonce(payment.from, payment.nonce, payment.deadline);
  if (!claim.success) {
    return NextResponse.json(
      { error: claim.reason || "Replay Attack Detected: Nonce has already been consumed.", code: "REPLAY_DETECTED" },
      { status: 403 }
    );
  }

  // 5. Atomic State Transition & Receipt Issuance
  const txHash = `0x${crypto.createHash("sha256").update(payment.nonce || `${dealId}-${payment.from}`).digest("hex")}`;
  const isAlreadyCompleted = deal.status === "completed";
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
    message: isAlreadyCompleted
      ? `Deal "${dealId}" was previously completed.`
      : `Checkout successful! Purchased ${deal.itemName} for ${deal.agreedPrice} in-game silver.`,
  });
}
