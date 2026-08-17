export class ActivityResourceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActivityResourceValidationError";
  }
}

export function normalizeActivityResourceUrl(
  value: string | null | undefined,
  deviceMode: "off" | "on",
): string | null {
  const normalized = value?.trim();
  if (!normalized) return null;

  if (deviceMode === "off") {
    throw new ActivityResourceValidationError(
      "A resource URL can only be used with Device On.",
    );
  }

  try {
    const url = new URL(normalized);
    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password
    ) {
      throw new Error("Unsupported resource URL");
    }
    return url.toString();
  } catch {
    throw new ActivityResourceValidationError(
      "Enter a valid http or https resource URL.",
    );
  }
}