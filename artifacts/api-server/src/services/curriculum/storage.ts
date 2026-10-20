import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { mkdir, open, rm } from "node:fs/promises";
import path from "node:path";
import { CurriculumImportError, MAX_PDF_BYTES } from "./errors";
import { validatePdfBytes } from "./pdf";

function fileFor(objectKey: string) {
  if (!/^curriculum\/[a-f0-9-]{36}\.pdf$/.test(objectKey)) {
    throw new CurriculumImportError(
      "storage",
      "Invalid curriculum document reference.",
    );
  }
  const dir = process.env.PDF_STORAGE_DIR;
  if (!dir || !path.isAbsolute(dir))
    throw new CurriculumImportError(
      "configuration",
      "An absolute PDF_STORAGE_DIR must be configured before uploading curriculum PDFs.",
    );
  return path.join(dir, objectKey);
}

export async function storePdf(buffer: Buffer): Promise<string> {
  validatePdfBytes(buffer);
  const objectKey = `curriculum/${randomUUID()}.pdf`;
  const file = fileFor(objectKey);
  let created = false;
  try {
    await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    const handle = await open(file, "wx", 0o600);
    created = true;
    try {
      await handle.writeFile(buffer);
    } finally {
      await handle.close();
    }
    return objectKey;
  } catch {
    if (created) await rm(file, { force: true }).catch(() => {});
    throw new CurriculumImportError(
      "storage",
      "The PDF could not be saved to private storage. Please retry.",
    );
  }
}

export async function readPdf(objectKey: string): Promise<Buffer> {
  const file = fileFor(objectKey);
  try {
    const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
    return await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      let bytes = 0;
      // No symlinks: this directory is private application data, never a static mount.
      const stream = handle.createReadStream();
      const timer = setTimeout(
        () => stream.destroy(new Error("timeout")),
        20_000,
      );
      stream.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > MAX_PDF_BYTES) stream.destroy(new Error("size"));
        else chunks.push(chunk);
      });
      stream.once("end", () => {
        clearTimeout(timer);
        resolve(Buffer.concat(chunks));
      });
      stream.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  } catch {
    throw new CurriculumImportError(
      "storage",
      "The protected PDF could not be read. Please retry or upload it again.",
    );
  }
}

export async function deletePdf(objectKey: string): Promise<void> {
  const file = fileFor(objectKey);
  try {
    await rm(file, { force: true });
  } catch {
    throw new CurriculumImportError(
      "storage",
      "Document cleanup failed. The source must remain unavailable; retry deletion to remove the stored PDF.",
    );
  }
}
