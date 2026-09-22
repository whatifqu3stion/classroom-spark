import { act, render, screen, fireEvent } from "@testing-library/react";
import { CurriculumSourceDialog } from "./curriculum-source-dialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import * as apiClient from "@workspace/api-client-react";

vi.mock("@workspace/api-client-react", async () => {
  const actual = await vi.importActual("@workspace/api-client-react");
  return {
    ...actual,
    useGetCurriculumSource: vi.fn(),
    useUpdateCurriculumSource: vi.fn(),
    useDeleteCurriculumSource: vi.fn(),
    useRefreshCurriculumSource: vi.fn(),
  };
});

describe("CurriculumSourceDialog", () => {
  it("updates the detail cache using the returned source upon successful save", async () => {
    const queryClient = new QueryClient();
    const mockUpdateMutate = vi.fn();
    const mockInvalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const mockSetQueryData = vi.spyOn(queryClient, "setQueryData");

    const mockSource = {
      id: "src1",
      classId: "cls1",
      title: "Initial Title",
      summary: "Init summary",
      status: "draft",
      version: 1,
      updatedAt: "2024-01-01T00:00:00Z"
    };

    vi.mocked(apiClient.useGetCurriculumSource).mockReturnValue({
      data: mockSource,
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    vi.mocked(apiClient.useUpdateCurriculumSource).mockReturnValue({
      mutate: mockUpdateMutate,
      isPending: false,
    } as any);
    
    vi.mocked(apiClient.useDeleteCurriculumSource).mockReturnValue({ mutate: vi.fn() } as any);
    vi.mocked(apiClient.useRefreshCurriculumSource).mockReturnValue({ mutate: vi.fn() } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <CurriculumSourceDialog open={true} onOpenChange={vi.fn()} classId="cls1" sourceId="src1" />
      </QueryClientProvider>
    );

    // Initial render sets title
    expect(screen.getByDisplayValue("Initial Title")).toBeInTheDocument();

    const approveButton = screen.getByRole("button", { name: "Approve" });
    fireEvent.click(approveButton);

    expect(mockUpdateMutate).toHaveBeenCalledTimes(1);
    const { onSuccess } = mockUpdateMutate.mock.calls[0][1];

    const updatedSource = {
      ...mockSource,
      title: "Initial Title",
      status: "approved",
      version: 2,
      updatedAt: "2024-01-02T00:00:00Z"
    };

    // Simulate success
    await act(async () => onSuccess(updatedSource));

    // Should set query data and invalidate
    expect(mockSetQueryData).toHaveBeenCalledWith(
      apiClient.getGetCurriculumSourceQueryKey("cls1", "src1"),
      updatedSource
    );
    
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: apiClient.getListCurriculumSourcesQueryKey("cls1")
      })
    );
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: apiClient.getGetCurriculumSourceQueryKey("cls1", "src1")
      })
    );
  });
});
