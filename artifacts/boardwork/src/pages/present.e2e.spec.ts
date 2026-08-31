import { expect, test, type Page } from "@playwright/test";
import { inflateSync } from "node:zlib";
import { readFile } from "node:fs/promises";

const longMixedDirectionActivity = {
  id: "activity-long-mixed-direction",
  classId: "class-1",
  eyebrow: "פעילות • Classroom workshop • نشاط تعاوني",
  title:
    "How do we explain a changing system when the evidence moves between עברית ו العربية and English? 日本語の観察と हिन्दी की व्याख्या belong in the same careful explanation.",
  task:
    "Read the evidence in both directions, compare the observations, and write one connected explanation. اشرح كيف تغيّر الدليل، ثم اربط ذلك بما لاحظته في التجربة؛ השתמשו במשפטים מלאים כדי להסביר لماذا התוצאה مهمة עבור הקבוצה.",
  prompts: [
    "Describe the strongest pattern in the data, then support it with a specific observation: العربية والإنجليزية معًا يجب أن تبقيا واضحتين، וגם הסבר קצר בעברית צריך להישאר مرتبطًا بالفكرة המרכזית.",
    "Write a concluding sentence that a partner can test. 日本語の観察と हिन्दी का निष्कर्ष should remain readable beside the mixed-direction evidence, without losing the order of the reasoning or the meaning of any phrase.",
  ],
  durationMinutes: 7,
  deviceMode: "off",
  technologyMode: "no_computer",
};

const appState = {
  activeClassId: "class-1",
  classes: [
    {
      id: "class-1",
      name: "Advisory",
      grade: "5",
      subject: "Science",
      color: "#2563eb",
      defaultDuration: 7,
      defaultDeviceMode: "off",
      arrivalRoutine: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  chips: [],
  instructionalContexts: [],
  units: [],
  activities: [longMixedDirectionActivity],
};

type Png = {
  width: number;
  height: number;
  pixels: Uint8Array;
};

type Region = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function decodePng(buffer: Buffer): Png {
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  expect(buffer.subarray(0, signature.length)).toEqual(signature);

  let offset = signature.length;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat: Buffer[] = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  expect({ bitDepth, colorType }).toEqual({ bitDepth: 8, colorType: 6 });
  const inflated = inflateSync(Buffer.concat(idat));
  const rowBytes = width * 4;
  const pixels = new Uint8Array(width * height * 4);
  let inputOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset++];
    const rowStart = y * rowBytes;
    for (let x = 0; x < rowBytes; x += 1) {
      const raw = inflated[inputOffset++];
      const left = x >= 4 ? pixels[rowStart + x - 4] : 0;
      const above = y > 0 ? pixels[rowStart - rowBytes + x] : 0;
      const upperLeft =
        y > 0 && x >= 4 ? pixels[rowStart - rowBytes + x - 4] : 0;

      let value = raw;
      if (filter === 1) value = (raw + left) & 0xff;
      if (filter === 2) value = (raw + above) & 0xff;
      if (filter === 3) value = (raw + Math.floor((left + above) / 2)) & 0xff;
      if (filter === 4) {
        const predictor = left + above - upperLeft;
        const distanceLeft = Math.abs(predictor - left);
        const distanceAbove = Math.abs(predictor - above);
        const distanceUpperLeft = Math.abs(predictor - upperLeft);
        const nearest =
          distanceLeft <= distanceAbove && distanceLeft <= distanceUpperLeft
            ? left
            : distanceAbove <= distanceUpperLeft
              ? above
              : upperLeft;
        value = (raw + nearest) & 0xff;
      }
      pixels[rowStart + x] = value;
    }
  }

  return { width, height, pixels };
}

function countVisiblePixels(
  png: Png,
  region: Region,
  background = [253, 252, 248],
) {
  const left = Math.max(0, Math.floor(region.x));
  const top = Math.max(0, Math.floor(region.y));
  const right = Math.min(png.width, Math.ceil(region.x + region.width));
  const bottom = Math.min(png.height, Math.ceil(region.y + region.height));
  let visible = 0;

  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const pixel = (y * png.width + x) * 4;
      const difference =
        Math.abs(png.pixels[pixel] - background[0]) +
        Math.abs(png.pixels[pixel + 1] - background[1]) +
        Math.abs(png.pixels[pixel + 2] - background[2]);
      if (png.pixels[pixel + 3] > 0 && difference > 18) visible += 1;
    }
  }

  return visible;
}

function countNonBackgroundPixelsAtExportEdge(png: Png) {
  let visible = 0;
  const coordinates = [
    ...Array.from({ length: png.width }, (_, x) => [x, 0]),
    ...Array.from({ length: png.width }, (_, x) => [x, png.height - 1]),
    ...Array.from({ length: png.height }, (_, y) => [0, y]),
    ...Array.from({ length: png.height }, (_, y) => [png.width - 1, y]),
  ];

  for (const [x, y] of coordinates) {
    const pixel = (y * png.width + x) * 4;
    const difference =
      Math.abs(png.pixels[pixel] - 253) +
      Math.abs(png.pixels[pixel + 1] - 252) +
      Math.abs(png.pixels[pixel + 2] - 248);
    if (png.pixels[pixel + 3] > 0 && difference > 18) visible += 1;
  }

  return visible;
}

async function reportBrowserHealth(page: Page) {
  const consoleFailures: string[] = [];
  const pageErrors: string[] = [];
  const networkFailures: string[] = [];
  const badResponses: string[] = [];
  const nonLocalFontRequests: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleFailures.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    networkFailures.push(`${request.url()} (${request.failure()?.errorText ?? "unknown"})`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      badResponses.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on("request", (request) => {
    if (request.resourceType() !== "font") return;
    const url = new URL(request.url());
    if (!url.pathname.includes("/fonts/")) nonLocalFontRequests.push(request.url());
  });

  return () => {
    expect(
      consoleFailures,
      `browser console failures: ${JSON.stringify(consoleFailures)}`,
    ).toEqual([]);
    expect(pageErrors, `page errors: ${JSON.stringify(pageErrors)}`).toEqual([]);
    expect(
      networkFailures,
      `network failures: ${JSON.stringify(networkFailures)}`,
    ).toEqual([]);
    expect(
      badResponses,
      `unsuccessful network responses: ${JSON.stringify(badResponses)}`,
    ).toEqual([]);
    expect(
      nonLocalFontRequests,
      `non-local font requests: ${JSON.stringify(nonLocalFontRequests)}`,
    ).toEqual([]);
  };
}

test("exports long mixed-direction board text as a complete local-font PNG", async ({
  page,
}) => {
  const assertBrowserHealth = await reportBrowserHealth(page);

  await page.route("**/api/auth/status", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ passwordRequired: false, authenticated: true }),
    }),
  );
  await page.route("**/api/app-state", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(appState),
    }),
  );

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/present/activity-long-mixed-direction");
  await expect(page.getByTestId("present-title")).toHaveText(
    longMixedDirectionActivity.title,
  );
  await expect(page.getByTestId("present-task")).toHaveText(
    longMixedDirectionActivity.task,
  );
  await expect(
    page.getByTestId("presentation-surface").locator(".presentation-prompt"),
  ).toHaveCount(2);

  const regions = await page.locator(".presentation-surface--export").evaluate((surface) => {
    const surfaceBounds = surface.getBoundingClientRect();
    const selectors = [
      ["title", ".presentation-header-title"],
      ["task", ".presentation-task"],
      ["prompt-one", ".presentation-prompt:nth-child(1)"],
      ["prompt-two", ".presentation-prompt:nth-child(2)"],
    ] as const;

    return selectors.map(([name, selector]) => {
      const element = surface.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing export region: ${name}`);
      const bounds = element.getBoundingClientRect();
      return {
        name,
        x: bounds.left - surfaceBounds.left,
        y: bounds.top - surfaceBounds.top,
        width: bounds.width,
        height: bounds.height,
      };
    });
  });

  for (const region of regions) {
    expect(region.x, `${region.name} starts inside export bounds`).toBeGreaterThan(0);
    expect(region.y, `${region.name} starts inside export bounds`).toBeGreaterThan(0);
    expect(
      region.x + region.width,
      `${region.name} ends inside export bounds`,
    ).toBeLessThan(1920);
    expect(
      region.y + region.height,
      `${region.name} ends inside export bounds`,
    ).toBeLessThan(1080);
  }

  await page.getByTestId("button-teacher-controls").click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("button-export-png").click();
  const download = await downloadPromise;
  const png = decodePng(await readFile(await download.path()!));

  expect({ width: png.width, height: png.height }).toEqual({
    width: 1920,
    height: 1080,
  });
  expect(countNonBackgroundPixelsAtExportEdge(png)).toBe(0);
  for (const region of regions) {
    expect(
      countVisiblePixels(png, region),
      `${region.name} should contain visible exported pixels`,
    ).toBeGreaterThan(20);
  }

  assertBrowserHealth();
});