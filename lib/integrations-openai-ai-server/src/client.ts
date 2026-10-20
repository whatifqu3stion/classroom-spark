import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import OpenAI from "openai";

export const AI_KEY_HEADER = "x-boardwork-api-key";
export const AI_USAGE_HEADER = "x-boardwork-ai-usage";
export const DEFAULT_AI_MODEL = "gpt-5-mini";

export interface AIUsage {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  unreportedRequests: number;
}
interface AIRequestContext {
  apiKey: string | undefined;
  usage: AIUsage;
}
const requests = new AsyncLocalStorage<AIRequestContext>();
const limits = new Map<string, { starts: number[]; active: number }>();
let activeCalls = 0;

function reserveCall(apiKey: string): () => void {
  const now = Date.now();
  for (const [id, entry] of limits) {
    if (!entry.active && (entry.starts.at(-1) ?? 0) < now - 60_000)
      limits.delete(id);
  }
  const id = createHash("sha256").update(apiKey).digest("hex");
  const entry = limits.get(id) ?? { starts: [], active: 0 };
  entry.starts = entry.starts.filter((time) => time > now - 60_000);
  if (
    activeCalls >= 6 ||
    entry.active >= 2 ||
    entry.starts.length >= 12 ||
    (!limits.has(id) && limits.size >= 1000)
  ) {
    throw new AIRequestError(
      429,
      "AI requests are busy. Please wait a minute before trying again.",
    );
  }
  entry.starts.push(now);
  entry.active++;
  activeCalls++;
  limits.set(id, entry);
  return () => {
    entry.active--;
    activeCalls--;
  };
}

export class AIRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AIRequestError";
  }
}

export function validateAIKey(raw: unknown): string | undefined {
  if (raw === undefined || raw === "") return undefined;
  if (typeof raw !== "string" || !/^sk-[A-Za-z0-9_-]{16,500}$/.test(raw)) {
    throw new AIRequestError(
      400,
      "Enter a valid OpenAI API key in AI settings.",
    );
  }
  return raw;
}

/** Credentials exist only in this request's async context; never in env or storage. */
export function withAIRequest<T>(
  apiKey: string | undefined,
  usage: AIUsage,
  callback: () => T,
): T {
  return requests.run({ apiKey, usage }, callback);
}
export function hasAIKey(): boolean {
  return Boolean(requests.getStore()?.apiKey);
}
export function getAIModel(): string {
  return process.env.BYOK_MODEL?.trim() || DEFAULT_AI_MODEL;
}

export async function createAIResponse(
  body: OpenAI.Responses.ResponseCreateParamsNonStreaming,
  options: { signal?: AbortSignal; maxRetries?: number } = {},
): Promise<OpenAI.Responses.Response> {
  const context = requests.getStore();
  if (!context?.apiKey) {
    throw new AIRequestError(
      400,
      "Add your OpenAI API key in AI settings before using generation.",
    );
  }
  const release = reserveCall(context.apiKey);
  // Fixed destination; explicit apiKey prevents any owner-key environment fallback.
  context.usage.requests++;
  let reported = false;
  try {
    const client = new OpenAI({
      apiKey: context.apiKey,
      organization: null,
      project: null,
      baseURL: "https://api.openai.com/v1",
      maxRetries: 0,
      fetch: globalThis.fetch,
    });
    const response = await client.responses.create(
      { ...body, stream: false, store: false },
      options,
    );
    if (response.usage) {
      context.usage.inputTokens += response.usage.input_tokens;
      context.usage.outputTokens += response.usage.output_tokens;
      reported = true;
    }
    return response;
  } catch (error) {
    const status = error instanceof OpenAI.APIError ? error.status : undefined;
    if (status === 401 || status === 403) {
      throw new AIRequestError(
        401,
        "OpenAI rejected this key or its permissions. Update your key in AI settings.",
      );
    }
    if (status === 429) {
      throw new AIRequestError(
        429,
        "OpenAI reported a billing or rate limit for your key. Check your account and retry later.",
      );
    }
    // Provider errors can contain credentials in request metadata. Never retain them.
    throw new AIRequestError(
      502,
      "OpenAI could not complete this request. Check your key's model access and try again.",
    );
  } finally {
    if (!reported) context.usage.unreportedRequests++;
    release();
  }
}
