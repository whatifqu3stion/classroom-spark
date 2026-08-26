import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PresentationThemePicker } from "./presentation-theme-picker";
import { TooltipProvider } from "@/components/ui/tooltip";

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
    expect(screen.getAllByText("Aa")).toHaveLength(5);
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
    expect(screen.getByTestId("theme-option-boardwork")).toHaveClass(
      "items-center",
      "gap-2",
    );
    expect(screen.getByTestId("theme-swatch-color-boardwork")).toHaveClass(
      "h-5",
      "w-5",
    );
    for (const typographyId of [
      "boardwork",
      "editorial",
      "structured",
      "clear",
      "friendly",
    ]) {
      expect(screen.getByTestId(`typography-option-${typographyId}`)).toBeInTheDocument();
      expect(screen.getByTestId(`typography-preview-${typographyId}`)).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Use Classic typography" })).not.toHaveAttribute("title");
    expect(screen.getByRole("button", { name: "About presentation typography" })).toBeInTheDocument();
  });

  it("uses the selected surface mode for accent names without a summary pill", () => {
    render(
      <PresentationThemePicker
        onChange={vi.fn()}
        value={{ kind: "curated", themeId: "midnight", accentId: "sage" }}
      />,
    );

    expect(screen.getByRole("button", { name: "Use Mint accent" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Use Sage accent" })).not.toBeInTheDocument();
    expect(screen.queryByText("Midnight · Mint")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use Mint accent" })).not.toHaveAttribute("title");
  });

  it("reveals secondary presentation guidance when the help control receives focus", async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <PresentationThemePicker onChange={vi.fn()} />
      </TooltipProvider>,
    );

    fireEvent.focus(screen.getByRole("button", { name: "About presentation typography" }));

    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toHaveTextContent(
        "This pairing changes the student board, Present view, and PNG export—not the teacher workspace.",
      );
    });
  });

  it("selects a surface with its matched accent and allows a secondary accent choice", () => {
    const onChange = vi.fn();
    render(
      <PresentationThemePicker
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByTestId("theme-option-midnight"));

    expect(onChange).toHaveBeenLastCalledWith({
      kind: "curated",
      themeId: "midnight",
      accentId: "blue",
      typographyId: "boardwork",
    });
  });

  it("changes typography without changing the selected surface or accent", () => {
    const onChange = vi.fn();
    render(
      <PresentationThemePicker
        onChange={onChange}
        value={{ kind: "curated", themeId: "paper-v2", accentId: "sage" }}
      />,
    );

    fireEvent.click(screen.getByTestId("typography-option-clear"));

    expect(onChange).toHaveBeenLastCalledWith({
      kind: "curated",
      themeId: "paper-v2",
      accentId: "sage",
      typographyId: "clear",
    });
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
      />,
    );

    expect(screen.queryByText("Custom")).not.toBeInTheDocument();
    expect(screen.queryByTestId("button-customize-theme")).not.toBeInTheDocument();
    expect(screen.queryByTestId("presentation-accents")).not.toBeInTheDocument();
    expect(screen.queryByTestId("presentation-theme-preview")).not.toBeInTheDocument();
  });

  it("keeps legacy curated appearances intact without presenting them as new surfaces", () => {
    render(
      <PresentationThemePicker
        onChange={vi.fn()}
        value={{ kind: "curated", themeId: "ocean" }}
      />,
    );

    expect(screen.queryByText("Ocean")).not.toBeInTheDocument();
    expect(screen.queryByTestId("presentation-accents")).not.toBeInTheDocument();
    expect(screen.getByTestId("legacy-theme-note")).toBeInTheDocument();
  });
});
