import { describe, expect, it } from "vitest";
import {
  ACTIVITY_REQUEST_BODY_LIMIT_BYTES,
  PRESENTATION_IMAGE_DATA_URL_LIMIT_BYTES,
  PRESENTATION_IMAGE_FILE_LIMIT_BYTES,
  PRESENTATION_IMAGE_SIZE_ERROR,
  estimatePresentationImageDataUrlBytes,
  getPresentationImagePayloadError,
} from "@workspace/api-zod";

describe("activity payload image limits", () => {
  it("leaves enough request budget for a supported 5 MB image", () => {
    const encodedBytes = estimatePresentationImageDataUrlBytes(
      PRESENTATION_IMAGE_FILE_LIMIT_BYTES,
      "image/png",
    );

    expect(encodedBytes).toBeLessThanOrEqual(
      PRESENTATION_IMAGE_DATA_URL_LIMIT_BYTES,
    );
    expect(PRESENTATION_IMAGE_DATA_URL_LIMIT_BYTES).toBeLessThan(
      ACTIVITY_REQUEST_BODY_LIMIT_BYTES,
    );

    const padding = PRESENTATION_IMAGE_FILE_LIMIT_BYTES % 3 === 1
      ? "=="
      : PRESENTATION_IMAGE_FILE_LIMIT_BYTES % 3 === 2
        ? "="
        : "";
    const supportedBase64 = "A".repeat(
      4 * Math.ceil(PRESENTATION_IMAGE_FILE_LIMIT_BYTES / 3) - padding.length,
    ) + padding;
    expect(
      getPresentationImagePayloadError(
        `data:image/png;base64,${supportedBase64}`,
      ),
    ).toBeNull();
  });

  it("leaves enough request budget for two supported 5 MB images", () => {
    const encodedBytes = estimatePresentationImageDataUrlBytes(
      PRESENTATION_IMAGE_FILE_LIMIT_BYTES,
      "image/png",
    );

    expect(
      encodedBytes * 2 + 1 * 1024 * 1024,
    ).toBeLessThanOrEqual(ACTIVITY_REQUEST_BODY_LIMIT_BYTES);
  });

  it("rejects a data URL whose decoded image exceeds 5 MB", () => {
    const encodedLength = 4 * Math.ceil((PRESENTATION_IMAGE_FILE_LIMIT_BYTES + 1) / 3);
    const oversizedBase64 = "A".repeat(encodedLength);
    const visualUrl = `data:image/png;base64,${oversizedBase64}`;

    expect(getPresentationImagePayloadError(visualUrl)).toBe(
      PRESENTATION_IMAGE_SIZE_ERROR,
    );
  });
});