import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PresentationThemePicker } from "./presentation-theme-picker";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  getCuratedPresentationTheme,
  presentationAccentThemes,
  presentationSurfaceThemes,
} from "@workspace/api-zod";

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
    expect(screen.getByTestId("theme-option-boardwork")).toHaveStyle({
      "--theme-control-color": "#FDFCF8",
    });
    expect(screen.getByTestId("accent-option-blue")).toHaveStyle({
      "--theme-control-color": "#334155",
    });
    expect(screen.queryByText("Typography")).not.toBeInTheDocument();
    expect(screen.queryByTestId("presentation-typography")).not.toBeInTheDocument();
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
      "w-full",
      "min-w-0",
      "grid-cols-[auto_minmax(0,1fr)_auto]",
    );
    expect(screen.getByTestId("theme-swatch-color-boardwork")).toHaveClass(
      "h-5",
      "w-5",
    );
    expect(screen.getByTestId("accent-option-blue")).toHaveClass(
      "w-full",
      "min-w-0",
      "grid-cols-[auto_minmax(0,1fr)_auto]",
    );
    expect(screen.getByTestId("presentation-surfaces").querySelector(".presentation-theme-grid")).toBeTruthy();
    expect(screen.getByTestId("presentation-accents").querySelector(".presentation-theme-grid")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /typography/i })).not.toBeInTheDocument();
  });

  it("uses matching swatches and stable checkmark slots in both color rows", () => {
    render(<PresentationThemePicker onChange={vi.fn()} />);

    const options = [
      screen.getByTestId("theme-option-boardwork"),
      screen.getByTestId("theme-option-paper"),
      screen.getByTestId("accent-option-blue"),
      screen.getByTestId("accent-option-sage"),
    ];
    for (const option of options) {
      expect(option.querySelector(".presentation-theme-swatch")).toHaveClass(
        "h-5", "w-5", "rounded-md", "border",
      );
      const check = option.querySelector(".presentation-theme-check");
      expect(check).toHaveAttribute("aria-hidden", "true");
      if (option.getAttribute("aria-pressed") === "true") {
        expect(check).not.toHaveClass("invisible");
      } else {
        expect(check).toHaveClass("invisible");
      }
    }
  });

  it("uses the curated surface and accent colors as the control color cues", () => {
    render(<PresentationThemePicker onChange={vi.fn()} />);

    for (const surface of presentationSurfaceThemes) {
      const theme = getCuratedPresentationTheme(surface.id, surface.defaultAccentId);
      const testId = surface.id === "paper-v2" ? "paper" : surface.id.replace("-v2", "");
      expect(screen.getByTestId(`theme-option-${testId}`)).toHaveStyle({
        "--theme-control-color": theme.colors.background,
      });
      expect(screen.getByTestId(`theme-swatch-color-${surface.id}`)).toHaveStyle({
        backgroundColor: theme.colors.background,
      });
    }

    for (const accent of presentationAccentThemes) {
      expect(screen.getByTestId(`accent-option-${accent.id}`)).toHaveStyle({
        "--theme-control-color": getCuratedPresentationTheme("boardwork", accent.id).colors.accent,
      });
    }
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

  it("keeps palette cues and focus states clear in a dark editor", () => {
    document.documentElement.classList.add("dark");

    try {
      render(
        <PresentationThemePicker
          onChange={vi.fn()}
          value={{ kind: "curated", themeId: "midnight", accentId: "sage" }}
        />,
      );

      const selectedSurface = screen.getByTestId("theme-option-midnight");
      const unselectedSurface = screen.getByTestId("theme-option-boardwork");
      const selectedAccent = screen.getByTestId("accent-option-sage");

      expect(document.documentElement).toHaveClass("dark");
      expect(selectedSurface).toHaveAttribute("aria-pressed", "true");
      expect(unselectedSurface).toHaveAttribute("aria-pressed", "false");
      expect(selectedAccent).toHaveAttribute("aria-pressed", "true");
      expect(selectedSurface).toHaveClass(
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-ring",
      );
      expect(selectedAccent).toHaveClass(
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-ring",
      );

      expect(screen.getByRole("button", { name: "Use Mint accent" })).toBeVisible();
      expect(screen.getByTestId("theme-swatch-color-boardwork")).toHaveStyle({
        backgroundColor: "#FDFCF8",
      });
      expect(screen.getByTestId("theme-swatch-color-midnight")).toHaveStyle({
        backgroundColor: "#0F172A",
      });

      selectedAccent.focus();
      expect(document.activeElement).toBe(selectedAccent);
    } finally {
      document.documentElement.classList.remove("dark");
    }
  });

  it("reveals secondary presentation guidance when the help control receives focus", async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <PresentationThemePicker onChange={vi.fn()} />
      </TooltipProvider>,
    );

    fireEvent.focus(screen.getByRole("button", { name: "About presentation colors" }));

    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toHaveTextContent(
        "Choose the background first, then use accents for small signals such as links, progress, and emphasis.",
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
    });
  });

  it("changes accents without adding a typography preference", () => {
    const onChange = vi.fn();
    render(
      <PresentationThemePicker
        onChange={onChange}
        value={{ kind: "curated", themeId: "paper-v2", accentId: "sage" }}
      />,
    );

    fireEvent.click(screen.getByTestId("accent-option-blue"));

    expect(onChange).toHaveBeenLastCalledWith({
      kind: "curated",
      themeId: "paper-v2",
      accentId: "blue",
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
