/**
 * EIP-712 SINGLE SOURCE OF TRUTH FOR AGENTMAXX
 *
 * Canonical schema, domain separator, and types for typed structured-data
 * payment authorization on Base Sepolia.
 */
import type { Address, Hex } from "viem";

export const EIP712_DOMAIN_NAME = "Agentmaxx Bazaar";
export const EIP712_DOMAIN_VERSION = "1";
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const DEFAULT_VERIFYING_CONTRACT: Address = "0x000000000000000000000000000000000000dEaD";

/** Resolves verifying contract address: allows override via environment, defaults to placeholder. */
export function getVerifyingContract(): Address {
  const custom = process.env.PAYMENT_VERIFYING_CONTRACT?.trim();
  if (custom && /^0x[0-9a-fA-F]{40}$/.test(custom)) {
    return custom as Address;
  }
  return DEFAULT_VERIFYING_CONTRACT;
}

/** Reconstructs the canonical EIP-712 domain for Base Sepolia. */
export function getEIP712Domain(): {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: Address;
} {
  return {
    name: EIP712_DOMAIN_NAME,
    version: EIP712_DOMAIN_VERSION,
    chainId: BASE_SEPOLIA_CHAIN_ID,
    verifyingContract: getVerifyingContract(),
  };
}

/**
 * EIP-712 Payment primary type definition.
 * All fields are strictly typed to guarantee deterministic off-chain verification.
 */
export const EIP712_PAYMENT_TYPES = {
  Payment: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "amount", type: "string" },
    { name: "asset", type: "string" },
    { name: "resource", type: "string" },
    { name: "nonce", type: "string" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

/**
 * Wire/JSON representation of a Payment.
 * Uses a safe integer Unix timestamp (in seconds) for clean JSON serialization.
 */
export interface PaymentPayload {
  from: Address;
  to: Address;
  amount: string;
  asset: string;
  resource: string;
  nonce: string;
  deadline: number;
}

/**
 * EIP-712 structured data message format expected by Viem's signTypedData & verifyTypedData.
 * Converts uint256 deadline to bigint at the cryptographic boundary.
 */
export interface EIP712PaymentMessage {
  from: Address;
  to: Address;
  amount: string;
  asset: string;
  resource: string;
  nonce: string;
  deadline: bigint;
}

export interface SignedPaymentAuthorization {
  payment: PaymentPayload;
  signature: Hex;
}

/** Converts JSON PaymentPayload into Viem's expected typed message with bigint deadline. */
export function buildPaymentMessage(payment: PaymentPayload): EIP712PaymentMessage {
  return {
    from: payment.from,
    to: payment.to,
    amount: payment.amount,
    asset: payment.asset,
    resource: payment.resource,
    nonce: payment.nonce,
    deadline: BigInt(payment.deadline),
  };
}

/** Validates Ethereum hex address format. */
export function isValidAddress(val: unknown): val is Address {
  return typeof val === "string" && /^0x[0-9a-fA-F]{40}$/.test(val);
}

/**
 * Validates untrusted payload into a strictly typed PaymentPayload.
 * Rejects missing fields, malformed addresses, non-positive amounts, or invalid deadlines.
 */
export function validatePaymentPayload(raw: unknown): PaymentPayload | null {
  if (typeof raw !== "object" || raw === null) return null;
  const p = raw as Record<string, unknown>;

  if (!isValidAddress(p.from)) return null;
  if (!isValidAddress(p.to)) return null;

  if (typeof p.amount !== "string" || !p.amount.trim()) return null;
  const numAmount = Number(p.amount);
  if (isNaN(numAmount) || numAmount <= 0) return null;

  if (typeof p.asset !== "string" || !p.asset.trim()) return null;
  if (typeof p.resource !== "string" || !p.resource.trim()) return null;
  if (typeof p.nonce !== "string" || !p.nonce.trim() || p.nonce.length > 128) return null;

  const deadlineNum =
    typeof p.deadline === "number"
      ? p.deadline
      : typeof p.deadline === "string"
      ? Number(p.deadline)
      : NaN;

  if (!Number.isFinite(deadlineNum) || deadlineNum <= 0 || !Number.isInteger(deadlineNum)) {
    return null;
  }

  return {
    from: p.from as Address,
    to: p.to as Address,
    amount: p.amount.trim(),
    asset: p.asset.trim(),
    resource: p.resource.trim(),
    nonce: p.nonce.trim(),
    deadline: deadlineNum,
  };
}
