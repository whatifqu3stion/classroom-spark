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
    expect(screen.getByTestId("accent-option-blue")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("theme-swatch-color-boardwork")).toHaveStyle({
      backgroundColor: "#FDFCF8",
    });
    expect(screen.queryByText("Aa")).not.toBeInTheDocument();
  });

  it("shows the limited surface catalog and restrained accent catalog", () => {
    render(<PresentationThemePicker onChange={vi.fn()} />);

    for (const themeId of ["boardwork", "paper", "charcoal", "midnight"]) {
      expect(screen.getByTestId(`theme-option-${themeId}`)).toBeInTheDocument();
    }

    for (const accentId of ["terracotta", "blue", "sage", "plum"]) {
      expect(screen.getByTestId(`accent-option-${accentId}`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId("theme-option-ocean")).not.toBeInTheDocument();
    expect(screen.queryByTestId("button-more-themes")).not.toBeInTheDocument();
    expect(screen.getByText("Background")).toBeInTheDocument();
    expect(screen.getByText("Accent")).toBeInTheDocument();
  });

  it("selects a surface with its matched accent and allows a secondary accent choice", () => {
    const onChange = vi.fn();
    render(<PresentationThemePicker onChange={onChange} />);

    fireEvent.click(screen.getByTestId("theme-option-paper"));

    expect(onChange).toHaveBeenLastCalledWith({
      kind: "curated",
      themeId: "paper-v2",
      accentId: "terracotta",
    });

    fireEvent.click(screen.getByTestId("accent-option-blue"));

    expect(onChange).toHaveBeenLastCalledWith({
      kind: "curated",
      themeId: "boardwork",
      accentId: "blue",
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
    expect(screen.queryByTestId("presentation-accents")).not.toBeInTheDocument();
    expect(screen.getByTestId("presentation-theme-preview")).toHaveStyle({
      backgroundColor: "#000000",
    });
  });

  it("keeps legacy curated appearances intact without presenting them as new surfaces", () => {
    render(
      <PresentationThemePicker
        onChange={vi.fn()}
        value={{ kind: "curated", themeId: "ocean" }}
      />,
    );

    expect(screen.getByText("Ocean")).toBeInTheDocument();
    expect(screen.queryByTestId("presentation-accents")).not.toBeInTheDocument();
    expect(screen.getByTestId("legacy-theme-note")).toBeInTheDocument();
  });
});