import type { TechnologyMode } from "./generated/types/technologyMode";

export function technologyModeForDeviceMode(
  deviceMode: "off" | "on",
): TechnologyMode {
  return deviceMode === "off" ? "no_computer" : "computer_available";
}