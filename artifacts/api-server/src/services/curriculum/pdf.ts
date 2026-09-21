import { Worker } from "node:worker_threads";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { CurriculumImportError, MAX_PDF_BYTES, MAX_TEXT, type Page } from "./errors";

export function validatePdfBytes(buffer: Buffer): void {
  if (!buffer.length || buffer.length > MAX_PDF_BYTES) {
    throw new CurriculumImportError("limit", "Upload a PDF smaller than 20 MB, or paste the relevant text.");
  }
  if (!buffer.subarray(0, 8).toString("ascii").startsWith("%PDF-") ||
      !buffer.subarray(-2048).toString("latin1").includes("%%EOF")) {
    throw new CurriculumImportError("invalid_pdf", "This is not a complete PDF. Export a readable PDF again or paste the relevant text.");
  }
}

// Runs parser CPU/memory work away from the HTTP event loop; the parent can terminate it.
const PARSER_WORKER = `
const { parentPort, workerData } = require("node:worker_threads");
(async () => {
  const {getDocument, OPS} = await import(workerData.moduleUrl);
  const task = getDocument({data:new Uint8Array(workerData.bytes), isEvalSupported:false,
    useSystemFonts:true, disableFontFace:true, stopAtErrors:true, verbosity:0});
  task.onPassword = () => { parentPort.postMessage({error:"Encrypted PDFs are not supported. Export an unencrypted readable copy or paste the text."}); task.destroy(); };
  const doc = await task.promise;
  try {
    if (doc.numPages > 100) throw Error("PDF exceeds 100 pages. Upload only the relevant section.");
    const pages = []; let total = 0;
    for (let page = 1; page <= doc.numPages; page++) {
      const p = await doc.getPage(page);
      const content = await p.getTextContent();
      let text = "", lastY = null;
      for (const item of content.items) {
        if (typeof item.str !== "string") continue;
        const y = item.transform[5];
        if (lastY !== null && Math.abs(y-lastY) > 3 && !text.endsWith("\\n")) text += "\\n";
        text += item.str + (item.hasEOL ? "\\n" : "\\t");
        lastY = y;
      }
      text = text.replace(/[\\t ]+\\n/g,"\\n").trim();
      const operators = await p.getOperatorList();
      const hasImage = operators.fnArray.some(op => [OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintImageMaskXObject].includes(op));
      if (text.replace(/\\s/g,"").length < (hasImage ? 160 : 20) || (text.match(/\\uFFFD/g)||[]).length > text.length * 0.01)
        throw Error("Page " + page + " has insufficient readable text. Scanned or incomplete PDFs need OCR first; upload a readable section or paste the text.");
      total += text.length;
      if (total > workerData.maxText) throw Error("PDF text exceeds the import limit. Upload a shorter section.");
      pages.push({page,text});
      p.cleanup();
    }
    parentPort.postMessage({pages});
  } catch (e) {
    if (/^(Page |PDF )/.test(e.message)) parentPort.postMessage({error:e.message});
    else throw e;
  } finally { await doc.destroy(); }
})().catch(e=>parentPort.postMessage({error: e.name === "PasswordException" ? "Encrypted PDFs are not supported. Upload an unencrypted copy." :
  /^(Page |PDF )/.test(e.message) ? e.message : "PDF is corrupt or could not be read completely. Export a new readable copy or paste the relevant text."}));
`;

let activeParsers = 0;
export async function extractPdf(buffer: Buffer): Promise<{ pages: Page[] }> {
  validatePdfBytes(buffer);
  if (activeParsers >= 2) throw new CurriculumImportError("rate_limit", "Two documents are already processing. Please retry shortly.");
  activeParsers++;
  try {
    const require = createRequire(import.meta.url);
    const moduleUrl = pathToFileURL(require.resolve("pdfjs-dist/legacy/build/pdf.mjs")).href;
    return await new Promise((resolve, reject) => {
      const worker = new Worker(PARSER_WORKER, {
        eval: true,
        workerData: { moduleUrl, bytes: buffer, maxText: MAX_TEXT },
        resourceLimits: { maxOldGenerationSizeMb: 192, maxYoungGenerationSizeMb: 32 },
      });
      let settled = false;
      const finish = (error?: Error, result?: { pages: Page[] }) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        void worker.terminate();
        if (error) reject(error); else resolve(result!);
      };
      const timer = setTimeout(() => finish(new CurriculumImportError("timeout", "PDF processing exceeded 20 seconds. Upload a shorter readable section or paste text.")), 20_000);
      worker.once("message", (message) => message.error
        ? finish(new CurriculumImportError("invalid_pdf", message.error))
        : finish(undefined, message));
      worker.once("error", () => finish(new CurriculumImportError("invalid_pdf", "PDF processing failed. Upload a shorter readable PDF or paste text.")));
      worker.once("exit", () => finish(new CurriculumImportError("invalid_pdf", "PDF processing stopped before completion. Try a shorter readable section.")));
    });
  } finally { activeParsers--; }
}