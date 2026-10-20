import { beforeEach, vi } from "vitest";

beforeEach(() => {
  // No API test may contact a paid provider. Tests must supply a synthetic transport.
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error(
        "External fetch is disabled in API tests. Mock the transport with synthetic fixtures.",
      );
    }),
  );
});
