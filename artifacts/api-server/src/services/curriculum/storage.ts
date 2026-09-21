import { randomUUID } from "node:crypto";
import { Storage } from "@google-cloud/storage";
import { CurriculumImportError, MAX_PDF_BYTES } from "./errors";
import { validatePdfBytes } from "./pdf";

// Managed Replit sidecar authentication, identical to the App Storage template.
const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: "http://127.0.0.1:1106/token",
    type: "external_account",
    credential_source: {
      url: "http://127.0.0.1:1106/credential",
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
  retryOptions: { autoRetry: false },
});

function fileFor(objectKey: string) {
  if (!/^curriculum\/[a-f0-9-]{36}\.pdf$/.test(objectKey)) {
    throw new CurriculumImportError("storage", "Invalid curriculum document reference.");
  }
  const dir = process.env.PRIVATE_OBJECT_DIR;
  if (!dir) throw new CurriculumImportError("configuration", "Protected App Storage must be configured before uploading curriculum PDFs.");
  const [bucket, ...prefix] = dir.replace(/^\/+/, "").replace(/\/+$/, "").split("/");
  if (!bucket || !prefix.length) throw new CurriculumImportError("configuration", "Protected App Storage directory is not configured correctly.");
  return objectStorageClient.bucket(bucket).file(`${prefix.join("/")}/${objectKey}`);
}

export async function storePdf(buffer: Buffer): Promise<string> {
  validatePdfBytes(buffer);
  const objectKey = `curriculum/${randomUUID()}.pdf`;
  const file = fileFor(objectKey);
  try {
    await file.save(buffer, { resumable: false, timeout: 20_000, validation: "crc32c",
      metadata: { contentType: "application/pdf", cacheControl: "private, no-store",
        metadata: { objectAcl: JSON.stringify({ owner: "boardwork", visibility: "private" }) } } });
    return objectKey;
  } catch {
    throw new CurriculumImportError("storage", "The PDF could not be saved to protected App Storage. Please retry.");
  }
}

export async function readPdf(objectKey: string): Promise<Buffer> {
  const file = fileFor(objectKey);
  try {
    return await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      let bytes = 0;
      const stream = file.createReadStream();
      const timer = setTimeout(() => stream.destroy(new Error("timeout")), 20_000);
      stream.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > MAX_PDF_BYTES) stream.destroy(new Error("size")); else chunks.push(chunk);
      });
      stream.once("end", () => { clearTimeout(timer); resolve(Buffer.concat(chunks)); });
      stream.once("error", (error) => { clearTimeout(timer); reject(error); });
    });
  } catch {
    throw new CurriculumImportError("storage", "The protected PDF could not be read. Please retry or upload it again.");
  }
}

export async function deletePdf(objectKey: string): Promise<void> {
  const file = fileFor(objectKey);
  try { await file.delete({ ignoreNotFound: true }); }
  catch { throw new CurriculumImportError("storage", "Document cleanup failed. The source must remain unavailable; retry deletion to remove the stored PDF."); }
}