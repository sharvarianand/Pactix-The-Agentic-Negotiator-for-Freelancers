// Pactix — provider-agnostic LLM client.
// Supported providers: 'gemini' | 'openai' | 'ernie' | 'mock'
// Every agent calls `streamJSON()` and receives a typed, parsed object at the end
// plus a reasoning stream during generation.

import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
} from "@google/generative-ai";
import { getMockResponse } from "./llm-mock";

export type LLMProvider = "gemini" | "openai" | "openrouter" | "ernie" | "mock";

export interface LLMRequest {
  system: string;
  user: string;
  temperature?: number;
  // JSON schema hint for the model (stringified). The prompt should also describe
  // the required shape explicitly — JSON mode is the primary guarantee.
  schemaHint?: string;
  // Agent name for mock-mode routing
  agentName?: string;
}

export interface LLMStreamChunk {
  type: "reasoning" | "done" | "error";
  text?: string;
  data?: unknown;
  error?: string;
  model?: string;
  latencyMs?: number;
}

function currentProvider(): LLMProvider {
  const p = (process.env.LLM_PROVIDER || "mock").toLowerCase();
  if (p === "gemini" || p === "openai" || p === "openrouter" || p === "ernie" || p === "mock") return p;
  return "mock";
}

/** Keys from AI Studio / GCP; trim whitespace that often breaks copy-paste from consoles. */
function resolveGeminiApiKey(): string | undefined {
  const raw =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  const k = raw?.trim();
  return k || undefined;
}

/**
 * Turn SDK / HTTP errors into something actionable (esp. 403 SERVICE_DISABLED).
 */
function formatGeminiFailure(err: unknown): string {
  if (err instanceof GoogleGenerativeAIFetchError) {
    const msg = err.message || "";
    const status = err.status;

    if (
      status === 403 &&
      (msg.includes("SERVICE_DISABLED") ||
        msg.includes("has not been used") ||
        /it is disabled/i.test(msg))
    ) {
      const projectMatch = msg.match(/project\s+(\d+)/i);
      const projectId = projectMatch?.[1];
      const enableUrl = projectId
        ? `https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=${projectId}`
        : "https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com";
      return [
        "Generative Language API is OFF for this key’s Google Cloud project (403 SERVICE_DISABLED).",
        "",
        `1) Open: ${enableUrl}`,
        "2) Click Enable, wait 1–2 minutes, then run Send to Pactix again.",
        "",
        "Or create a new API key at https://aistudio.google.com/apikey (often already enabled).",
      ].join("\n");
    }

    // API enabled in console but 403: wrong project for the key, or key restrictions.
    if (status === 403) {
      return [
        "403 Forbidden — the API may already be enabled. Typical causes:",
        "",
        "1) Project mismatch: GEMINI_API_KEY must belong to the same GCP project where the API is enabled. In Google Cloud → IAM & Admin → Settings, note the Project number. If an error mentioned a different project number, create a new key under APIs & Services → Credentials in that project (or use a key from https://aistudio.google.com/apikey).",
        "",
        "2) Key restrictions: Open the key → Application restrictions. «HTTP referrers (web sites)» blocks server calls — Pactix calls Gemini from the Next.js server (Node), not the browser. For local dev use «None»; in production use «IP addresses» for your server.",
        "",
        "3) API restrictions: allow «Generative Language API» (or don’t restrict while testing).",
        "",
        `Raw: ${msg.slice(0, 600)}`,
      ].join("\n");
    }

    if (status === 400 && /API key not valid|invalid/i.test(msg)) {
      return "Invalid Gemini API key. Set GEMINI_API_KEY in .env — create one at https://aistudio.google.com/apikey";
    }

    if (status === 404 && /not found|not supported/i.test(msg)) {
      return `Model not found for this API/version. Try GEMINI_MODEL=gemini-2.0-flash or check model name. Raw: ${msg.slice(0, 400)}`;
    }

    return msg;
  }

  return err instanceof Error ? err.message : String(err);
}

/**
 * Strip common markdown code fences Gemini/OpenAI wrap around JSON.
 */
function stripFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

/**
 * Best-effort JSON extraction: find the first {...} block in the string.
 * Handles models that return prose before the JSON.
 */
function extractJSON(raw: string): string {
  const stripped = stripFences(raw);
  // Quick path: already valid
  try {
    JSON.parse(stripped);
    return stripped;
  } catch {
    /* fall through */
  }
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return stripped.slice(first, last + 1);
  }
  return stripped;
}

/**
 * Stream an LLM response.
 * Emits `reasoning` chunks as tokens arrive, then a single `done` chunk with parsed JSON.
 * Falls back to non-streaming if provider doesn't support it.
 */
export async function* streamJSON(
  req: LLMRequest
): AsyncGenerator<LLMStreamChunk, void, void> {
  const provider = currentProvider();
  const start = Date.now();

  // If the primary provider is gemini, we allow fallback to openrouter
  if (provider === "gemini") {
    let success = false;
    try {
      for await (const chunk of streamGemini(req, start)) {
        if (chunk.type === "error") {
          // If we hit an error before any reasoning/data, we can try falling back
          console.error("Gemini failed, checking for fallback...", chunk.error);
          break; 
        }
        success = true;
        yield chunk;
      }
    } catch (e) {
      console.error("Gemini stream threw error, checking for fallback...", e);
    }

    if (!success && process.env.OPENROUTER_API_KEY) {
      console.log("Falling back to OpenRouter...");
      yield* streamOpenRouter(req, start);
      return;
    } else if (!success) {
      yield {
        type: "error",
        error: "Gemini failed and no fallback (OpenRouter) configured.",
        latencyMs: Date.now() - start,
      };
      return;
    }
    return;
  }

  // Non-fallback paths
  try {
    switch (provider) {
      case "openai":
        yield* streamOpenAI(req, start);
        break;
      case "openrouter":
        yield* streamOpenRouter(req, start);
        break;
      case "ernie":
        yield* streamErnie(req, start);
        break;
      case "mock":
      default:
        yield* streamMock(req, start);
        break;
    }
  } catch (e) {
    yield {
      type: "error",
      error: e instanceof Error ? e.message : String(e),
      latencyMs: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------------
async function* streamGemini(
  req: LLMRequest,
  start: number
): AsyncGenerator<LLMStreamChunk, void, void> {
  const apiKey = resolveGeminiApiKey();
  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  if (!apiKey) {
    yield* streamMock(req, start);
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: req.system,
    generationConfig: {
      temperature: req.temperature ?? 0.5,
      responseMimeType: "application/json",
    },
  });

  const userPrompt = req.schemaHint
    ? `${req.user}\n\nReturn strictly valid JSON matching this shape:\n${req.schemaHint}`
    : req.user;

  let result;
  try {
    result = await model.generateContentStream(userPrompt);
  } catch (e) {
    yield {
      type: "error",
      error: formatGeminiFailure(e),
      latencyMs: Date.now() - start,
    };
    return;
  }

  let full = "";
  try {
    for await (const chunk of result.stream) {
      const t = chunk.text();
      if (t) {
        full += t;
        yield { type: "reasoning", text: t };
      }
    }
  } catch (e) {
    yield {
      type: "error",
      error: formatGeminiFailure(e),
      latencyMs: Date.now() - start,
    };
    return;
  }

  const latencyMs = Date.now() - start;
  try {
    const parsed = JSON.parse(extractJSON(full));
    yield { type: "done", data: parsed, model: modelName, latencyMs };
  } catch (e) {
    yield {
      type: "error",
      error: `Failed to parse JSON from Gemini: ${
        e instanceof Error ? e.message : String(e)
      }. Raw: ${full.slice(0, 300)}`,
      latencyMs,
    };
  }
}

// ---------------------------------------------------------------------------
// OpenAI (fallback)
// ---------------------------------------------------------------------------
async function* streamOpenRouter(
  req: LLMRequest,
  start: number
): AsyncGenerator<LLMStreamChunk, void, void> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free";
  if (!apiKey) {
    yield* streamMock(req, start);
    return;
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Pactix",
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: req.temperature ?? 0.5,
      // OpenRouter supports JSON mode for some models, but we'll stick to our extraction logic
      // to be safe across different free models.
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: req.system },
        {
          role: "user",
          content: req.schemaHint
            ? `${req.user}\n\nReturn strictly valid JSON matching this shape:\n${req.schemaHint}`
            : req.user,
        },
      ],
    }),
  });

  if (!res.ok || !res.body) {
    yield {
      type: "error",
      error: `OpenRouter HTTP ${res.status}: ${await res.text().catch(() => "")}`,
      latencyMs: Date.now() - start,
    };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") break;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          yield { type: "reasoning", text: delta };
        }
      } catch {
        /* ignore partial */
      }
    }
  }

  const latencyMs = Date.now() - start;
  try {
    const parsed = JSON.parse(extractJSON(full));
    yield { type: "done", data: parsed, model, latencyMs };
  } catch (e) {
    yield {
      type: "error",
      error: `Failed to parse JSON from OpenRouter: ${
        e instanceof Error ? e.message : String(e)
      }. Raw: ${full.slice(0, 300)}`,
      latencyMs,
    };
  }
}

async function* streamOpenAI(
  req: LLMRequest,
  start: number
): AsyncGenerator<LLMStreamChunk, void, void> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!apiKey) {
    yield* streamMock(req, start);
    return;
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: req.temperature ?? 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: req.system },
        {
          role: "user",
          content: req.schemaHint
            ? `${req.user}\n\nReturn strictly valid JSON matching this shape:\n${req.schemaHint}`
            : req.user,
        },
      ],
    }),
  });

  if (!res.ok || !res.body) {
    yield {
      type: "error",
      error: `OpenAI HTTP ${res.status}: ${await res.text().catch(() => "")}`,
      latencyMs: Date.now() - start,
    };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") break;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          yield { type: "reasoning", text: delta };
        }
      } catch {
        /* ignore partial */
      }
    }
  }

  const latencyMs = Date.now() - start;
  try {
    const parsed = JSON.parse(extractJSON(full));
    yield { type: "done", data: parsed, model, latencyMs };
  } catch (e) {
    yield {
      type: "error",
      error: `Failed to parse JSON from OpenAI: ${
        e instanceof Error ? e.message : String(e)
      }`,
      latencyMs,
    };
  }
}

// ---------------------------------------------------------------------------
// ERNIE / Qianfan — stub, wired for hackathon submission swap
// ---------------------------------------------------------------------------
async function* streamErnie(
  req: LLMRequest,
  start: number
): AsyncGenerator<LLMStreamChunk, void, void> {
  // TODO(hackathon-swap): Implement Qianfan OAuth token exchange + streaming.
  // For now, fall back to mock so the app runs before credentials arrive.
  yield* streamMock(req, start);
}

// ---------------------------------------------------------------------------
// Mock — deterministic, scripted responses for development without an API key
// ---------------------------------------------------------------------------
async function* streamMock(
  req: LLMRequest,
  start: number
): AsyncGenerator<LLMStreamChunk, void, void> {
  const { reasoning, output } = getMockResponse(req.agentName || "orchestrator", req);

  // Stream the reasoning in word-sized chunks to simulate the real feel.
  const tokens = reasoning.split(/(\s+)/);
  for (const tok of tokens) {
    if (!tok) continue;
    yield { type: "reasoning", text: tok };
    await new Promise((r) => setTimeout(r, 18 + Math.random() * 22));
  }

  yield {
    type: "done",
    data: output,
    model: "pactix-mock-v1",
    latencyMs: Date.now() - start,
  };
}
