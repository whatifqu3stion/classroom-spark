import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AISettings, AIUsageControl } from "./ai-settings";
import { setAIKey, getAIState, fetchWithAI } from "@workspace/api-client-react";

const key = "sk-test-browser-fixture-not-a-live-key";
const usage = {
  requests: 2,
  inputTokens: 1200,
  outputTokens: 300,
  unreportedRequests: 0,
};
const response = (status = 200) =>
  new Response(JSON.stringify({ error: "synthetic" }), {
    status,
    headers: {
      "content-type": "application/json",
      "x-boardwork-ai-usage": JSON.stringify(usage),
    },
  });
function mount() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AISettings />
      <AIUsageControl />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  setAIKey("");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("BYOK settings and this-visit usage", () => {
  it("keeps a masked key only in memory, clears the form, and supports removal", () => {
    const local = vi.spyOn(Storage.prototype, "setItem");
    mount();
    fireEvent.click(screen.getByRole("button", { name: "AI settings" }));
    const input = screen.getByLabelText("OpenAI API key");
    expect(input).toHaveAttribute("type", "password");
    fireEvent.change(input, { target: { value: key } });
    fireEvent.click(screen.getByRole("button", { name: "Use key" }));
    expect(getAIState().hasKey).toBe(true);
    expect(JSON.stringify(getAIState())).not.toContain(key);
    expect(local).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "AI settings" }));
    expect(screen.getByLabelText("OpenAI API key")).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Remove key" }));
    expect(getAIState().hasKey).toBe(false);
  });
  it("rejects an invalid key without implying verification", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "AI settings" }));
    fireEvent.change(screen.getByLabelText("OpenAI API key"), {
      target: { value: "invalid" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Use key" }));
    expect(screen.getByRole("alert")).toHaveTextContent("valid OpenAI API key");
    expect(getAIState().hasKey).toBe(false);
  });
  it("updates subtle usage from actual response metadata, including error responses", async () => {
    mount();
    act(() => setAIKey(key));
    const fetch = vi.fn().mockResolvedValue(response(502));
    vi.stubGlobal("fetch", fetch);
    await act(async () => {
      await fetchWithAI("/api/generate", { method: "POST" });
    });
    expect(screen.getByTestId("ai-usage")).toHaveTextContent(
      "Your key · 1.5K tokens this visit",
    );
    expect(
      new Headers(fetch.mock.calls[0][1].headers).get("x-boardwork-api-key"),
    ).toBe(key);
    expect(fetch.mock.calls[0][1].redirect).toBe("error");
    expect(getAIState()).toMatchObject(usage);
  });
  it("never attaches credentials to another origin or unrelated path", async () => {
    setAIKey(key);
    const fetch = vi.fn().mockResolvedValue(response());
    vi.stubGlobal("fetch", fetch);
    await fetchWithAI("https://untrusted.invalid/api/generate", {
      headers: { "x-boardwork-api-key": key },
    });
    await fetchWithAI("/api/classes");
    for (const call of fetch.mock.calls)
      expect(new Headers(call[1].headers).has("x-boardwork-api-key")).toBe(
        false,
      );
    expect(getAIState().requests).toBe(0);
  });
  it("does not attribute a late response to a replacement key", async () => {
    setAIKey(key);
    let complete: ((response: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            complete = resolve;
          }),
      ),
    );
    const pending = fetchWithAI("/api/generate", { method: "POST" });
    await waitFor(() => expect(complete).toBeDefined());
    setAIKey("sk-replacement-fixture-not-a-live-key");
    complete!(response());
    await pending;
    expect(getAIState().requests).toBe(0);
  });
});
