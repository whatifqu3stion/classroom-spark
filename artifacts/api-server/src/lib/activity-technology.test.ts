import { describe, expect, it } from "vitest";
import {
  ActivityTechnologyValidationError,
  normalizeActivityTechnology,
  technologyModeForDeviceMode,
} from "./activity-technology";

describe("activity technology normalization", () => {
  it("uses the available technology setting for an enabled class default", () => {
    expect(technologyModeForDeviceMode("off")).toBe("no_computer");
    expect(technologyModeForDeviceMode("on")).toBe("computer_available");
  });

  it("derives the three-state value for legacy device-only input", () => {
    expect(normalizeActivityTechnology("off")).toEqual({
      deviceMode: "off",
      technologyMode: "no_computer",
    });
    expect(normalizeActivityTechnology("on")).toEqual({
      deviceMode: "on",
      technologyMode: "computer_available",
    });
  });

  it("rejects contradictory technology and device values", () => {
    expect(() => normalizeActivityTechnology("off", "computer_required")).toThrow(
      ActivityTechnologyValidationError,
    );
    expect(() => normalizeActivityTechnology("on", "no_computer")).toThrow(
      ActivityTechnologyValidationError,
    );
  });
});