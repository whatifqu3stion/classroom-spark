import { readFile } from "node:fs/promises";
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
    expect(PRESENTATION_FONT_FAMILIES).toEqual([
      "Inter",
      "DM Sans",
      "DM Serif Display",
      "Atkinson Hyperlegible",
      "IBM Plex Sans",
      "IBM Plex Serif",
    ]);
  });

  it("waits for requested script-capable fonts before capture", async () => {
    const load = vi.fn().mockResolvedValue([]);
    const ready = Promise.resolve([]);
    vi.stubGlobal("document", { fonts: { load, ready } });

    await waitForPresentationFonts();

    expect(load).toHaveBeenCalled();
    expect(load).toHaveBeenCalledWith('400 1em "Inter"');
    expect(load).toHaveBeenCalledWith('500 1em "Inter"');
    expect(load).toHaveBeenCalledWith('600 1em "Inter"');
    expect(load).toHaveBeenCalledWith('700 1em "Inter"');
    expect(load).toHaveBeenCalledWith('600 1em "IBM Plex Serif"');
    expect(load).not.toHaveBeenCalledWith('400 1em "Noto Sans Arabic"');
    vi.unstubAllGlobals();
  });

  it("continues export preparation when a local font fails to load", async () => {
    const load = vi.fn().mockRejectedValue(new Error("font unavailable"));
    const ready = Promise.resolve([]);
    vi.stubGlobal("document", { fonts: { load, ready } });

    await expect(waitForPresentationFonts()).resolves.toBeUndefined();

    vi.unstubAllGlobals();
  });

  it("keeps font loading local to the shipped stylesheet", async () => {
    const stylesheet = await readFile("src/index.css", "utf8");

    expect(stylesheet).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    expect(stylesheet).toContain('src: url("/fonts/inter-400.ttf")');
  });
});