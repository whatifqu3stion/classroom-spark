export const PRESENTATION_IMAGE_FILE_LIMIT_BYTES = 5 * 1024 * 1024;
export const ACTIVITY_REQUEST_BODY_LIMIT_BYTES = 8 * 1024 * 1024;

// Leave room for the rest of an activity payload so a supported image does not
// consume the entire request budget.
export const ACTIVITY_NON_IMAGE_BUDGET_BYTES = 1 * 1024 * 1024;
export const PRESENTATION_IMAGE_DATA_URL_LIMIT_BYTES =
  ACTIVITY_REQUEST_BODY_LIMIT_BYTES - ACTIVITY_NON_IMAGE_BUDGET_BYTES;

export const PRESENTATION_IMAGE_SIZE_ERROR =
  "Image is too large to save. Choose an image no larger than 5 MB.";
export const ACTIVITY_PAYLOAD_TOO_LARGE_ERROR =
  "Activity payload is too large to save. Choose an image no larger than 5 MB.";

export function estimatePresentationImageDataUrlBytes(
  fileBytes: number,
  mimeType: string,
): number {
  const prefix = `data:${mimeType || "application/octet-stream"};base64,`;
  return prefix.length + 4 * Math.ceil(fileBytes / 3);
}

function getUtf8ByteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint <= 0x7f) {
      bytes += 1;
    } else if (codePoint <= 0x7ff) {
      bytes += 2;
    } else if (codePoint <= 0xffff) {
      bytes += 3;
    } else {
      bytes += 4;
    }
  }
  return bytes;
}

export function getPresentationImagePayloadError(
  visualUrl: string | null | undefined,
): string | null {
  if (!visualUrl) return null;

  const encodedBytes = getUtf8ByteLength(visualUrl);
  if (encodedBytes > PRESENTATION_IMAGE_DATA_URL_LIMIT_BYTES) {
    return PRESENTATION_IMAGE_SIZE_ERROR;
  }

  if (!visualUrl.startsWith("data:")) return null;

  const match = /^data:image\/[^;,]+;base64,([A-Za-z0-9+/]*={0,2})$/i.exec(
    visualUrl,
  );
  if (!match) {
    return "This image could not be saved. Choose an image from the image picker.";
  }

  const base64 = match[1];
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const decodedBytes = Math.floor((base64.length * 3) / 4) - padding;
  return decodedBytes > PRESENTATION_IMAGE_FILE_LIMIT_BYTES
    ? PRESENTATION_IMAGE_SIZE_ERROR
    : null;
}