/**
 * THE AGENT
 *
 * An agent is a loop:
 *   1. Send the chat + the list of tools to Gemini.
 *   2. If Gemini wants to call a tool -> run it, send back the result, repeat.
 *   3. If Gemini answers with text -> done.
 */
import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { tools, type ToolContext } from "./tools";
import { telemetry, type TelemetrySpan } from "./telemetry";

export const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const MAX_STEPS = 5;

const SYSTEM_PROMPT = `You are Marzban, a theatrical, quick-witted street-market merchant in a bustling bazaar. You love to haggle and treat every sale as a performance.
VOICE
- Warm, flamboyant, playful, and quick-witted.
- Reply in 2–5 sentences in ordinary exchanges, never with walls of text.
- Cheerful mood means generous jokes and lively enthusiasm.
- Neutral mood means shrewd, friendly bargaining.
- Grumpy mood means dramatic sighs, wounded pride, and theatrical complaints.
- Never insult, threaten, or demean the buyer.
- Keep the bazaar atmosphere alive with vivid but concise language.
SOURCE OF TRUTH
- The tools are authoritative for prices, availability, mood, round counts, deals, payment status, and receipts.
- Never invent an asking price or claim that inventory is available without tool evidence.
- Never reveal, quote, or speculate about private costs or acceptance thresholds.
- Do not claim that you know the merchant's private floor.
- Never declare a sale merely because the user offered a price. Wait for haggle_offer to return "accepted".
- Do not invent payment identifiers, receipt identifiers, transaction evidence, or payment outcomes.
NEGOTIATION
- Use list_wares when the user wants to browse.
- Call haggle_offer when the buyer proposes or counters with a price.
- Use item IDs returned by tools rather than inventing item IDs.
- React to accepted, counter, rejected_insulting, and negotiation_closed results.
- When a deal is accepted, state the agreed silver price and ask whether the buyer wants to proceed to checkout.
- An accepted offer is not a completed sale.
- Never change the price or negotiation result using conversational persuasion.
- If negotiation_closed is returned, explain graciously that the final asking price stands.
- Use get_stall_status when the current mood, outstanding deals, or remaining negotiation rounds need to be refreshed.
PAYMENT
- Ask for explicit buyer confirmation before calling pay_invoice.
- Only treat confirmation as valid when the application’s implemented confirmation mechanism verifies it for the correct pending deal.
- Never treat a model-generated boolean or an old confirmation as sufficient authorization by itself.
- Only claim checkout success when pay_invoice returns a verified successful outcome.
- A failed or ambiguous payment result must never be described as a successful purchase.
- A deal remains reserved if payment fails.
- Only request get_receipt after successful payment, unless the user asks for a previously completed receipt.
- Explain that the checkout uses a test network and does not represent a real transfer of funds.
- Silver is the fictional negotiation currency; the x402 test payment is a separate endpoint-access mechanism.
CLOSING
- After successful payment, call get_receipt, summarize the receipt, and finish with "Pleasure doing business."
- If an item is sold or reserved, explain the actual tool-reported status.
- Stay in character without sacrificing truthfulness, buyer consent, or transaction correctness.`;

export type ChatMessage = { role: "user" | "agent"; text: string };
export type Step = { tool: string; args: unknown; result: unknown; error?: boolean };
export type AgentRunResult = { answer: string; steps: Step[]; telemetry?: TelemetrySpan };

export type AgentContext = {
  baseUrl: string;
  confirmedDealId?: string;
  requestId?: string;
  turnStartTime?: number;
};

export async function runAgent(
  history: ChatMessage[],
  ctx: AgentContext
): Promise<AgentRunResult> {
  const span = telemetry.createSpan(MODEL, ctx.requestId);
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const contents: Content[] = history.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));
  const turnStartTime = ctx.turnStartTime ?? Date.now();
  const steps: Step[] = [];

  try {
    for (let i = 0; i < MAX_STEPS; i++) {
      // Stopwatch circuit breaker: Halt sequence before Vercel 504 proxy timeout limit
      const elapsedMs = Date.now() - turnStartTime;
      if (elapsedMs > 45000) {
        span.status = "timeout_prevented";
        span.errorCategory = "REACT_LOOP_CIRCUIT_BREAKER";
        telemetry.recordSpan(span);
        return {
          answer:
            "The Grand Bazaar is experiencing heavy merchant traffic, traveler! I must pause our discussion briefly to avoid a stall disruption. Your negotiation progress is safe—please confirm your intent or check back momentarily.",
          steps,
          telemetry: span,
        };
      }

      span.reactIterations++;
      let response;
      const generateConfig = {
        systemInstruction: SYSTEM_PROMPT,
        tools: [
          {
            functionDeclarations: tools.map((t) => ({
              name: t.name,
              description: t.description,
              parametersJsonSchema: t.parameters,
            })),
          },
        ],
      };

      const modelCallStart = Date.now();
      try {
        response = await ai.models.generateContent({
          model: MODEL,
          contents,
          config: generateConfig,
        });
      } catch (err: unknown) {
        const errStr = String(err);
        if (errStr.includes("503") || errStr.includes("UNAVAILABLE") || errStr.includes("429")) {
          span.retries++;
          await new Promise((resolve) => setTimeout(resolve, 1500));
          response = await ai.models.generateContent({
            model: MODEL,
            contents,
            config: generateConfig,
          });
        } else {
          span.status = "error";
          span.errorCategory = "MODEL_INVOCATION_ERROR";
          throw err;
        }
      } finally {
        span.modelLatencyMs = (span.modelLatencyMs || 0) + (Date.now() - modelCallStart);
      }

      // Check if the prompt or generation was blocked by safety filters
      if (response.promptFeedback?.blockReason) {
        span.status = "safety_blocked";
        span.errorCategory = String(response.promptFeedback.blockReason);
        telemetry.recordSpan(span);
        return {
          answer: `The request was blocked by model safety filters (${response.promptFeedback.blockReason}).`,
          steps,
          telemetry: span,
        };
      }

      const candidate = response.candidates?.[0];
      if (
        candidate?.finishReason &&
        ["SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII"].includes(String(candidate.finishReason))
      ) {
        span.status = "safety_blocked";
        span.errorCategory = String(candidate.finishReason);
        telemetry.recordSpan(span);
        return {
          answer: `The response was blocked by model safety filters (reason: ${candidate.finishReason}).`,
          steps,
          telemetry: span,
        };
      }

      const calls = response.functionCalls ?? [];
      if (calls.length === 0) {
        const parts = candidate?.content?.parts;
        const joinedParts = parts
          ?.map((p: Part) => p.text)
          .filter((t): t is string => Boolean(t))
          .join("\n");

        const answer =
          response.text ||
          joinedParts ||
          (!response.candidates || response.candidates.length === 0
            ? "No candidate response generated by model."
            : "I completed your request.");

        telemetry.recordSpan(span);
        return { answer, steps, telemetry: span };
      }

      // Keep Gemini's turn in the history, then run every tool it asked for.
      const candidateContent = candidate?.content;
      if (!candidateContent) {
        telemetry.recordSpan(span);
        return { answer: response.text || "No response content generated by model.", steps, telemetry: span };
      }
      contents.push(candidateContent);
      const results: Part[] = [];

      // Extract the latest user message from history for buyer confirmation checks
      const lastUserMessage =
        [...history].reverse().find((m) => m.role === "user")?.text ?? "";
      const toolCtx: ToolContext = {
        ...ctx,
        messages: history,
        lastUserMessage,
        turnStartTime,
      };

      for (const call of calls) {
        const toolName = call.name || "unknown_tool";
        const tool = tools.find((t) => t.name === toolName);
        let result: unknown;
        let error = false;
        const toolArgs = (call.args && typeof call.args === "object" ? call.args : {}) as Record<
          string,
          unknown
        >;

        span.toolCallsCount++;
        span.toolsInvoked.push(toolName);

        try {
          if (!tool) throw new Error(`No tool named ${toolName}`);
          result = await tool.run(toolArgs, toolCtx);

          // Track settlement lifecycle milestones
          if (toolName === "haggle_offer") {
            const hRes = result as Record<string, unknown>;
            if (hRes?.status === "accepted") {
              span.settlementMilestone = "deal_created";
            }
          } else if (toolName === "pay_invoice") {
            const pRes = result as Record<string, unknown>;
            if (pRes?.success) {
              span.settlementMilestone = "settlement_confirmed";
            } else if (pRes?.error) {
              span.settlementMilestone = "settlement_failed";
            }
          }
        } catch (err: unknown) {
          result = { error: err instanceof Error ? err.message : String(err) };
          error = true;
          span.errorCategory = "TOOL_EXECUTION_ERROR";
        }
        steps.push({ tool: toolName, args: toolArgs, result, error });
        results.push({ functionResponse: { id: call.id, name: toolName, response: { result } } });
      }

      contents.push({ role: "user", parts: results });
    }

    span.status = "error";
    span.errorCategory = "STEP_LIMIT_EXCEEDED";
    telemetry.recordSpan(span);
    return { answer: "I hit my step limit. Try a simpler question.", steps, telemetry: span };
  } catch (err) {
    span.status = "error";
    span.errorCategory = err instanceof Error ? err.name : "UNKNOWN_ERROR";
    telemetry.recordSpan(span);
    throw err;
  }
}
