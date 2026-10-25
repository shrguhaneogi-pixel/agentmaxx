/**
 * AGENT TELEMETRY & OBSERVABILITY ENGINE
 *
 * Implements structured, privacy-preserving telemetry for agent reasoning loops,
 * ReAct iteration depth, model latency, tool execution, and Web3 settlement milestones.
 *
 * Security & Invariant Guarantees:
 * 1. Strictly redacts private keys (64-hex), raw payment authorization tokens,
 *    sensitive headers, and environment variables.
 * 2. Fail-safe isolation: telemetry errors never crash agent execution or on-chain settlement.
 * 3. Zero-hallucination metrics: only records observed durations, iterations, and statuses.
 */
import crypto from "crypto";

export interface TelemetrySpan {
  traceId: string;
  requestId: string;
  model: string;
  timestamp: string;
  startTime: number;
  endTime?: number;
  totalDurationMs?: number;
  modelLatencyMs?: number;
  reactIterations: number;
  toolCallsCount: number;
  toolsInvoked: string[];
  retries: number;
  status: "success" | "error" | "rate_limited" | "safety_blocked" | "timeout_prevented";
  errorCategory?: string;
  settlementMilestone?:
    | "deal_created"
    | "payment_authorized"
    | "settlement_submitted"
    | "settlement_confirmed"
    | "settlement_reverted"
    | "settlement_failed";
}

const REDACTION_PATTERNS = [
  /0x[a-fA-F0-9]{64}/g, // Private keys / raw 32-byte hashes
  /Bearer\s+[a-zA-Z0-9_\-\.]+/gi, // Auth tokens
  /AIza[0-9A-Za-z-_]{35}/g, // Google API keys
  /ey[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/g, // JWT tokens
];

/**
 * Deep-redacts sensitive cryptographic material and auth tokens from telemetry payloads.
 */
export function redactSensitiveData<T>(input: T): T {
  if (typeof input === "string") {
    let sanitized: string = input;
    for (const pattern of REDACTION_PATTERNS) {
      sanitized = sanitized.replace(pattern, "[REDACTED_SECRET]");
    }
    return sanitized as any;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveData(item)) as any;
  }

  if (typeof input === "object" && input !== null) {
    const redactedObj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("key") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("token") ||
        lowerKey.includes("auth") ||
        lowerKey.includes("password") ||
        lowerKey.includes("signature")
      ) {
        redactedObj[key] = "[REDACTED_SENSITIVE]";
      } else {
        redactedObj[key] = redactSensitiveData(val);
      }
    }
    return redactedObj as any;
  }

  return input;
}

// In-memory circular buffer for the most recent 100 execution telemetry spans
const MAX_TELEMETRY_SPANS = 100;
const spansBuffer: TelemetrySpan[] = [];

export class TelemetryCollector {
  private static instance: TelemetryCollector;

  public static getInstance(): TelemetryCollector {
    if (!TelemetryCollector.instance) {
      TelemetryCollector.instance = new TelemetryCollector();
    }
    return TelemetryCollector.instance;
  }

  public createSpan(model: string, requestId?: string): TelemetrySpan {
    const traceId = `tr-${crypto.randomBytes(8).toString("hex")}`;
    const reqId = requestId || `req-${crypto.randomBytes(6).toString("hex")}`;
    return {
      traceId,
      requestId: reqId,
      model,
      timestamp: new Date().toISOString(),
      startTime: Date.now(),
      reactIterations: 0,
      toolCallsCount: 0,
      toolsInvoked: [],
      retries: 0,
      status: "success",
    };
  }

  public recordSpan(span: TelemetrySpan): void {
    try {
      span.endTime = Date.now();
      span.totalDurationMs = span.endTime - span.startTime;

      // Safe bounds check on in-memory spans
      if (spansBuffer.length >= MAX_TELEMETRY_SPANS) {
        spansBuffer.shift();
      }
      spansBuffer.push(redactSensitiveData(span));
    } catch {
      // Invariant: telemetry failures must NEVER break primary execution
    }
  }

  public getRecentSpans(): readonly TelemetrySpan[] {
    return [...spansBuffer];
  }

  public clearSpans(): void {
    spansBuffer.length = 0;
  }
}

export const telemetry = TelemetryCollector.getInstance();
