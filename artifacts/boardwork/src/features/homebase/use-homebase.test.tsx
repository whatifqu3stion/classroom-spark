import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { template } from "./catalog";
import { useHomebaseDraft } from "./use-homebase";

const board = {
  ...template("arrival"),
  id: "ad267995-abcc-4df6-970a-a9c029880829",
  classId: null,
  revision: 1,
  updatedAt: "2026-10-22T12:00:00Z",
};
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});
describe("board saving and draft recovery", () => {
  it("serializes saves and includes edits made during an in-flight save", async () => {
    let finish: ((value: Response) => void) | undefined;
    const calls: Record<string, unknown>[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_path, init) => {
        const input = JSON.parse(init.body);
        calls.push(input);
        if (calls.length === 1)
          return new Promise<Response>((resolve) => {
            finish = resolve;
          });
        return Response.json({ ...board, ...input, revision: 3 });
      }),
    );
    const saved = vi.fn();
    const { result } = renderHook(() => useHomebaseDraft(board, saved));
    act(() =>
      result.current.setContent((value) => ({ ...value, name: "First edit" })),
    );
    await waitFor(() => expect(calls).toHaveLength(1), { timeout: 2000 });
    act(() =>
      result.current.setContent((value) => ({ ...value, name: "Latest edit" })),
    );
    await act(async () =>
      finish!(Response.json({ ...board, name: "First edit", revision: 2 })),
    );
    await waitFor(() => expect(calls).toHaveLength(2), { timeout: 2000 });
    expect(calls[1]).toMatchObject({ name: "Latest edit", revision: 2 });
    await waitFor(() => expect(result.current.dirty).toBe(false));
    expect(
      localStorage.getItem(`boardwork:homebase:v1:${board.id}`),
    ).toBeNull();
  });
  it("keeps failed saves in a browser draft and restores them on reopen", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ error: "Connection interrupted" }, { status: 503 }),
      ),
    );
    const { result, unmount } = renderHook(() =>
      useHomebaseDraft(board, vi.fn()),
    );
    act(() =>
      result.current.setContent((value) => ({
        ...value,
        name: "Keep my work",
      })),
    );
    await waitFor(
      () => expect(result.current.error).toBe("Connection interrupted"),
      { timeout: 2000 },
    );
    expect(
      JSON.parse(localStorage.getItem(`boardwork:homebase:v1:${board.id}`)!),
    ).toMatchObject({ revision: 1, content: { name: "Keep my work" } });
    unmount();
    const reopened = renderHook(() => useHomebaseDraft(board, vi.fn()));
    expect(reopened.result.current.content.name).toBe("Keep my work");
  });
  it("stops automatic saves when a recovered draft conflicts with a newer saved revision", () => {
    localStorage.setItem(
      `boardwork:homebase:v1:${board.id}`,
      JSON.stringify({
        version: 1,
        revision: 1,
        content: { ...template("blank"), name: "Recovered work" },
      }),
    );
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const { result } = renderHook(() =>
      useHomebaseDraft({ ...board, revision: 2 }, vi.fn()),
    );
    expect(result.current.content.name).toBe("Recovered work");
    expect(result.current.error).toContain("Save it as a copy");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
