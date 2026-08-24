import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PresentationThemePicker } from "./presentation-theme-picker";

describe("PresentationThemePicker", () => {
  it("shows the readable default and curated descriptions", () => {
    render(<PresentationThemePicker onChange={vi.fn()} />);

    expect(screen.getByText("Paper")).toBeInTheDocument();
    expect(screen.getByTestId("theme-option-paper")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByTestId("button-more-themes"));

    expect(screen.getByText("Curated palettes keep type, hierarchy, and meaning readable.")).toBeInTheDocument();
    expect(screen.getByText("Deep navy with soft white text and a focused blue accent.")).toBeInTheDocument();
  });

  it("selects a curated theme and warns for unsafe custom contrast", () => {
    const onChange = vi.fn();
    const view = render(<PresentationThemePicker onChange={onChange} />);

    fireEvent.click(screen.getByTestId("button-more-themes"));
    fireEvent.click(screen.getByTestId("theme-option-midnight"));
    expect(onChange).toHaveBeenLastCalledWith({
      kind: "curated",
      themeId: "midnight",
    });

    fireEvent.click(screen.getByTestId("button-more-themes"));
    fireEvent.click(screen.getByTestId("button-customize-theme"));
    fireEvent.change(screen.getByLabelText("Background color"), {
      target: { value: "#000000" },
    });
    view.rerender(
      <PresentationThemePicker
        onChange={onChange}
        value={{
          kind: "custom",
          anchors: { background: "#000000", text: "#202326", accent: "#A94632" },
        }}
      />,
    );
    const textColor = screen.getByLabelText("Text color");
    fireEvent.change(textColor, { target: { value: "#000000" } });
    view.rerender(
      <PresentationThemePicker
        onChange={onChange}
        value={{
          kind: "custom",
          anchors: { background: "#000000", text: "#000000", accent: "#A94632" },
        }}
      />,
    );

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        kind: "custom",
        anchors: expect.objectContaining({ text: "#000000" }),
      }),
    );
    expect(screen.getByTestId("theme-contrast-warning")).toBeInTheDocument();
  });
});
