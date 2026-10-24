/**
 * DISTRIBUTED ATOMIC REPLAY PROTECTION FOR AGENTMAXX
 *
 * Implements single-use nonce consumption semantics (SET key "1" NX EX ttl)
 * to prevent replay attacks across distributed application instances.
 */
import type { Address } from "viem";

export interface NonceClaimResult {
  success: boolean;
  reason?: string;
}

export interface NonceStore {
  /**
   * Atomically claims an unused nonce for a given signer address.
   * Fails if the nonce has already been claimed or if the deadline has passed.
   *
   * @param from Signer address
   * @param nonce Cryptographic nonce string
   * @param deadlineUnixSeconds Payment deadline in seconds since Unix epoch
   */
  claimNonce(from: Address, nonce: string, deadlineUnixSeconds: number): Promise<NonceClaimResult>;

  /** Resets stored nonces (used for test isolation). */
  reset(): Promise<void>;
}

/** In-memory atomic nonce store simulating Redis SET NX EX semantics with millisecond precision. */
export class InMemoryNonceStore implements NonceStore {
  private store = new Map<string, number>();

  async claimNonce(from: Address, nonce: string, deadlineUnixSeconds: number): Promise<NonceClaimResult> {
    const nowMs = Date.now();
    const nowSeconds = Math.floor(nowMs / 1000);
    const ttlSeconds = deadlineUnixSeconds - nowSeconds;

    if (ttlSeconds <= 0) {
      return { success: false, reason: "Payment authorization deadline has expired." };
    }

    const key = `agentmaxx:nonce:${from.toLowerCase()}:${nonce}`;
    this.sweepExpired(nowMs);

    const existingExpiry = this.store.get(key);
    if (existingExpiry !== undefined && existingExpiry > nowMs) {
      return { success: false, reason: "Replay Attack Detected: Nonce has already been consumed." };
    }

    // Atomically claim the nonce with bounded expiration
    const expiryMs = nowMs + ttlSeconds * 1000;
    this.store.set(key, expiryMs);
    return { success: true };
  }

  async reset(): Promise<void> {
    this.store.clear();
  }

  private sweepExpired(nowMs: number): void {
    if (this.store.size > 200) {
      for (const [key, expiry] of this.store.entries()) {
        if (expiry <= nowMs) {
          this.store.delete(key);
        }
      }
    }
  }
}

/**
 * Production Redis/Upstash nonce store utilizing atomic SET NX EX.
 * Automatically falls back gracefully or fails closed depending on environment.
 */
export class UpstashRedisNonceStore implements NonceStore {
  private restUrl: string;
  private restToken: string;

  constructor(restUrl: string, restToken: string) {
    this.restUrl = restUrl.replace(/\/+$/, "");
    this.restToken = restToken;
  }

  async claimNonce(from: Address, nonce: string, deadlineUnixSeconds: number): Promise<NonceClaimResult> {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const ttlSeconds = deadlineUnixSeconds - nowSeconds;

    if (ttlSeconds <= 0) {
      return { success: false, reason: "Payment authorization deadline has expired." };
    }

    const key = `agentmaxx:nonce:${from.toLowerCase()}:${nonce}`;

    try {
      // Execute atomic SET key "1" NX EX ttlSeconds
      const res = await fetch(`${this.restUrl}/set/${encodeURIComponent(key)}/1/NX/EX/${ttlSeconds}`, {
        headers: {
          Authorization: `Bearer ${this.restToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Upstash Redis HTTP error: ${res.status}`);
      }

      const data = (await res.json()) as { result?: string | null };
      if (data.result === "OK") {
        return { success: true };
      }

      return { success: false, reason: "Replay Attack Detected: Nonce has already been consumed." };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, reason: `Distributed nonce store operational error: ${msg}` };
    }
  }

  async reset(): Promise<void> {
    // In production Redis, reset is a no-op to preserve active replay state
  }
}

// Global singleton instance
let activeStore: NonceStore | null = null;

export function getNonceStore(): NonceStore {
  if (activeStore) return activeStore;

  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (restUrl && restToken) {
    activeStore = new UpstashRedisNonceStore(restUrl, restToken);
  } else {
    activeStore = new InMemoryNonceStore();
  }

  return activeStore;
}

/** Set custom nonce store (e.g. for testing or mock doubles). */
export function setNonceStore(store: NonceStore): void {
  activeStore = store;
}

/** Resets the active nonce store for test isolation. */
export async function resetNonceStore(): Promise<void> {
  if (activeStore) {
    await activeStore.reset();
  }
}
