import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
import {
  AI_KEY_HEADER,
  AI_USAGE_HEADER,
  AIRequestError,
  createAIResponse,
} from "@workspace/integrations-openai-ai-server";
import { byokContext } from "./byok";

const KEY = "sk-test-byok-fixture-not-a-live-key";
const response = {
  status: "completed",
  output_text: "{}",
  usage: { input_tokens: 100, output_tokens: 30 },
};
function app() {
  const server = express();
  server.use(byokContext);
  server.post("/generate", async (req, res) => {
    try {
      await createAIResponse({ model: "gpt-5-mini", input: "test" });
      if (req.query.repair)
        await createAIResponse({ model: "gpt-5-mini", input: "repair" });
      res.json({ keyHeaderRemoved: req.headers[AI_KEY_HEADER] === undefined });
    } catch (error) {
      res
        .status(error instanceof AIRequestError ? error.status : 500)
        .json({ error: (error as Error).message });
    }
  });
  return server;
}
beforeEach(() => {
  vi.clearAllMocks();
  // The SDK receives this synthetic transport: no network or paid calls are possible.
  mocks.fetch.mockImplementation(
    async () =>
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", mocks.fetch);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("BYOK boundary and reported usage", () => {
  it("never falls back to owner environment keys", async () => {
    vi.stubEnv("OPENAI_API_KEY", KEY);
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_API_KEY", KEY);
    vi.stubEnv(
      "AI_INTEGRATIONS_OPENAI_BASE_URL",
      "https://wrong-destination.invalid",
    );
    const result = await request(app()).post("/generate");
    expect(result.status).toBe(400);
    expect(result.body.error).toMatch(/Add your OpenAI/);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("forwards only the supplied key to the fixed OpenAI endpoint and reports repairs", async () => {
    vi.stubEnv("OPENAI_ORG_ID", "owner-organization-fixture");
    vi.stubEnv("OPENAI_PROJECT_ID", "owner-project-fixture");
    vi.stubEnv(
      "AI_INTEGRATIONS_OPENAI_BASE_URL",
      "https://wrong-destination.invalid",
    );
    const result = await request(app())
      .post("/generate?repair=1")
      .set(AI_KEY_HEADER, KEY);
    expect(result.status).toBe(200);
    expect(result.body.keyHeaderRemoved).toBe(true);
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    const [url, init] = mocks.fetch.mock.calls[0];
    expect(String(url)).toBe("https://api.openai.com/v1/responses");
    expect(new Headers(init.headers).get("authorization")).toBe(
      `Bearer ${KEY}`,
    );
    expect(new Headers(init.headers).has("openai-organization")).toBe(false);
    expect(new Headers(init.headers).has("openai-project")).toBe(false);
    expect(JSON.parse(result.headers[AI_USAGE_HEADER])).toEqual({
      requests: 2,
      inputTokens: 200,
      outputTokens: 60,
      unreportedRequests: 0,
    });
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toMatchObject({
      store: false,
      stream: false,
    });
    expect(result.headers["cache-control"]).toBe("no-store");
    expect(result.text).not.toContain(KEY);
  });
  it("isolates keys and usage across overlapping requests", async () => {
    let release: (() => void) | undefined;
    const firstKey = "sk-first-isolation-test-fixture";
    const secondKey = "sk-second-isolation-test-fixture";
    mocks.fetch.mockImplementation(async (_url: string, init: RequestInit) => {
      const key = new Headers(init.headers).get("authorization")?.slice(7);
      if (key === firstKey)
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      return new Response(
        JSON.stringify({
          ...response,
          usage: { input_tokens: key === firstKey ? 11 : 22, output_tokens: 1 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    const first = request(app())
      .post("/generate")
      .set(AI_KEY_HEADER, firstKey)
      .then((result) => result);
    await vi.waitFor(() => expect(release).toBeDefined());
    const second = await request(app())
      .post("/generate")
      .set(AI_KEY_HEADER, secondKey);
    release!();
    const result = await first;
    expect(JSON.parse(result.headers[AI_USAGE_HEADER]).inputTokens).toBe(11);
    expect(JSON.parse(second.headers[AI_USAGE_HEADER]).inputTokens).toBe(22);
  });
  it("rejects malformed keys before provider calls", async () => {
    expect(
      (await request(app()).post("/generate").set(AI_KEY_HEADER, "invalid"))
        .status,
    ).toBe(400);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("reports partial usage on failures without leaking provider error metadata", async () => {
    mocks.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: `secret ${KEY}` } }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );
    const result = await request(app())
      .post("/generate")
      .set(AI_KEY_HEADER, KEY);
    expect(result.status).toBe(401);
    expect(result.text).not.toContain(KEY);
    expect(JSON.parse(result.headers[AI_USAGE_HEADER])).toEqual({
      requests: 1,
      inputTokens: 0,
      outputTokens: 0,
      unreportedRequests: 1,
    });
  });
  it("limits sustained provider attempts even across different application requests", async () => {
    const rateKey = "sk-rate-limit-fixture-not-a-live-key";
    const server = app();
    for (let i = 0; i < 12; i++) {
      expect(
        (await request(server).post("/generate").set(AI_KEY_HEADER, rateKey))
          .status,
      ).toBe(200);
    }
    const limited = await request(server)
      .post("/generate")
      .set(AI_KEY_HEADER, rateKey);
    expect(limited.status).toBe(429);
    expect(mocks.fetch).toHaveBeenCalledTimes(12);
  });
});
