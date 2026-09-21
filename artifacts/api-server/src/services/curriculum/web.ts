import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { load } from "cheerio";
import { CurriculumImportError, MAX_PDF_BYTES, MAX_TEXT, type ImportContext } from "./errors";
import { extractPdf } from "./pdf";

export function officialUrl(raw: string): URL {
  let url: URL;
  try { url = new URL(raw); } catch { throw new CurriculumImportError("unsupported", "Use a valid official HTTPS source URL."); }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") ||
      !["ibo.org", "www.ibo.org"].includes(url.hostname) || raw.length > 2000) {
    throw new CurriculumImportError("unsupported", "Only public HTTPS pages on ibo.org and www.ibo.org are currently verified publisher sources.");
  }
  url.hash = "";
  return url;
}

export function publicIPv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = octets;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168 || b === 2)) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) || (a === 203 && b === 0));
}

async function download(url: URL, redirects = 0, signal = AbortSignal.timeout(20_000)): Promise<{ bytes: Buffer; type: string; url: string }> {
  signal.throwIfAborted();
  const addresses = await new Promise<Awaited<ReturnType<typeof resolveAddresses>>>((resolve, reject) => {
    const aborted = () => reject(new CurriculumImportError("timeout", "Publisher DNS lookup timed out. Please retry."));
    signal.addEventListener("abort", aborted, { once: true });
    resolveAddresses(url.hostname).then(resolve, reject).finally(() => signal.removeEventListener("abort", aborted));
  });
  if (!addresses.length || addresses.some(a => !publicIPv4(a.address))) {
    throw new CurriculumImportError("unsupported", "The publisher address is not a public internet address.");
  }
  return await new Promise((resolve, reject) => {
    const req = request(url, {
      signal, family: 4,
      // Pin DNS resolution to the checked address (no DNS rebinding between check and connect).
      lookup: (_hostname, _options, callback) => callback(null, addresses[0].address, 4),
      headers: { Accept: "text/html,application/pdf", "Accept-Encoding": "identity", "User-Agent": "Boardwork-Curriculum/1.0" },
    }, response => {
      const status = response.statusCode ?? 0;
      if ([301, 302, 303, 307, 308].includes(status)) {
        response.resume();
        try {
          const next = officialUrl(new URL(response.headers.location ?? "", url).href);
          if (redirects >= 3 || next.hostname !== url.hostname) throw new CurriculumImportError("unsupported", "Publisher redirect changed host or exceeded the limit. Use the final official URL directly.");
          resolve(download(next, redirects + 1, signal));
        } catch (error) { reject(error); }
        return;
      }
      if (status !== 200) {
        response.resume();
        reject(new CurriculumImportError("provider", "The publisher page is unavailable or requires access. Paste permitted text or upload your readable copy; sign-in restrictions are not bypassed."));
        return;
      }
      const type = String(response.headers["content-type"] ?? "").split(";")[0].toLowerCase();
      const limit = type === "application/pdf" ? MAX_PDF_BYTES : 2 * 1024 * 1024;
      if (!["application/pdf", "text/html", "application/xhtml+xml"].includes(type) ||
          Number(response.headers["content-length"] ?? 0) > limit ||
          (response.headers["content-encoding"] && response.headers["content-encoding"] !== "identity")) {
        response.destroy();
        reject(new CurriculumImportError("unsupported", "Publisher content has an unsupported format or exceeds the size limit."));
        return;
      }
      const chunks: Buffer[] = []; let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > limit) response.destroy(new CurriculumImportError("limit", "Publisher content exceeds the import size limit."));
        else chunks.push(chunk);
      });
      response.once("error", reject);
      response.once("end", () => resolve({ bytes: Buffer.concat(chunks), type, url: url.href }));
    });
    req.once("error", reject);
    req.end();
  });
}

function resolveAddresses(hostname: string) {
  return lookup(hostname, { family: 4, all: true });
}

let activeRetrievals = 0;
export async function fetchReference(rawUrl: string) {
  const url = officialUrl(rawUrl);
  if (activeRetrievals >= 2) throw new CurriculumImportError("rate_limit", "Two curriculum sources are already being retrieved. Retry shortly.");
  activeRetrievals++;
  try {
    const result = await download(url);
    let pages; let title: string;
    if (result.type === "application/pdf") {
      pages = (await extractPdf(result.bytes)).pages;
      title = pages[0].text.split("\n")[0].trim().slice(0, 200);
    } else {
      const $ = load(result.bytes.toString("utf8"));
      title = $("h1").first().text().trim() || $("title").text().trim();
      $("script,style,nav,header,footer,noscript,iframe,form,[hidden],[aria-hidden=true]").remove();
      const main = $("main").first().length ? $("main").first() : $("article").first().length ? $("article").first() : $("body");
      main.find("br,p,div,section,h1,h2,h3,li,tr").each((_i, el) => { $(el).append("\n"); });
      main.find("td,th").each((_i, el) => { $(el).append("\t"); });
      const text = main.text().replace(/[ \t]+/g, " ").replace(/\n\s*\n/g, "\n").trim();
      if (text.length < 100 || text.length > MAX_TEXT || /sign in to (?:access|continue)|subscribe to (?:access|continue)/i.test(text)) {
        throw new CurriculumImportError("unsupported", "The public page does not contain a complete readable source within the import limit. Paste permitted relevant text or upload a readable section.");
      }
      pages = [{ page: 1, text }];
    }
    return { pages, title: title.slice(0, 200) || "International Baccalaureate public source",
      publisher: "International Baccalaureate", url: result.url, retrievedAt: new Date().toISOString(), edition: null };
  } catch (error) {
    if (error instanceof CurriculumImportError) throw error;
    throw new CurriculumImportError("provider", "The official source could not be retrieved within the time limit. Retry or use manual text/upload.");
  } finally { activeRetrievals--; }
}

export function discoveryContext(context: ImportContext): string {
  // Do not forward arbitrary teacher notes as search queries. Only a validated public taxonomy.
  if (!/^(?:IB\s+)?MYP$|^International Baccalaureate Middle Years Programme$/i.test(context.framework?.trim() ?? "") ||
      !/^design$/i.test(context.subject.trim())) {
    throw new CurriculumImportError("unsupported", "Official discovery currently supports MYP Design only. Other curriculum authority mappings are not yet validated; use text or PDF.");
  }
  const year = context.programmeYear?.trim() ?? "";
  if (year && !/^(?:(?:MYP\s+)?year\s*)?[1-5]$/i.test(year)) {
    throw new CurriculumImportError("unsupported", "Choose an explicit MYP programme year 1–5 for discovery, or leave it blank. School grade is not used as programme year.");
  }
  return `site:ibo.org MYP Design public curriculum subject brief objectives${year ? ` programme year ${year.match(/[1-5]/)![0]}` : ""}`;
}