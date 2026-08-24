/**
 * Unicode contract for teacher and generated content:
 * - Keep the original code points; do not apply ASCII folding or compatibility
 *   normalization, because those can change authored wording.
 * - Remove C0/C1 controls other than tab, line feed, and carriage return.
 * - Remove invisible bidi/zero-width formatting controls that can reorder or
 *   hide content.
 * - Keep ZWNJ and ZWJ, which are required for shaping in scripts including
 *   Arabic, Persian, Urdu, and several Indic writing systems.
 */
const unsafeUnicodeControls =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B\u200E\u200F\u202A-\u202E\u2060-\u2065\u2066-\u2069\uFEFF]/gu;

export function sanitizeUnicodeText(value: string): string {
  return value.replace(unsafeUnicodeControls, "");
}

export function sanitizeUnicodeValue(value: unknown): unknown {
  if (typeof value === "string") return sanitizeUnicodeText(value);
  if (Array.isArray(value)) return value.map(sanitizeUnicodeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        sanitizeUnicodeText(key),
        sanitizeUnicodeValue(item),
      ]),
    );
  }
  return value;
}