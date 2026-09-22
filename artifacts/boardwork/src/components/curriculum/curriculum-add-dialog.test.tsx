import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CurriculumSource } from "@workspace/api-client-react";
import { CurriculumAddDialog } from "./curriculum-add-dialog";

const original = (): CurriculumSource => ({
  id: "source-old", classId: "class-test", unitId: "unit-test", kind: "manual",
  status: "approved", version: 4, title: "Reviewed source", summary: "Reviewed interpretation",
  subject: "Design", framework: "IB MYP", programmeYear: "2", objectives: [],
  publisher: null, url: null, edition: null, retrievedAt: null,
  approvedAt: "2026-09-20T00:00:00Z", createdAt: "2026-09-20T00:00:00Z", updatedAt: "2026-09-20T00:00:00Z",
});
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json" },
});

function fixture(options: { conflict?: boolean; importFailure?: boolean; duplicate?: "same" | "approved"; holdPatch?: boolean } = {}) {
  const old = original();
  if (options.conflict) old.version = 5;
  let draft: CurriculumSource | null = null;
  let draftsCreated = 0;
  let releasePatch: () => void = () => {};
  const patchBarrier = new Promise<void>((resolve) => { releasePatch = resolve; });
  const requests: { method: string; path: string; body: unknown; headers: Headers }[] = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input), "https://fixture.invalid").pathname;
    const method = init?.method ?? "GET";
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : init?.body;
    requests.push({ method, path, body, headers: new Headers(init?.headers) });
    if (method === "POST" && path.startsWith("/api/classes/class-test/curriculum")) {
      if (options.importFailure) return json({ error: "extraction_failed" }, 422);
      if (options.duplicate === "same") return json(old);
      if (!draft) {
        draftsCreated++;
        draft = { ...original(), id: "source-new", version: 1, approvedAt: null,
          status: options.duplicate === "approved" ? "approved" : "draft" };
      }
      return json(draft, 201);
    }
    if (method === "PATCH" && path.endsWith("/source-old")) {
      if (options.holdPatch) await patchBarrier;
      if (body.version !== old.version) return json({ error: "Source changed; reload and retry." }, 409);
      old.status = body.status;
      old.version++;
      old.approvedAt = null;
      return json(old);
    }
    throw new Error(`Unexpected fixture request: ${method} ${path}`);
  }));
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
  const onReplaced = vi.fn();
  const onOpenChange = vi.fn();
  const view = (version: number) => <QueryClientProvider client={queryClient}>
    <CurriculumAddDialog open onOpenChange={onOpenChange} classId="class-test" unitId="unit-test"
      isApiReady replacement={{ id: old.id, version }} initialTitle={old.title} onReplaced={onReplaced} />
  </QueryClientProvider>;
  const rendered = render(view(4));
  return { old, requests, onReplaced, onOpenChange, releasePatch,
    get draft() { return draft; }, get draftsCreated() { return draftsCreated; },
    reviewLatest: () => rendered.rerender(view(old.version)),
  };
}

afterEach(() => vi.unstubAllGlobals());

function submitManual() {
  fireEvent.change(screen.getByLabelText("Curriculum text"), { target: { value: "Identify a different user's needs." } });
  fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));
}

describe("curriculum replacement with reviewed source versions", () => {
  it.each(["manual", "pdf"] as const)("deactivates version 4 only after a successful %s import and PATCH", async (kind) => {
    const state = fixture({ holdPatch: true });
    if (kind === "manual") submitManual();
    else {
      fireEvent.mouseDown(screen.getByRole("tab", { name: "PDF Upload" }), { button: 0, ctrlKey: false });
      const file = new File(["%PDF-1.4 fixture"], "curriculum.pdf", { type: "application/pdf" });
      fireEvent.change(screen.getByLabelText("PDF File"), { target: { files: [file] } });
      // jsdom does not populate the native file-input value from a synthetic FileList.
      fireEvent.submit(screen.getByLabelText("PDF File").closest("form")!);
    }
    await waitFor(() => expect(state.requests.some((request) => request.method === "PATCH")).toBe(true));
    const patch = state.requests.find((request) => request.method === "PATCH")!;
    expect(patch.body).toEqual({ version: 4, status: "inactive" });
    expect(state.old.status).toBe("approved");
    expect(state.onReplaced).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: kind === "manual" ? "Save Draft" : "Upload & Extract" })).toBeDisabled();
    if (kind === "pdf") expect(state.requests[0].headers.get("Content-Type")).toBe("application/pdf");
    await act(async () => state.releasePatch());
    await waitFor(() => expect(state.onReplaced).toHaveBeenCalledOnce());
    expect(state.old.status).toBe("inactive");
    expect(state.draft?.status).toBe("draft");
  });

  it("keeps the dialog and input after CAS failure, then reuses the draft after reviewing the latest version", async () => {
    const state = fixture({ conflict: true });
    submitManual();
    expect(await screen.findByRole("alert")).toHaveTextContent("previous source could not be deactivated");
    expect(state.onReplaced).not.toHaveBeenCalled();
    expect(state.onOpenChange).not.toHaveBeenCalled();
    expect(state.old.status).toBe("approved");
    expect(state.draft?.status).toBe("draft");
    expect(screen.getByLabelText("Curriculum text")).toHaveValue("Identify a different user's needs.");
    state.reviewLatest();
    await waitFor(() => expect(screen.getByRole("button", { name: "Save Draft" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));
    await waitFor(() => expect(state.onReplaced).toHaveBeenCalledOnce());
    expect(state.requests.filter((request) => request.method === "PATCH").map((request) => request.body))
      .toEqual([{ version: 4, status: "inactive" }, { version: 5, status: "inactive" }]);
    expect(state.draftsCreated).toBe(1);
    expect(state.old.status).toBe("inactive");
  });

  it.each(["same", "approved"] as const)("does not deactivate anything when deduplication returns a %s source", async (duplicate) => {
    const state = fixture({ duplicate });
    submitManual();
    await waitFor(() => expect(state.requests).toHaveLength(1));
    await waitFor(() => expect(screen.getByRole("button", { name: "Save Draft" })).toBeEnabled());
    expect(state.requests.some((request) => request.method === "PATCH")).toBe(false);
    expect(state.old.status).toBe("approved");
    expect(state.onReplaced).not.toHaveBeenCalled();
  });

  it("does not deactivate the old source after an import failure", async () => {
    const state = fixture({ importFailure: true });
    submitManual();
    await waitFor(() => expect(state.requests).toHaveLength(1));
    await waitFor(() => expect(screen.getByRole("button", { name: "Save Draft" })).toBeEnabled());
    expect(state.requests.some((request) => request.method === "PATCH")).toBe(false);
    expect(state.old.status).toBe("approved");
    expect(state.draft).toBeNull();
    expect(state.onReplaced).not.toHaveBeenCalled();
  });
});