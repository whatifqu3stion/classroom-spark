import { describe, expect, it } from "vitest";
import { getWorkspaceEntry, workspaceSetupUrl } from "./workspace-entry";

describe("workspace launch destination", () => {
  it("keeps the full app on its own workspace route", () => {
    expect(getWorkspaceEntry(false, "https://another.example/app")).toEqual({
      href: "/app",
      external: false,
      available: true,
    });
  });

  it("opens the configured hosted workspace, preserving its path", () => {
    expect(
      getWorkspaceEntry(true, " https://school.example/boardwork/app "),
    ).toEqual({
      href: "https://school.example/boardwork/app",
      external: true,
      available: true,
    });
  });

  it.each([
    undefined,
    "",
    "   ",
    "/app",
    "not a URL",
    "javascript:alert(1)",
    "http://school.example/app",
    "https://user:password@school.example/app",
  ])("offers setup when the deployment address is unusable: %s", (url) => {
    expect(getWorkspaceEntry(true, url)).toEqual({
      href: workspaceSetupUrl,
      external: true,
      available: false,
    });
  });
});
