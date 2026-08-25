import type { TechnologyMode } from "@workspace/api-zod";

export class ActivityTechnologyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActivityTechnologyValidationError";
  }
}

export function normalizeActivityTechnology(
  deviceMode: "off" | "on",
  technologyMode?: TechnologyMode | null,
): {
  deviceMode: "off" | "on";
  technologyMode: TechnologyMode;
} {
  const normalizedTechnologyMode =
    technologyMode ??
    (deviceMode === "off" ? "no_computer" : "computer_available");
  const expectedDeviceMode =
    normalizedTechnologyMode === "no_computer" ? "off" : "on";

  if (deviceMode !== expectedDeviceMode) {
    throw new ActivityTechnologyValidationError(
      "Technology mode and device mode do not match.",
    );
  }

  return {
    deviceMode,
    technologyMode: normalizedTechnologyMode,
  };
}