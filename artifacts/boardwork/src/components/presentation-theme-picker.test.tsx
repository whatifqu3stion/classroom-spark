import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PresentationThemePicker } from "./presentation-theme-picker";

describe("PresentationThemePicker", () => {
  it("keeps the prior Boardwork appearance as the default", () => {
    render(<PresentationThemePicker onChange={vi.fn()} />);

    expect(screen.getByTestId("theme-option-boardwork")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("theme-option-paper")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows five featured presets and the remaining presets under More", () => {
    render(<PresentationThemePicker onChange={vi.fn()} />);

    for (const themeId of ["boardwork", "paper", "ocean", "ink", "sage"]) {
      expect(screen.getByTestId(`theme-option-${themeId}`)).toBeInTheDocument();
    }

    expect(screen.queryByTestId("theme-option-clay")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("button-more-themes"));

    for (const themeId of ["clay", "plum", "midnight", "sunlit", "teal"]) {
      expect(screen.getByTestId(`theme-option-${themeId}`)).toBeInTheDocument();
    }
    expect(screen.getByText("More appearance presets")).toBeInTheDocument();
    expect(screen.queryByTestId("button-customize-theme")).not.toBeInTheDocument();
  });

  it("selects a curated preset without opening a customization flow", () => {
    const onChange = vi.fn();
    render(<PresentationThemePicker onChange={onChange} />);

    fireEvent.click(screen.getByTestId("theme-option-ocean"));

    expect(onChange).toHaveBeenLastCalledWith({
      kind: "curated",
      themeId: "ocean",
    });
    expect(screen.queryByTestId("theme-customize-panel")).not.toBeInTheDocument();
  });

  it("keeps a saved custom theme readable without exposing manual controls", () => {
    render(
      <PresentationThemePicker
        onChange={vi.fn()}
        value={{
          kind: "custom",
          sourceThemeId: "paper",
          anchors: { background: "#000000", text: "#FFFFFF", accent: "#67E8F9" },
        }}
        preview={{ title: "Saved activity", task: "Keep this appearance readable." }}
      />,
    );

    expect(screen.getAllByText("Custom").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("button-customize-theme")).not.toBeInTheDocument();
    expect(screen.getByTestId("presentation-theme-preview")).toHaveStyle({
      backgroundColor: "#000000",
    });
  });
});