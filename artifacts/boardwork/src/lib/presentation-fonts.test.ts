import { describe, expect, it, vi } from "vitest";
import {
  getPresentationExportOptions,
  PRESENTATION_EXPORT_SIZE,
  PRESENTATION_FONT_FAMILIES,
  waitForPresentationFonts,
} from "./presentation-fonts";

describe("presentation font handling", () => {
  it("keeps the fixed export size while allowing html-to-image to embed fonts", () => {
    const options = getPresentationExportOptions("#ffffff");

    expect(options).toMatchObject({
      ...PRESENTATION_EXPORT_SIZE,
      canvasWidth: 1920,
      canvasHeight: 1080,
      pixelRatio: 1,
      backgroundColor: "#ffffff",
    });
    expect(options).not.toHaveProperty("skipFonts");
    expect(PRESENTATION_FONT_FAMILIES).toContain("Noto Sans Arabic");
    expect(PRESENTATION_FONT_FAMILIES).toContain("Noto Sans Devanagari");
    expect(PRESENTATION_FONT_FAMILIES).toContain("Noto Sans JP");
  });

  it("waits for requested script-capable fonts before capture", async () => {
    const load = vi.fn().mockResolvedValue([]);
    const ready = Promise.resolve([]);
    vi.stubGlobal("document", { fonts: { load, ready } });

    await waitForPresentationFonts();

    expect(load).toHaveBeenCalled();
    expect(load).toHaveBeenCalledWith('400 1em "Noto Sans Arabic"');
    expect(load).toHaveBeenCalledWith('400 1em "Noto Sans Devanagari"');
    expect(load).toHaveBeenCalledWith('400 1em "Noto Sans JP"');
    vi.unstubAllGlobals();
  });
});