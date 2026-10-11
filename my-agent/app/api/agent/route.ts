import { MODEL, runAgent } from "@/agent/agent";
import { tools } from "@/agent/tools";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/agent -> setup status + the list of tools (shown on the page)
export async function GET() {
  return Response.json({
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: MODEL,
    tools: tools.map((t) => ({ name: t.name, description: t.description })),
  });
}

// POST /api/agent { messages } -> the agent's answer + the tools it used
export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "GEMINI_API_KEY is not configured. Set GEMINI_API_KEY in your environment variables or .env file." },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "Missing or invalid 'messages' array in request body. Must provide a non-empty list of messages." },
      { status: 400 }
    );
  }

  try {
    const rawForwardedHost = req.headers.get("x-forwarded-host");
    const forwardedHost = rawForwardedHost ? rawForwardedHost.split(",")[0].trim() : null;
    const host = forwardedHost || req.headers.get("host") || new URL(req.url).host;

    const rawForwardedProto = req.headers.get("x-forwarded-proto");
    const forwardedProto = rawForwardedProto ? rawForwardedProto.split(",")[0].trim() : null;
    const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
    const proto = forwardedProto || (isLocal ? "http" : "https");

    const baseUrl = `${proto}://${host}`;

    const result = await runAgent(messages, { baseUrl });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
