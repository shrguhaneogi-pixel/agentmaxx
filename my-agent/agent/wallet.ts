/**
 * THE AGENT'S WALLET
 *
 * The agent owns a wallet (a private key). It uses it to sign payments,
 * so it can pay for APIs on its own using the EIP-712 typed structured data
 * standard on Base Sepolia.
 *
 *   1. Agent calls an API         ->  API answers "402 Payment Required" + a price
 *   2. Agent signs a payment      ->  with its wallet via EIP-712 signTypedData
 *   3. Agent retries with payment ->  API verifies EIP-712 signature & claims nonce
 *
 * Payments here are signed test payments on Base Sepolia.
 */
import fs from "fs";
import os from "os";
import path from "path";
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  parseEther,
  parseEventLogs,
  verifyTypedData,
  type Address,
  type Hex,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { BazaarEscrowABI } from "./abi/BazaarEscrow";
import {
  buildPaymentMessage,
  getEIP712Domain,
  getVerifyingContract,
  EIP712_PAYMENT_TYPES,
  validatePaymentPayload,
  type PaymentPayload,
  type SignedPaymentAuthorization,
} from "./crypto";

const WALLET_TMP_PATH = path.join(os.tmpdir(), ".agent-wallet.json");

const chain = createPublicClient({
  chain: baseSepolia,
  transport: http(undefined, { timeout: 10_000 }),
});

export type Payment = PaymentPayload;

// In-memory fallback if file system is completely unavailable or ephemeral
let inMemoryPrivateKey: Hex | null = null;

/** Safely parse and validate a 32-byte hex private key from environment or storage. */
function parsePrivateKey(key: string | undefined | null): Hex | null {
  if (!key) return null;
  const trimmed = key.trim();
  if (!trimmed) return null;
  const formatted = (trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`) as Hex;
  if (!/^0x[0-9a-fA-F]{64}$/.test(formatted)) {
    return null;
  }
  return formatted;
}

/** Helper to extract a validated private key from a JSON wallet file safely. */
function readKeyFromFile(filePath: string): Hex | null {
  try {
    if (fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
      const fileContent = fs.readFileSync(/*turbopackIgnore: true*/ filePath, "utf8");
      const parsed: unknown = JSON.parse(fileContent);
      if (typeof parsed === "object" && parsed !== null && "privateKey" in parsed) {
        const rawKey = (parsed as { privateKey: unknown }).privateKey;
        if (typeof rawKey === "string") {
          return parsePrivateKey(rawKey);
        }
      }
    }
  } catch {
    // Continue to fallback
  }
  return null;
}

/** The wallet from .env, in-memory, or ephemeral storage. */
function loadAccount() {
  const envKey = parsePrivateKey(process.env.WALLET_PRIVATE_KEY);
  if (envKey) {
    try {
      return privateKeyToAccount(envKey);
    } catch {
      // Ignore invalid env key and fallback
    }
  }

  if (inMemoryPrivateKey) {
    try {
      return privateKeyToAccount(inMemoryPrivateKey);
    } catch {
      // Ignore and fallback
    }
  }

  // 1. Local development file fallback (scoped statically)
  const localKey =
    readKeyFromFile(path.join(process.cwd(), ".agent-wallet.json")) ??
    readKeyFromFile(path.join(process.cwd(), "my-agent", ".agent-wallet.json"));
  if (localKey) {
    try {
      return privateKeyToAccount(localKey);
    } catch {
      // Ignore and fallback
    }
  }

  // 2. Check ephemeral serverless storage in os.tmpdir()
  const tmpKey = readKeyFromFile(WALLET_TMP_PATH);
  if (tmpKey) {
    try {
      return privateKeyToAccount(tmpKey);
    } catch {
      // Ignore and fallback
    }
  }

  return null;
}

function requireAccount() {
  const account = loadAccount();
  if (!account) throw new Error("The agent has no wallet yet. Ask the user to click 'Create wallet' first.");
  return account;
}

/** Make a brand new wallet and persist it in-memory, ephemerally in os.tmpdir(), and locally if writable. */
export function createWallet(): Address {
  const existing = loadAccount();
  if (existing) return existing.address;

  const privateKey = generatePrivateKey();
  inMemoryPrivateKey = privateKey;

  // Persist ephemerally to os.tmpdir() to avoid read-only filesystem violations on serverless runtimes
  try {
    fs.writeFileSync(/*turbopackIgnore: true*/ WALLET_TMP_PATH, JSON.stringify({ privateKey }, null, 2));
  } catch {
    // Ephemeral in-memory fallback already holds the private key
  }

  // Also attempt to persist locally if filesystem is writable (e.g. local dev)
  try {
    const cwd = process.cwd();
    const localDir = fs.existsSync(path.join(cwd, "my-agent")) ? path.join(cwd, "my-agent") : cwd;
    const localWalletPath = path.join(localDir, ".agent-wallet.json");
    if (!fs.existsSync(localWalletPath)) {
      fs.writeFileSync(/*turbopackIgnore: true*/ localWalletPath, JSON.stringify({ privateKey }, null, 2));
    }
  } catch {
    // Read-only filesystem in serverless environments (e.g. EROFS) handled gracefully
  }

  return privateKeyToAccount(privateKey).address;
}

export function getWalletAddress(): Address | null {
  return loadAccount()?.address ?? null;
}

export async function getWalletBalance(): Promise<string> {
  const account = requireAccount();
  const wei = await chain.getBalance({ address: account.address });
  return `${formatEther(wei)} ETH`;
}

export interface PaymentExecutionResult {
  data: unknown;
  payment?: {
    status: number;
    amount: string;
    to: Address;
    signature: string;
  };
}

/** Fetch a URL. If it asks for payment (402), sign an EIP-712 payment with the wallet and try again. */
export async function payAndFetch(
  url: string,
  defaultBase = "http://localhost:3000",
  options?: { timeoutMs?: number }
): Promise<PaymentExecutionResult> {
  const timeoutMs = options?.timeoutMs ?? 5000;
  let resolvedUrl: string;
  let resource: string;
  try {
    const parsed = new URL(url, defaultBase);
    resolvedUrl = parsed.toString();
    resource = parsed.pathname.replace(/^\/\/+/, "/");
  } catch {
    resolvedUrl = url;
    resource = url;
  }

  let first: Response;
  try {
    first = await fetch(resolvedUrl, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (err: unknown) {
    if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
      throw new Error(`Endpoint request timed out (${timeoutMs}ms limit). Aborted to prevent serverless timeout.`);
    }
    throw err;
  }

  if (first.status !== 402) {
    if (!first.ok) throw new Error(`API request failed: ${first.status} ${first.statusText}`);
    const data: unknown = await first.json().catch(async () => {
      const text = await first.text().catch(() => "");
      return { response: text };
    });
    return { data };
  }

  const account = requireAccount();
  const paymentOffer = (await first.json().catch(() => ({}))) as Record<string, unknown>;
  const price = typeof paymentOffer.price === "string" ? paymentOffer.price : "0.01";
  const asset = typeof paymentOffer.asset === "string" ? paymentOffer.asset : "USDC";
  const payTo = (typeof paymentOffer.payTo === "string" ? paymentOffer.payTo : "0x000000000000000000000000000000000000dEaD") as Address;

  // Generate 5-minute deadline and cryptographic UUID nonce
  const deadline = Math.floor(Date.now() / 1000) + 300;
  const nonce = crypto.randomUUID();

  const payment: Payment = {
    from: account.address,
    to: payTo,
    amount: price,
    asset,
    resource,
    nonce,
    deadline,
  };

  // EIP-712 Typed Structured Data Signing
  const signature = await account.signTypedData({
    domain: getEIP712Domain(),
    types: EIP712_PAYMENT_TYPES,
    primaryType: "Payment",
    message: buildPaymentMessage(payment),
  });

  const authorization: SignedPaymentAuthorization = { payment, signature };
  const header = Buffer.from(JSON.stringify(authorization)).toString("base64");

  let paid: Response;
  try {
    paid = await fetch(resolvedUrl, {
      headers: { "X-PAYMENT": header },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err: unknown) {
    if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
      throw new Error(`Paid checkout request timed out (${timeoutMs}ms limit). Aborted to prevent serverless timeout.`);
    }
    throw err;
  }

  const data: unknown = await paid.json().catch(async () => {
    const text = await paid.text().catch(() => "");
    return { error: text || `HTTP ${paid.status}` };
  });

  return {
    data,
    payment: {
      status: paid.status,
      amount: `${price} ${asset}`,
      to: payTo,
      signature: `${signature.slice(0, 18)}...`,
    },
  };
}

/**
 * Used by the API: verifies incoming X-PAYMENT header using EIP-712 typed structured data verification.
 * Enforces deadline check, payload syntax validation, and cryptographic signature recovery against payment.from.
 */
export async function verifyPayment(header: string | null): Promise<Payment | null> {
  if (!header) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
    if (typeof parsed !== "object" || parsed === null) return null;

    const record = parsed as Record<string, unknown>;
    const rawPayment = record.payment;
    const signature = record.signature;

    if (typeof signature !== "string" || !signature.startsWith("0x")) {
      return null;
    }

    const payment = validatePaymentPayload(rawPayment);
    if (!payment) return null;

    // Reject expired authorizations immediately
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (nowSeconds > payment.deadline) {
      return null;
    }

    const valid = await verifyTypedData({
      address: payment.from,
      domain: getEIP712Domain(),
      types: EIP712_PAYMENT_TYPES,
      primaryType: "Payment",
      message: buildPaymentMessage(payment),
      signature: signature as Hex,
    });

    return valid ? payment : null;
  } catch {
    return null;
  }
}

export interface OnChainSettlementOptions {
  contractAddress?: Address;
  publicClient?: any;
  walletClient?: any;
  deadlineSeconds?: number;
  nonce?: string;
  confirmationTimeoutMs?: number;
}

export interface OnChainSettlementResult {
  success: boolean;
  status: "confirmed" | "pending_network_confirmation";
  txHash: Hex;
  blockNumber?: bigint;
  gasUsed?: bigint;
  dealId: string;
  from: Address;
  to: Address;
  amount: string;
  asset: string;
  nonce: string;
  message?: string;
  event?: {
    from: Address;
    to: Address;
    dealId: string;
    amount: bigint;
    asset: string;
    nonce: string;
  };
}

/**
 * Executes true on-chain settlement for a deal via the BazaarEscrow smart contract on Base Sepolia.
 * 1. Constructs typed EIP-712 structured data message.
 * 2. Cryptographically signs typed data using agent's wallet.
 * 3. Broadcasts settlePayment transaction via Viem walletClient.writeContract.
 * 4. Awaits block confirmation and finality via Viem publicClient.waitForTransactionReceipt with strict race timeout.
 * 5. Parses PaymentSettled event log and returns confirmed or pending transaction metrics.
 */
export async function executeOnChainSettlement(
  dealId: string,
  amount: string = "0.01",
  asset: string = "ETH",
  payTo: Address = "0x000000000000000000000000000000000000dEaD",
  options?: OnChainSettlementOptions
): Promise<OnChainSettlementResult> {
  const account = requireAccount();
  const contractAddress = options?.contractAddress || getVerifyingContract();
  const deadlineSeconds = options?.deadlineSeconds ?? 300;
  const deadline = Math.floor(Date.now() / 1000) + deadlineSeconds;
  const nonce = options?.nonce || crypto.randomUUID();

  // 1. Construct typed EIP-712 structured data message
  const paymentMessage = {
    from: account.address,
    to: payTo,
    amount,
    asset,
    resource: dealId,
    nonce,
    deadline: BigInt(deadline),
  };

  // 2. Sign typed data with agent's account
  const signature = await account.signTypedData({
    domain: getEIP712Domain(contractAddress),
    types: EIP712_PAYMENT_TYPES,
    primaryType: "Payment",
    message: paymentMessage,
  });

  // 3. Compute native value if asset is ETH
  let value = 0n;
  if (asset.toUpperCase() === "ETH") {
    try {
      value = parseEther(amount);
    } catch {
      value = 0n;
    }
  }

  // 4. Calldata struct matching BazaarEscrow.Payment
  const p = {
    from: account.address,
    to: payTo,
    amount,
    asset,
    resource: dealId,
    nonce,
    deadline: BigInt(deadline),
  };

  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

  const walClient =
    options?.walletClient ||
    createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(rpcUrl, { timeout: 15_000 }),
    });

  const pubClient =
    options?.publicClient ||
    createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl, { timeout: 15_000 }),
    });

  // 5. Broadcast contract transaction
  const hash: Hex = await walClient.writeContract({
    address: contractAddress,
    abi: BazaarEscrowABI,
    functionName: "settlePayment",
    args: [p, signature],
    value,
  });

  // 6. Await block inclusion with strict timeout (default 8s) to prevent serverless 504 proxy kill
  const confirmationTimeoutMs = options?.confirmationTimeoutMs ?? 8000;
  let timeoutTimer: NodeJS.Timeout | undefined;

  let receipt: any = null;
  try {
    receipt = await Promise.race([
      pubClient.waitForTransactionReceipt({ hash }),
      new Promise((_, reject) => {
        timeoutTimer = setTimeout(() => reject(new Error("NETWORK_TIMEOUT")), confirmationTimeoutMs);
      }),
    ]);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "NETWORK_TIMEOUT") {
      // Transaction was broadcast, but block confirmation timed out.
      // Return pending_network_confirmation immediately to prevent 504 timeout.
      return {
        success: true,
        status: "pending_network_confirmation",
        txHash: hash,
        dealId,
        from: account.address,
        to: payTo,
        amount,
        asset,
        nonce,
        message: `Transaction broadcasted to Base Sepolia (tx: ${hash}). Awaiting network confirmation.`,
      };
    }
    throw err;
  } finally {
    if (timeoutTimer) clearTimeout(timeoutTimer);
  }

  if (receipt?.status === "reverted") {
    throw new Error(`Transaction reverted on-chain (tx: ${hash})`);
  }

  // 7. Parse PaymentSettled event log
  let settledEvent: any = undefined;
  try {
    const parsedLogs = parseEventLogs({
      abi: BazaarEscrowABI,
      eventName: "PaymentSettled",
      logs: receipt?.logs || [],
    });
    if (parsedLogs.length > 0) {
      settledEvent = parsedLogs[0].args;
    }
  } catch {
    // If mock or logs not formatted with event, proceed safely
  }

  return {
    success: true,
    status: "confirmed",
    txHash: hash,
    blockNumber: receipt?.blockNumber ?? 0n,
    gasUsed: receipt?.gasUsed ?? 0n,
    dealId,
    from: account.address,
    to: payTo,
    amount,
    asset,
    nonce,
    event: settledEvent
      ? {
          from: settledEvent.from,
          to: settledEvent.to,
          dealId: settledEvent.dealId,
          amount: settledEvent.amount,
          asset: settledEvent.asset,
          nonce: settledEvent.nonce,
        }
      : undefined,
  };
}
