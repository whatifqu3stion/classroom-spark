export class CurriculumImportError extends Error {
  constructor(
    public readonly code: "configuration" | "unsupported" | "invalid_pdf" | "limit" | "timeout" | "provider" | "evidence" | "storage" | "rate_limit",
    message: string,
  ) {
    super(message);
    this.name = "CurriculumImportError";
  }
}

export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_TEXT = 120_000;
export type Page = { page: number; text: string };
export type ImportContext = { subject: string; framework?: string | null; programmeYear?: string | null };