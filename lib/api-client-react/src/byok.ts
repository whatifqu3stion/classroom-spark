export interface AIUsage {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  unreportedRequests: number;
}
interface AIState extends AIUsage {
  hasKey: boolean;
  settingsOpen: boolean;
  revision: number;
}
const emptyUsage: AIUsage = {
  requests: 0,
  inputTokens: 0,
  outputTokens: 0,
  unreportedRequests: 0,
};
let key = "";
let state: AIState = {
  ...emptyUsage,
  hasKey: false,
  settingsOpen: false,
  revision: 0,
};
const listeners = new Set<() => void>();
export const subscribeAIState = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const update = (next: AIState) => {
  state = next;
  listeners.forEach((listener) => listener());
};

/** Memory only. Never put a credential in React Query, URLs, localStorage or sessionStorage. */
export function setAIKey(value: string): void {
  const trimmed = value.trim();
  if (trimmed && !/^sk-[A-Za-z0-9_-]{16,500}$/.test(trimmed)) {
    throw new Error("Enter a valid OpenAI API key beginning with sk-.");
  }
  key = trimmed;
  update({
    ...emptyUsage,
    hasKey: Boolean(key),
    settingsOpen: false,
    revision: state.revision + 1,
  });
}
export function openAISettings(open = true): void {
  update({ ...state, settingsOpen: open });
}
export function getAIState(): AIState {
  return state;
}

/** Never attach a user's credential to an arbitrary URL or a redirect target. */
export function aiRequestContext(input: RequestInfo | URL): {
  headers: HeadersInit;
  revision: number;
  eligible: boolean;
} {
  const raw =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const url = new URL(raw, origin);
  const eligible =
    url.origin === origin &&
    (url.pathname === "/api/generate" ||
      /^\/api\/classes\/[^/]+\/curriculum(?:\/(?:pdf|discover|[^/]+\/refresh))?$/.test(
        url.pathname,
      ));
  return {
    headers: eligible && key ? { "x-boardwork-api-key": key } : {},
    revision: state.revision,
    eligible,
  };
}

export function recordAIUsage(response: Response, revision: number): void {
  if (revision !== state.revision || !state.hasKey) return;
  try {
    const raw = response.headers.get("x-boardwork-ai-usage");
    if (!raw) return;
    const usage: AIUsage = JSON.parse(raw);
    const fields = [
      "requests",
      "inputTokens",
      "outputTokens",
      "unreportedRequests",
    ] as const;
    if (
      !fields.every(
        (field) => Number.isSafeInteger(usage[field]) && usage[field] >= 0,
      )
    )
      return;
    update({
      ...state,
      requests: state.requests + usage.requests,
      inputTokens: state.inputTokens + usage.inputTokens,
      outputTokens: state.outputTokens + usage.outputTokens,
      unreportedRequests: state.unreportedRequests + usage.unreportedRequests,
    });
  } catch {
    /* Usage is advisory and must never prevent saving a board. */
  }
}

/** Also used for raw PDF uploads, so they share credentials and usage accounting. */
export async function fetchWithAI(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const context = aiRequestContext(input);
  const headers = new Headers(
    input instanceof Request ? input.headers : undefined,
  );
  new Headers(init.headers).forEach((value, name) => headers.set(name, value));
  new Headers(context.headers).forEach((value, name) =>
    headers.set(name, value),
  );
  // No BYOK credential is permitted on untrusted/non-AI requests, including caller overrides.
  if (!context.eligible) headers.delete("x-boardwork-api-key");
  const response = await fetch(input, {
    ...init,
    headers,
    ...(context.eligible ? { redirect: "error" as const } : {}),
  });
  if (context.eligible) recordAIUsage(response, context.revision);
  return response;
}
