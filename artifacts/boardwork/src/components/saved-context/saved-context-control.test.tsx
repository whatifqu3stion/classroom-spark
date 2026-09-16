import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SavedContextControl } from "./saved-context-control";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useListSavedContexts,
  useCreateSavedContext,
  useUpdateSavedContext,
  useArchiveSavedContext,
  useCreateContextCategory,
} from "@workspace/api-client-react";

// Mock missing browser APIs for Radix UI
if (typeof window !== "undefined") {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.PointerEvent = class PointerEvent extends Event {} as any;
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
}

// Mock the generated API hooks
vi.mock("@workspace/api-client-react", async () => {
  const actual = await vi.importActual("@workspace/api-client-react");
  return {
    ...actual,
    useListSavedContexts: vi.fn(),
    useCreateSavedContext: vi.fn(),
    useUpdateSavedContext: vi.fn(),
    useArchiveSavedContext: vi.fn(),
    useCreateContextCategory: vi.fn(),
    getListSavedContextsQueryKey: vi.fn().mockReturnValue(["mock-query-key"]),
  };
});

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const mockContexts = {
  items: [
    {
      id: "ctx-1",
      label: "Focus on examples",
      details: "Use concrete examples",
      categoryId: "cat-1",
      categoryName: "Pedagogy",
      scope: "class",
      classId: "class-1",
      archived: false,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
      lastUsedAt: null,
    },
    {
      id: "ctx-2",
      label: "Global Context",
      details: null,
      categoryId: null,
      categoryName: null,
      scope: "global",
      classId: null,
      archived: false,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
      lastUsedAt: "2023-01-02T00:00:00Z",
    }
  ],
  categories: [
    {
      id: "cat-1",
      name: "Pedagogy",
      archived: false,
      createdAt: "2023-01-01T00:00:00Z",
      updatedAt: "2023-01-01T00:00:00Z",
    }
  ]
};

describe("SavedContextControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    vi.mocked(useListSavedContexts).mockReturnValue({
      data: mockContexts,
      refetch: vi.fn(),
      isLoading: false,
    } as any);

    vi.mocked(useCreateSavedContext).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "new-ctx" }),
      isPending: false,
    } as any);

    vi.mocked(useUpdateSavedContext).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.mocked(useArchiveSavedContext).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    } as any);

    vi.mocked(useCreateContextCategory).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: "new-cat" }),
      isPending: false,
    } as any);
  });

  const renderComponent = (props = {}) => {
    const onSelectionChange = vi.fn();
    const queryClient = createQueryClient();
    
    const utils = render(
      <QueryClientProvider client={queryClient}>
        <SavedContextControl
          classId="class-1"
          selectedIds={[]}
          onSelectionChange={onSelectionChange}
          {...props}
        />
      </QueryClientProvider>
    );

    return { ...utils, onSelectionChange };
  };

  it("renders empty state with Add Context button", () => {
    renderComponent();
    expect(screen.getByTestId("button-add-context-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("button-add-context")).not.toBeInTheDocument();
  });

  it("shows retry button on list error and handles retry", async () => {
    vi.mocked(useListSavedContexts).mockReturnValue({
      data: undefined,
      refetch: vi.fn(),
      isLoading: false,
      isError: true,
      isFetching: false,
    } as any);

    renderComponent();
    
    const retryBtn = screen.getByTestId("button-add-context-empty");
    expect(retryBtn).toHaveTextContent("Retry loading context");
    
    fireEvent.click(retryBtn);
    expect(useListSavedContexts({ classId: "class-1" }).refetch).toHaveBeenCalled();
  });

  it("renders selected pills and handles removal", () => {
    const { onSelectionChange } = renderComponent({ selectedIds: ["ctx-1"] });
    
    expect(screen.getByTestId("context-pill-ctx-1")).toHaveTextContent("Focus on examples");
    expect(screen.getByTestId("button-add-context")).toBeInTheDocument();
    
    const removeBtn = screen.getByLabelText("Remove Focus on examples");
    fireEvent.click(removeBtn);
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it("shows unavailable context error for stale selected items", () => {
    renderComponent({ selectedIds: ["stale-id"] });
    
    const pill = screen.getByTestId("context-pill-stale-id");
    expect(pill).toHaveTextContent("Unavailable context");
    
    // Verify tooltip or error indicator is present
    expect(pill.querySelector("svg")).toBeInTheDocument(); // AlertCircle icon
  });

  it("opens picker and displays contexts correctly", async () => {
    renderComponent();
    
    const btn = await screen.findByTestId("button-add-context-empty");
    fireEvent.click(btn);
    
    // Check if dialog opens
    expect(await screen.findByText("Saved context")).toBeInTheDocument();
    
    // Check if items are grouped and displayed
    expect(screen.getByText("Recent")).toBeInTheDocument();
    expect(screen.getByText("Global Context")).toBeInTheDocument();
    
    expect(screen.getByText("This class — Pedagogy")).toBeInTheDocument();
    expect(screen.getByText("Focus on examples")).toBeInTheDocument();
  });

  it("exposes named picker and form controls", async () => {
    renderComponent();

    fireEvent.click(await screen.findByTestId("button-add-context-empty"));
    expect(await screen.findByRole("textbox", { name: "Search saved contexts" })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("button-create-context-picker"));

    expect(screen.getByRole("combobox", { name: "Category (optional)" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Availability" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("combobox", { name: "Category (optional)" }));
    expect(screen.getByRole("combobox", { name: "Search or create category" })).toBeInTheDocument();
  });

  it("keeps edit actions visible and counters readable", async () => {
    renderComponent();

    fireEvent.click(await screen.findByTestId("button-add-context-empty"));

    const editButtons = [
      screen.getByTestId("button-edit-context-ctx-1"),
      screen.getByTestId("button-edit-context-ctx-2"),
    ];
    editButtons.forEach((button) => {
      expect(button).toBeVisible();
      expect(button).toHaveClass("size-11");
      expect(button).not.toHaveClass("opacity-0");
    });

    fireEvent.click(screen.getByTestId("button-edit-context-ctx-1"));
    expect(screen.getByText("21/300")).toHaveClass("text-xs");
    expect(screen.getByText("17/50")).toHaveClass("text-xs");
  });

  it("allows selecting a context from the picker with correct aria-pressed", async () => {
    const { onSelectionChange } = renderComponent({ selectedIds: ["ctx-1"] });
    
    const openBtn = await screen.findByTestId("button-add-context");
    fireEvent.click(openBtn);
    
    const unselectedRow = await screen.findByTestId("context-row-ctx-2");
    expect(unselectedRow).toHaveAttribute("aria-pressed", "false");
    
    fireEvent.click(unselectedRow);
    expect(onSelectionChange).toHaveBeenCalledWith(["ctx-1", "ctx-2"]);
    
    const selectedRow = await screen.findByTestId("context-row-ctx-1");
    expect(selectedRow).toHaveAttribute("aria-pressed", "true");
  });

  it("shows soft guidance after six items selected", () => {
    renderComponent({ selectedIds: ["1", "2", "3", "4", "5", "6", "7"] });
    expect(screen.getByTestId("context-guidance-message")).toBeInTheDocument();
  });

  it("keeps context management reachable at the 20-item selection ceiling", () => {
    const twentyIds = Array.from({ length: 20 }, (_, i) => String(i));
    renderComponent({ selectedIds: twentyIds });
    
    expect(screen.getByTestId("context-limit-message")).toBeInTheDocument();
    expect(screen.getByTestId("button-add-context")).toBeEnabled();
  });

  it("returns focus to Add context when the picker closes", async () => {
    renderComponent({ selectedIds: ["ctx-1"] });
    const trigger = screen.getByTestId("button-add-context");
    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("returns focus to the edited row when Back leaves the form", async () => {
    renderComponent();

    fireEvent.click(await screen.findByTestId("button-add-context-empty"));
    fireEvent.click(screen.getByTestId("button-edit-context-ctx-2"));
    fireEvent.click(await screen.findByTestId("button-back-picker"));

    await waitFor(() => expect(screen.getByTestId("context-row-ctx-2")).toHaveFocus());
  });
  
  it("does not auto-select edited unselected items", async () => {
    const { onSelectionChange } = renderComponent({ selectedIds: [] });
    
    const openBtn = await screen.findByTestId("button-add-context-empty");
    fireEvent.click(openBtn);
    
    const editBtn = await screen.findByTestId("button-edit-context-ctx-2");
    fireEvent.click(editBtn);
    
    // In edit form
    const labelInput = await screen.findByTestId("input-context-label");
    fireEvent.change(labelInput, { target: { value: "Changed Context" } });
    
    fireEvent.click(screen.getByTestId("button-save-context"));
    
    await waitFor(() => {
      expect(useUpdateSavedContext().mutateAsync).toHaveBeenCalledWith({
        contextId: "ctx-2",
        data: {
          label: "Changed Context",
          details: null,
          categoryId: null,
          scope: "global",
          classId: null,
        },
      });
    });
    // Shouldn't auto-select because it wasn't selected before edit
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it("archives a selected context and deselects it", async () => {
    const { onSelectionChange } = renderComponent({ selectedIds: ["ctx-1"] });

    fireEvent.click(await screen.findByTestId("button-add-context"));
    fireEvent.click(await screen.findByTestId("button-edit-context-ctx-1"));
    fireEvent.click(await screen.findByTestId("button-archive-context"));

    await waitFor(() => {
      expect(useArchiveSavedContext().mutateAsync).toHaveBeenCalledWith({
        contextId: "ctx-1",
      });
      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });
    expect(screen.queryByTestId("button-archive-context")).not.toBeInTheDocument();
  });

  it("creates a category with the entered name before saving a context", async () => {
    renderComponent();

    fireEvent.click(await screen.findByTestId("button-add-context-empty"));
    fireEvent.click(await screen.findByTestId("button-create-context-picker"));

    const categoryTrigger = screen.getByRole("combobox", { name: "Category (optional)" });
    fireEvent.click(categoryTrigger);
    const categorySearch = screen.getByRole("combobox", { name: "Search or create category" });
    fireEvent.change(categorySearch, { target: { value: "Discussion" } });
    fireEvent.click(await screen.findByTestId("command-create-category"));

    await waitFor(() => {
      expect(useCreateContextCategory().mutateAsync).toHaveBeenCalledWith({
        data: { name: "Discussion" },
      });
    });

    fireEvent.change(screen.getByTestId("input-context-label"), {
      target: { value: "New discussion context" },
    });
    fireEvent.click(screen.getByTestId("button-save-context"));

    await waitFor(() => {
      expect(useCreateSavedContext().mutateAsync).toHaveBeenCalledWith({
        data: {
          label: "New discussion context",
          details: null,
          categoryId: "new-cat",
          scope: "class",
          classId: "class-1",
        },
      });
    });
  });

  it("can switch to create form and save new context", async () => {
    const { onSelectionChange } = renderComponent();
    
    const openBtn = await screen.findByTestId("button-add-context-empty");
    fireEvent.click(openBtn);
    
    const createBtn = await screen.findByTestId("button-create-context-picker");
    fireEvent.click(createBtn);
    
    expect(await screen.findByText("Create context")).toBeInTheDocument();
    
    const labelInput = await screen.findByTestId("input-context-label");
    fireEvent.change(labelInput, { target: { value: "New Item" } });
    
    fireEvent.click(screen.getByTestId("button-save-context"));
    
    await waitFor(() => {
      expect(useCreateSavedContext().mutateAsync).toHaveBeenCalledWith({
        data: expect.objectContaining({ label: "New Item" })
      });
      // Should auto-select the new context ID
      expect(onSelectionChange).toHaveBeenCalledWith(["new-ctx"]);
    });
  });
});
