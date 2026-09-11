import { describe, expect, it } from "vitest";
import {
  getCanonicalPresentationVisuals,
  getLegacyPresentationVisualFields,
  getPresentationVisualPayloadError,
  mergeLegacyPresentationVisualPatch,
  normalizePresentationVisuals,
} from "./presentation-visuals";

describe("presentation visual compatibility", () => {
  it("hydrates a legacy image into the ordered visual list", () => {
    const visuals = normalizePresentationVisuals(
      undefined,
      "data:image/png;base64,legacy",
      "Legacy classroom visual",
    );

    expect(visuals).toEqual([
      {
        url: "data:image/png;base64,legacy",
        description: "Legacy classroom visual",
      },
    ]);
    expect(getLegacyPresentationVisualFields(visuals)).toEqual({
      visualUrl: "data:image/png;base64,legacy",
      visualDescription: "Legacy classroom visual",
    });
  });

  it("keeps ordered pairs and exposes the first image to legacy clients", () => {
    const visuals = normalizePresentationVisuals([
      { url: "data:image/png;base64,first", description: "First" },
      { url: "data:image/png;base64,second", description: "Second" },
    ]);

    expect(visuals).toHaveLength(2);
    expect(getLegacyPresentationVisualFields(visuals)).toEqual({
      visualUrl: "data:image/png;base64,first",
      visualDescription: "First",
    });
  });

  it("hydrates empty stored arrays from legacy fields for API reads", () => {
    expect(
      getCanonicalPresentationVisuals({
        visuals: [],
        visualUrl: "data:image/png;base64,legacy",
        visualDescription: "Legacy",
      }),
    ).toEqual([
      {
        url: "data:image/png;base64,legacy",
        description: "Legacy",
      },
    ]);
  });

  it("preserves the second image when a legacy client updates or clears the first", () => {
    const existing = [
      { url: "data:image/png;base64,first", description: "First" },
      { url: "data:image/png;base64,second", description: "Second" },
    ];

    expect(
      mergeLegacyPresentationVisualPatch(
        existing,
        "data:image/png;base64,replaced",
        "Replaced",
        true,
        true,
      ),
    ).toEqual([
      { url: "data:image/png;base64,replaced", description: "Replaced" },
      existing[1],
    ]);
    expect(
      mergeLegacyPresentationVisualPatch(existing, null, undefined, true, false),
    ).toEqual([existing[1]]);
  });

  it("rejects an oversized image in a pair", () => {
    const error = getPresentationVisualPayloadError([
      { url: "data:image/png;base64,valid" },
      {
        url: `data:image/png;base64,${"A".repeat(7_000_000)}`,
      },
    ]);

    expect(error).toBeTruthy();
  });

  it("rejects an empty image URL", () => {
    expect(
      getPresentationVisualPayloadError([{ url: "" }]),
    ).toMatch(/could not be saved/i);
  });
});