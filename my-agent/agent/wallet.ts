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

const CANDIDATE_WALLET_PATHS = [
  path.join(process.cwd(), ".agent-wallet.json"),
  path.join(process.cwd(), "my-agent", ".agent-wallet.json"),
  path.join(os.tmpdir(), ".agent-wallet.json"),
];

const chain = createPublicClient({ chain: baseSepolia, transport: http() });

export type Payment = { from: Address; to: Address; amount: string; asset: string; resource: string; nonce: string };

// In-memory fallback if file system is completely unavailable
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

/** The wallet from .env, .agent-wallet.json (cwd or tmpdir), or memory. */
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

  for (const filePath of CANDIDATE_WALLET_PATHS) {
    try {
      if (fs.existsSync(filePath)) {
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
        const key = parsePrivateKey(parsed?.privateKey);
        if (key) return privateKeyToAccount(key);
      }
    } catch {
      // Continue to next candidate path
    }
  }

  return null;
}

function requireAccount() {
  const account = loadAccount();
  if (!account) throw new Error("The agent has no wallet yet. Ask the user to click 'Create wallet' first.");
  return account;
}

/** Make a brand new wallet and persist it across standard or serverless filesystems. */
export function createWallet() {
  const existing = loadAccount();
  if (existing) return existing.address;

  const privateKey = generatePrivateKey();
  inMemoryPrivateKey = privateKey;

  // Attempt saving to cwd first, then to os.tmpdir() for serverless runtimes
  let saved = false;
  for (const filePath of CANDIDATE_WALLET_PATHS) {
    try {
      fs.writeFileSync(filePath, JSON.stringify({ privateKey }, null, 2));
      saved = true;
      break;
    } catch {
      // Continue to try next candidate path (e.g., /tmp)
    }
  }

  return privateKeyToAccount(privateKey).address;
}

export function getWalletAddress() {
  return loadAccount()?.address ?? null;
}

export async function getWalletBalance() {
  const account = requireAccount();
  const wei = await chain.getBalance({ address: account.address });
  return `${formatEther(wei)} ETH`;
}

/** Fetch a URL. If it asks for payment (402), sign one with the wallet and try again. */
export async function payAndFetch(url: string) {
  const first = await fetch(url);
  if (first.status !== 402) {
    if (!first.ok) throw new Error(`API request failed: ${first.status} ${first.statusText}`);
    return { data: await first.json() };
  }

  const account = requireAccount();
  const paymentOffer = await first.json().catch(() => ({}));
  const { price = "0.01", asset = "USDC", payTo = "0x000000000000000000000000000000000000dEaD" } = paymentOffer;

  const payment: Payment = {
    from: account.address,
    to: payTo,
    amount: price,
    asset,
    resource: new URL(url).pathname,
    nonce: crypto.randomUUID(),
  };
  const signature = await account.signMessage({ message: JSON.stringify(payment) });
  const header = Buffer.from(JSON.stringify({ payment, signature })).toString("base64");

  const paid = await fetch(url, { headers: { "X-PAYMENT": header } });
  const data = await paid.json().catch(async () => {
    const text = await paid.text().catch(() => "");
    return { error: text || `HTTP ${paid.status}` };
  });

  return {
    data,
    payment: { status: paid.status, amount: `${price} ${asset}`, to: payTo, signature: `${signature.slice(0, 18)}...` },
  };
}

/** Used by the API: is this X-PAYMENT header a real, signed payment? */
export async function verifyPayment(header: string | null) {
  if (!header) return null;
  try {
    const { payment, signature } = JSON.parse(Buffer.from(header, "base64").toString()) as {
      payment: Payment;
      signature: Hex;
    };
    const valid = await verifyMessage({ address: payment.from, message: JSON.stringify(payment), signature });
    return valid ? payment : null;
  } catch {
    return null;
  }
}
