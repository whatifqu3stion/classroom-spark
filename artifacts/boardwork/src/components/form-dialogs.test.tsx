import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClassFormDialog } from "./class-form-dialog";
import { UnitFormDialog } from "./unit-form-dialog";

describe("form dialog save recovery", () => {
  it("keeps class values open after a rejected save and closes after retry", async () => {
    const onSubmit = vi.fn()
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValueOnce(undefined);
    const onOpenChange = vi.fn();

    render(
      <ClassFormDialog
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByTestId("input-class-name"), {
      target: { value: "Period 2 Science" },
    });
    fireEvent.change(screen.getByTestId("input-class-grade"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByTestId("input-class-subject"), {
      target: { value: "Science" },
    });
    fireEvent.click(screen.getByTestId("button-save-class"));

    expect(await screen.findByTestId("class-save-error")).toHaveTextContent(
      "Your changes are still here",
    );
    expect(screen.getByTestId("input-class-name")).toHaveValue("Period 2 Science");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByTestId("button-save-class"));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it("keeps unit values open after a rejected save", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("temporary failure"));
    const onOpenChange = vi.fn();

    render(
      <UnitFormDialog
        open
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByTestId("input-unit-name"), {
      target: { value: "Cells and transport" },
    });
    fireEvent.click(screen.getByTestId("button-save-unit"));

    expect(await screen.findByTestId("unit-save-error")).toHaveTextContent(
      "Your changes are still here",
    );
    expect(screen.getByTestId("input-unit-name")).toHaveValue("Cells and transport");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});