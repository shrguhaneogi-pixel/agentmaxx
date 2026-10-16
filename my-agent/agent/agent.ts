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
export type AgentRunResult = { answer: string; steps: Step[] };

export type AgentContext = {
  baseUrl: string;
  confirmedDealId?: string;
};

export async function runAgent(
  history: ChatMessage[],
  ctx: AgentContext
): Promise<AgentRunResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const contents: Content[] = history.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));
  const turnStartTime = Date.now();
  const steps: Step[] = [];

  for (let i = 0; i < MAX_STEPS; i++) {
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

    try {
      response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: generateConfig,
      });
    } catch (err: unknown) {
      const errStr = String(err);
      if (errStr.includes("503") || errStr.includes("UNAVAILABLE") || errStr.includes("429")) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        response = await ai.models.generateContent({
          model: MODEL,
          contents,
          config: generateConfig,
        });
      } else {
        throw err;
      }
    }

    const calls = response.functionCalls ?? [];
    if (calls.length === 0) {
      const parts = response.candidates?.[0]?.content?.parts;
      const joinedParts = parts
        ?.map((p: Part) => p.text)
        .filter((t): t is string => Boolean(t))
        .join("\n");

      const answer = response.text || joinedParts || "I completed your request.";
      return { answer, steps };
    }

    // Keep Gemini's turn in the history, then run every tool it asked for.
    const candidateContent = response.candidates?.[0]?.content;
    if (!candidateContent) {
      return { answer: response.text || "No response content generated by model.", steps };
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
      try {
        if (!tool) throw new Error(`No tool named ${toolName}`);
        result = await tool.run(toolArgs, toolCtx);
      } catch (err: unknown) {
        result = { error: err instanceof Error ? err.message : String(err) };
        error = true;
      }
      steps.push({ tool: toolName, args: toolArgs, result, error });
      results.push({ functionResponse: { id: call.id, name: toolName, response: { result } } });
    }

    contents.push({ role: "user", parts: results });
  }

  return { answer: "I hit my step limit. Try a simpler question.", steps };
}
