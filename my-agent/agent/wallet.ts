/**
 * THE AGENT'S WALLET
 *
 * The agent owns a wallet (a private key). It uses it to sign payments,
 * so it can pay for APIs on its own. This is the "x402" idea:
 *
 *   1. Agent calls an API         ->  API answers "402 Payment Required" + a price
 *   2. Agent signs a payment      ->  with its wallet
 *   3. Agent retries with payment ->  API checks the signature and answers 200 OK
 *
 * You create the wallet with the "Create wallet" button on the page.
 * It is saved in `.agent-wallet.json` so it survives restarts.
 *
 * Payments here are signed but NOT sent on-chain (it's a demo, no real money).
 */
import fs from "fs";
import os from "os";
import path from "path";
import { createPublicClient, formatEther, http, verifyMessage, type Address, type Hex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const WALLET_TMP_PATH = path.join(os.tmpdir(), ".agent-wallet.json");

const chain = createPublicClient({
  chain: baseSepolia,
  transport: http(undefined, { timeout: 10_000 }),
});

export type Payment = {
  from: Address;
  to: Address;
  amount: string;
  asset: string;
  resource: string;
  nonce: string;
};

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

/** Fetch a URL. If it asks for payment (402), sign one with the wallet and try again. */
export async function payAndFetch(url: string, defaultBase = "http://localhost:3000"): Promise<PaymentExecutionResult> {
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

  const first = await fetch(resolvedUrl);
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

  const payment: Payment = {
    from: account.address,
    to: payTo,
    amount: price,
    asset,
    resource,
    nonce: crypto.randomUUID(),
  };
  const signature = await account.signMessage({ message: JSON.stringify(payment) });
  const header = Buffer.from(JSON.stringify({ payment, signature })).toString("base64");

  const paid = await fetch(resolvedUrl, { headers: { "X-PAYMENT": header } });
  const data: unknown = await paid.json().catch(async () => {
    const text = await paid.text().catch(() => "");
    return { error: text || `HTTP ${paid.status}` };
  });

  return {
    data,
    payment: { status: paid.status, amount: `${price} ${asset}`, to: payTo, signature: `${signature.slice(0, 18)}...` },
  };
}

/** Used by the API: is this X-PAYMENT header a real, signed payment? */
export async function verifyPayment(header: string | null): Promise<Payment | null> {
  if (!header) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(header, "base64").toString());
    if (typeof parsed !== "object" || parsed === null) return null;

    const record = parsed as Record<string, unknown>;
    if (!record.payment || typeof record.payment !== "object" || !record.signature || typeof record.signature !== "string") {
      return null;
    }

    const payment = record.payment as Payment;
    const signature = record.signature as Hex;

    if (!payment.from || !payment.to || !payment.amount || !payment.asset) {
      return null;
    }

    const valid = await verifyMessage({ address: payment.from, message: JSON.stringify(payment), signature });
    return valid ? payment : null;
  } catch {
    return null;
  }
}

