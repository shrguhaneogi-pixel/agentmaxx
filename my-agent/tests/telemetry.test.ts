import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  telemetry,
  redactSensitiveData,
  type TelemetrySpan,
} from "../agent/telemetry";

describe("Agent Observability & Telemetry Engine", () => {
  beforeEach(() => {
    telemetry.clearSpans();
  });

  describe("Structured Telemetry Spans", () => {
    it("creates a well-formed telemetry span with unique traceId and timestamp", () => {
      const span = telemetry.createSpan("gemini-flash-latest", "req-test-123");
      assert.ok(span.traceId.startsWith("tr-"), "traceId must start with tr-");
      assert.equal(span.requestId, "req-test-123");
      assert.equal(span.model, "gemini-flash-latest");
      assert.equal(span.reactIterations, 0);
      assert.equal(span.toolCallsCount, 0);
      assert.deepEqual(span.toolsInvoked, []);
      assert.equal(span.retries, 0);
      assert.equal(span.status, "success");
      assert.ok(span.startTime > 0);
      assert.ok(typeof span.timestamp === "string");
    });

    it("records span into collector and computes totalDurationMs", () => {
      const span = telemetry.createSpan("gemini-flash-latest");
      span.reactIterations = 2;
      span.toolCallsCount = 3;
      span.toolsInvoked = ["list_wares", "haggle_offer", "pay_invoice"];
      span.settlementMilestone = "settlement_confirmed";

      telemetry.recordSpan(span);

      const recent = telemetry.getRecentSpans();
      assert.equal(recent.length, 1);
      assert.equal(recent[0].traceId, span.traceId);
      assert.equal(recent[0].reactIterations, 2);
      assert.equal(recent[0].toolCallsCount, 3);
      assert.equal(recent[0].settlementMilestone, "settlement_confirmed");
      assert.ok(typeof recent[0].totalDurationMs === "number");
      assert.ok(recent[0].totalDurationMs! >= 0);
    });

    it("respects circular buffer max bounds without memory leak", () => {
      for (let i = 0; i < 120; i++) {
        const span = telemetry.createSpan("test-model", `req-${i}`);
        telemetry.recordSpan(span);
      }

      const recent = telemetry.getRecentSpans();
      assert.equal(recent.length, 100, "Circular buffer must be capped at 100 spans");
      assert.equal(recent[recent.length - 1].requestId, "req-119");
    });
  });

  describe("Privacy & Cryptographic Redaction Guarantees", () => {
    it("strictly redacts 64-character EVM private keys from strings and payloads", () => {
      const fakePrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      const payload = {
        message: `Generated private key is ${fakePrivateKey}`,
        details: { raw: fakePrivateKey },
      };

      const redacted = redactSensitiveData(payload);
      assert.ok(!JSON.stringify(redacted).includes(fakePrivateKey), "Private key must NOT leak");
      assert.match(JSON.stringify(redacted), /\[REDACTED_SECRET\]|\[REDACTED_SENSITIVE\]/);
    });

    it("redacts Google API keys and bearer authorization tokens", () => {
      const fakeApiKey = "AIzaSyD-1234567890abcdefghijklmnopqrstu";
      const fakeBearer = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeak";
      const payload = {
        auth: fakeBearer,
        googleKey: fakeApiKey,
      };

      const redacted = redactSensitiveData(payload);
      assert.ok(!JSON.stringify(redacted).includes(fakeApiKey), "Google API key must be redacted");
      assert.ok(!JSON.stringify(redacted).includes("eyJhbGci"), "JWT token must be redacted");
    });

    it("redacts sensitive fields like signature, secret, and password in nested objects", () => {
      const sensitiveData = {
        safeField: "marzban-stall",
        signature: "0x1234567890abcdef",
        apiKey: "sensitive-api-val",
        clientSecret: "very-secret-password",
      };

      const redacted = redactSensitiveData(sensitiveData);
      assert.equal(redacted.safeField, "marzban-stall");
      assert.equal(redacted.signature, "[REDACTED_SENSITIVE]");
      assert.equal(redacted.apiKey, "[REDACTED_SENSITIVE]");
      assert.equal(redacted.clientSecret, "[REDACTED_SENSITIVE]");
    });
  });

  describe("Resilience & Error Isolation", () => {
    it("handles null, undefined, primitives, and cyclic data without crashing", () => {
      assert.equal(redactSensitiveData(null), null);
      assert.equal(redactSensitiveData(undefined), undefined);
      assert.equal(redactSensitiveData(42), 42);
      assert.equal(redactSensitiveData(true), true);
    });
  });
});
