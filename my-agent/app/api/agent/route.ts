import { NextRequest, NextResponse } from "next/server";
import { MODEL, runAgent, type ChatMessage, type Step } from "@/agent/agent";
import { tools } from "@/agent/tools";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface AgentStatusResponse {
  hasApiKey: boolean;
  model: string;
  tools: { name: string; description: string }[];
}

interface AgentErrorResponse {
  error: string;
}

interface AgentSuccessResponse {
  answer: string;
  steps: Step[];
}

interface AgentRequestBody {
  messages?: unknown;
}

// GET /api/agent -> setup status + the list of tools (shown on the page)
export async function GET(): Promise<NextResponse<AgentStatusResponse>> {
  return NextResponse.json({
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: MODEL,
    tools: tools.map((t) => ({ name: t.name, description: t.description })),
  });
}

// POST /api/agent { messages } -> the agent's answer + the tools it used
export async function POST(
  req: NextRequest
): Promise<NextResponse<AgentSuccessResponse | AgentErrorResponse>> {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured. Set GEMINI_API_KEY in your environment variables or .env file." },
      { status: 500 }
    );
  }

  let body: AgentRequestBody;
  try {
    body = (await req.json()) as AgentRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const rawMessages = body?.messages;
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return NextResponse.json(
      { error: "Missing or invalid 'messages' array in request body. Must provide a non-empty list of messages." },
      { status: 400 }
    );
  }

  const messages: ChatMessage[] = [];
  for (const item of rawMessages) {
    if (typeof item === "object" && item !== null && "text" in item && typeof item.text === "string") {
      const role = item.role === "agent" ? "agent" : "user";
      messages.push({ role, text: item.text });
    }
  }

  if (messages.length === 0) {
    return NextResponse.json(
      { error: "No valid messages found in request body." },
      { status: 400 }
    );
  }

  try {
    const rawForwardedHost = req.headers.get("x-forwarded-host");
    const forwardedHost = rawForwardedHost ? rawForwardedHost.split(",")[0].trim() : null;
    const host = forwardedHost || req.headers.get("host") || req.nextUrl.host || "localhost:3000";

    const rawForwardedProto = req.headers.get("x-forwarded-proto");
    const forwardedProto = rawForwardedProto ? rawForwardedProto.split(",")[0].trim() : null;
    const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
    const proto = forwardedProto || (isLocal ? "http" : "https");

    const baseUrl = `${proto}://${host}`;

    const result = await runAgent(messages, { baseUrl });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

