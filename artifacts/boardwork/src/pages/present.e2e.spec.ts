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

const localVisualUrl =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620">
      <rect width="900" height="620" rx="40" fill="#dbeafe"/>
      <path d="M90 480 C190 150 330 520 450 220 S700 100 810 390" fill="none" stroke="#1d4ed8" stroke-width="26" stroke-linecap="round"/>
      <circle cx="230" cy="300" r="54" fill="#f97316"/>
      <circle cx="670" cy="280" r="72" fill="#16a34a"/>
      <path d="M160 530 H740" stroke="#0f172a" stroke-width="12" stroke-linecap="round"/>
    </svg>
  `);

const longMixedDirectionVisualActivity = {
  ...longMixedDirectionActivity,
  visualUrl: localVisualUrl,
  visualDescription: "A local diagram showing a changing system.",
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

const visualAppState = {
  ...appState,
  activities: [longMixedDirectionVisualActivity],
};

async function stubPresentationState(
  page: Page,
  state: typeof appState = appState,
) {
  await page.addInitScript(() => {
    const frozenNow = 1_756_800_000_000;
    Date.now = () => frozenNow;
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/auth/status", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ passwordRequired: false, authenticated: true }),
    }),
  );
  await page.route("**/api/app-state", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(state),
    }),
  );
}

async function hideTimerFromStudents(page: Page) {
  await page.getByRole("button", { name: "Adjust" }).click();
  await page.getByRole("button", { name: "Hide timer from students" }).click();
  await expect(page.getByTestId("button-show-timer")).toBeVisible();
}

async function settlePresentationSurface(page: Page) {
  await expect(page.getByTestId("presentation-surface")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images).map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
            }),
      ),
    );
  });
}

async function assertExportSurfaceHasNoLiveDivider(page: Page) {
  const exportSurface = page.locator(".presentation-surface--export");
  await expect(exportSurface).toHaveCount(1);
  await expect(exportSurface.locator(".presentation-layout-divider")).toHaveCount(0);
  await expect(exportSurface).toHaveCSS("width", "1920px");
  await expect(exportSurface).toHaveCSS("height", "1080px");
}

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

test("keeps the large timer reading tight while card rows stay fluid", async ({
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
      body: JSON.stringify(visualAppState),
    }),
  );

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/present/activity-long-mixed-direction");

  const splitGeometry = await page.locator(".presentation-timer").evaluate((timer) => {
    const reading = timer.querySelector<HTMLElement>(".presentation-timer-reading");
    const progress = timer.querySelector<HTMLElement>(".presentation-timer-progress");
    const controls = timer.querySelector<HTMLElement>(".presentation-timer-controls");
    if (!reading || !progress || !controls) throw new Error("Missing large timer row");

    const timerBounds = timer.getBoundingClientRect();
    const readingBounds = reading.getBoundingClientRect();
    const progressBounds = progress.getBoundingClientRect();
    const controlsBounds = controls.getBoundingClientRect();
    return {
      timerWidth: timerBounds.width,
      readingWidth: readingBounds.width,
      readingRight: readingBounds.right,
      timerRight: timerBounds.right,
      progressWidth: progressBounds.width,
      controlsWidth: controlsBounds.width,
      whiteSpace: getComputedStyle(reading).whiteSpace,
    };
  });

  expect(splitGeometry.readingWidth).toBeLessThan(splitGeometry.timerWidth);
  expect(splitGeometry.readingRight).toBeLessThanOrEqual(splitGeometry.timerRight);
  expect(splitGeometry.progressWidth).toBeGreaterThan(splitGeometry.timerWidth * 0.8);
  expect(splitGeometry.controlsWidth).toBeGreaterThan(splitGeometry.timerWidth * 0.8);
  expect(splitGeometry.whiteSpace).toBe("nowrap");

  await page.route("**/api/app-state", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ...appState,
        activities: [{ ...longMixedDirectionActivity, durationMinutes: 1000 }],
      }),
    }),
  );
  for (const viewport of [
    { width: 1024, height: 640, label: "projector" },
    { width: 854, height: 534, label: "150% zoom equivalent" },
    { width: 640, height: 400, label: "200% zoom equivalent" },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/present/activity-long-mixed-direction");

    const timerOnlyReading = page.locator(".presentation-timer-reading");
    const timerProgress = page.locator(".presentation-timer-progress");
    const timerControls = page.locator(".presentation-timer-controls");
    const teacherControls = page.getByTestId("button-teacher-controls");
    await expect(timerOnlyReading).toHaveText("1000:00");
    await expect(timerProgress).toBeVisible();
    await expect(timerControls).toBeVisible();
    await expect(teacherControls).toBeVisible();
    const timerOnlyGeometry = await timerOnlyReading.evaluate((reading) => {
      const readingBounds = reading.getBoundingClientRect();
      const timer = reading.closest(".presentation-timer");
      const timerBounds = timer?.getBoundingClientRect();
      const progressBounds = timer?.querySelector(".presentation-timer-progress")?.getBoundingClientRect();
      const controlsBounds = timer?.querySelector(".presentation-timer-controls")?.getBoundingClientRect();
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        timerWidth: timerBounds?.width ?? 0,
        readingWidth: readingBounds.width,
        readingRight: readingBounds.right,
        timerRight: timerBounds?.right ?? 0,
        progressWidth: progressBounds?.width ?? 0,
        controlsWidth: controlsBounds?.width ?? 0,
        whiteSpace: getComputedStyle(reading).whiteSpace,
      };
    });

    expect(
      timerOnlyGeometry.documentWidth,
      `${viewport.label} should not overflow horizontally`,
    ).toBeLessThanOrEqual(timerOnlyGeometry.viewportWidth);
    expect(timerOnlyGeometry.readingWidth).toBeGreaterThan(0);
    expect(
      timerOnlyGeometry.readingRight,
      `${viewport.label} timer reading should fit in its card`,
    ).toBeLessThanOrEqual(timerOnlyGeometry.timerRight);
    expect(timerOnlyGeometry.whiteSpace).toBe("nowrap");
    expect(timerOnlyGeometry.progressWidth).toBeGreaterThan(timerOnlyGeometry.timerWidth * 0.8);
    expect(timerOnlyGeometry.controlsWidth).toBeGreaterThan(timerOnlyGeometry.timerWidth * 0.8);

    const teacherControlsBox = await teacherControls.boundingBox();
    expect(teacherControlsBox).not.toBeNull();
    expect(teacherControlsBox!.x).toBeGreaterThanOrEqual(0);
    expect(teacherControlsBox!.y).toBeGreaterThanOrEqual(0);
    expect(teacherControlsBox!.x + teacherControlsBox!.width).toBeLessThanOrEqual(
      timerOnlyGeometry.viewportWidth,
    );
    expect(teacherControlsBox!.y + teacherControlsBox!.height).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerHeight),
    );
  }

  assertBrowserHealth();
});

test("exports long mixed-direction board text beside a visual without clipping", async ({
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
      body: JSON.stringify(visualAppState),
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
  const visual = page.locator(".presentation-surface--export .presentation-visual img");
  await expect(visual).toBeVisible();
  await expect(visual).toHaveJSProperty("complete", true);

  const regions = await page.locator(".presentation-surface--export").evaluate((surface) => {
    const surfaceBounds = surface.getBoundingClientRect();
    const selectors = [
      ["title", ".presentation-header-title"],
      ["task", ".presentation-task"],
      ["prompt-one", ".presentation-prompt:nth-child(1)"],
      ["prompt-two", ".presentation-prompt:nth-child(2)"],
      ["visual", ".presentation-visual img"],
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

test("keeps Present disclosures reachable at zoom-equivalent viewport sizes", async ({
  page,
}) => {
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

  const zoomViewports = [
    { width: 1024, height: 640, zoom: "125%" },
    { width: 854, height: 534, zoom: "150%" },
    { width: 640, height: 400, zoom: "200%" },
  ];

  for (const viewport of zoomViewports) {
    await page.emulateMedia({
      reducedMotion: viewport.zoom === "200%" ? "reduce" : "no-preference",
    });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/present/activity-long-mixed-direction");

    const pageMetrics = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      documentWidth: document.documentElement.scrollWidth,
    }));
    expect(pageMetrics.documentWidth, `${viewport.zoom} should not overflow horizontally`).toBeLessThanOrEqual(
      pageMetrics.viewportWidth,
    );

    await page.getByRole("button", { name: "Minimize timer" }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    const timerToggle = page.getByTestId("button-toggle-timer-controls");
    const timerProgress = page.getByRole("progressbar", { name: "Time remaining" });
    const teacherToggle = page.getByTestId("button-teacher-controls");
    await expect(timerToggle).toBeVisible();
    await expect(timerProgress).toBeVisible();
    await expect(teacherToggle).toBeVisible();
    await expect(timerProgress).toHaveAttribute("aria-valuemax", "420");
    await expect(timerProgress).toHaveAttribute("aria-valuenow", "420");

    const compactReading = page.locator(".presentation-time-reading");
    const compactReadingFontSize = await compactReading.evaluate(
      (element) => Number.parseFloat(getComputedStyle(element).fontSize),
    );
    expect(
      compactReadingFontSize,
      `${viewport.zoom} compact timer reading should include the 15% enlargement`,
    ).toBeGreaterThanOrEqual(26.5);

    const presentationColors = await page.getByTestId("presentation-surface").evaluate(
      (surface) => ({
        accent: surface.style.getPropertyValue("--presentation-accent"),
        accentSoft: surface.style.getPropertyValue("--presentation-accent-soft"),
      }),
    );
    expect(presentationColors).toEqual({
      accent: "#334155",
      accentSoft: "#DADCDC",
    });
    const ringTransitionDuration = await timerProgress
      .locator(".presentation-time-compact-ring-progress")
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    if (viewport.zoom === "200%") {
      expect(
        Number.parseFloat(ringTransitionDuration),
        `${viewport.zoom} reduced-motion ring transition`,
      ).toBeLessThan(0.001);
    } else {
      expect(
        ringTransitionDuration,
        `${viewport.zoom} ring transition`,
      ).toBe("0.8s");
    }

    for (const [name, locator] of [
      ["timer trigger", timerToggle],
      ["timer progress ring", timerProgress],
      ["teacher controls trigger", teacherToggle],
    ] as const) {
      const box = await locator.boundingBox();
      expect(box, `${name} should have geometry at ${viewport.zoom}`).not.toBeNull();
      expect(box!.x, `${name} should start inside the viewport at ${viewport.zoom}`).toBeGreaterThanOrEqual(0);
      expect(box!.y, `${name} should start inside the viewport at ${viewport.zoom}`).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, `${name} should fit horizontally at ${viewport.zoom}`).toBeLessThanOrEqual(
        pageMetrics.viewportWidth,
      );
      expect(box!.y + box!.height, `${name} should fit vertically at ${viewport.zoom}`).toBeLessThanOrEqual(
        pageMetrics.viewportHeight,
      );
    }

    const readingBounds = await compactReading.evaluate((reading) => {
      const readingBounds = reading.getBoundingClientRect();
      const shellBounds = reading.closest(".presentation-time-compact-shell")!.getBoundingClientRect();
      return {
        documentWidth: document.documentElement.scrollWidth,
        readingLeft: readingBounds.left,
        readingRight: readingBounds.right,
        shellLeft: shellBounds.left,
        shellRight: shellBounds.right,
      };
    });
    expect(
      readingBounds.documentWidth,
      `${viewport.zoom} should not overflow horizontally after minimizing`,
    ).toBeLessThanOrEqual(pageMetrics.viewportWidth);
    expect(readingBounds.readingLeft).toBeGreaterThanOrEqual(readingBounds.shellLeft);
    expect(readingBounds.readingRight).toBeLessThanOrEqual(readingBounds.shellRight);

    await timerToggle.hover();
    const timerPanel = page.locator("#presentation-compact-timer-controls");
    await expect(timerPanel).toBeVisible();
    const timerPanelBox = await timerPanel.boundingBox();
    expect(timerPanelBox, `timer panel should have geometry at ${viewport.zoom}`).not.toBeNull();
    expect(timerPanelBox!.x).toBeGreaterThanOrEqual(0);
    expect(timerPanelBox!.y).toBeGreaterThanOrEqual(0);
    expect(timerPanelBox!.x + timerPanelBox!.width).toBeLessThanOrEqual(pageMetrics.viewportWidth);
    expect(timerPanelBox!.y + timerPanelBox!.height).toBeLessThanOrEqual(pageMetrics.viewportHeight);

    const initialProgress = Number(await timerProgress.getAttribute("aria-valuenow"));
    await page.getByRole("button", { name: "Start or resume timer" }).click();
    await expect
      .poll(async () => Number(await timerProgress.getAttribute("aria-valuenow")), {
        message: `${viewport.zoom} compact timer ring should update while running`,
      })
      .toBeLessThan(initialProgress);
    await expect(timerProgress).toHaveAttribute("aria-valuetext", /remaining$/);

    await teacherToggle.hover();
    const teacherPanel = page.locator("#presentation-controls-panel");
    await expect(teacherPanel).toBeVisible();
    const teacherPanelBox = await teacherPanel.boundingBox();
    expect(teacherPanelBox, `teacher panel should have geometry at ${viewport.zoom}`).not.toBeNull();
    expect(teacherPanelBox!.x).toBeGreaterThanOrEqual(0);
    expect(teacherPanelBox!.y).toBeGreaterThanOrEqual(0);
    expect(teacherPanelBox!.x + teacherPanelBox!.width).toBeLessThanOrEqual(pageMetrics.viewportWidth);
    expect(teacherPanelBox!.y + teacherPanelBox!.height).toBeLessThanOrEqual(pageMetrics.viewportHeight);

    await expect(page.getByTestId("button-exit-present")).toBeVisible();
    await expect(page.getByTestId("button-fullscreen")).toBeVisible();
  }
});

test("keeps a multi-digit compact timer reading inside its themed ring", async ({ page }) => {
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
      body: JSON.stringify({
        ...appState,
        activities: [{ ...longMixedDirectionActivity, durationMinutes: 100 }],
      }),
    }),
  );

  await page.setViewportSize({ width: 640, height: 400 });
  await page.goto("/present/activity-long-mixed-direction");
  await page.getByRole("button", { name: "Minimize timer" }).click();

  const reading = page.locator(".presentation-time-reading");
  await expect(reading).toHaveText("100:00");
  const bounds = await reading.evaluate((element) => {
    const readingBounds = element.getBoundingClientRect();
    const shellBounds = element.closest(".presentation-time-compact-shell")!.getBoundingClientRect();
    const toggleBounds = element.closest(".presentation-time-compact-shell")!.querySelector("button")!.getBoundingClientRect();
    return {
      documentWidth: document.documentElement.scrollWidth,
      readingLeft: readingBounds.left,
      readingRight: readingBounds.right,
      shellLeft: shellBounds.left,
      shellRight: shellBounds.right,
      timerRight: toggleBounds.right,
    };
  });

  expect(bounds.documentWidth).toBeLessThanOrEqual(640);
  expect(bounds.readingLeft).toBeGreaterThanOrEqual(bounds.shellLeft);
  expect(bounds.readingRight).toBeLessThanOrEqual(bounds.shellRight);
  expect(bounds.timerRight).toBeLessThanOrEqual(640);
  assertBrowserHealth();
});

test("keeps Present controls tappable in a short landscape tablet viewport", async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 1024, height: 600 },
  });
  const page = await context.newPage();

  try {
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
        body: JSON.stringify({
          ...appState,
          activities: [
            {
              ...longMixedDirectionActivity,
              title: "Independent practice",
              task: "Work quietly.",
              prompts: ["Explain your thinking."],
              durationMinutes: 5,
            },
          ],
        }),
      }),
    );

    await page.goto("/present/activity-long-mixed-direction");
    await expect(page.getByTestId("present-title")).toHaveText("Independent practice");

    await page.getByRole("button", { name: "Minimize timer" }).tap();
    const timerToggle = page.getByTestId("button-toggle-timer-controls");
    await expect(timerToggle).toBeVisible();
    await timerToggle.tap();

    const timerPanel = page.locator("#presentation-compact-timer-controls");
    await expect(timerPanel).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start or resume timer" }),
    ).toBeVisible();

    const viewport = page.viewportSize();
    expect(viewport).toEqual({ width: 1024, height: 600 });
    const timerPanelBox = await timerPanel.boundingBox();
    expect(timerPanelBox).not.toBeNull();
    expect(timerPanelBox!.x).toBeGreaterThanOrEqual(0);
    expect(timerPanelBox!.y).toBeGreaterThanOrEqual(0);
    expect(timerPanelBox!.x + timerPanelBox!.width).toBeLessThanOrEqual(viewport!.width);
    expect(timerPanelBox!.y + timerPanelBox!.height).toBeLessThanOrEqual(viewport!.height);

    await timerToggle.tap();
    await expect(timerPanel).toBeHidden();
    await expect(timerToggle).toHaveAttribute("aria-expanded", "false");

    const teacherToggle = page.getByTestId("button-teacher-controls");
    await teacherToggle.tap();
    const teacherPanel = page.locator("#presentation-controls-panel");
    await expect(teacherPanel).toBeVisible();

    const teacherPanelBox = await teacherPanel.boundingBox();
    expect(teacherPanelBox).not.toBeNull();
    expect(teacherPanelBox!.x).toBeGreaterThanOrEqual(0);
    expect(teacherPanelBox!.y).toBeGreaterThanOrEqual(0);
    expect(teacherPanelBox!.x + teacherPanelBox!.width).toBeLessThanOrEqual(viewport!.width);
    expect(teacherPanelBox!.y + teacherPanelBox!.height).toBeLessThanOrEqual(viewport!.height);

    const exportAction = page.getByTestId("button-export-png");
    await expect(exportAction).toBeVisible();
    const exportActionBox = await exportAction.boundingBox();
    expect(exportActionBox).not.toBeNull();
    expect(exportActionBox!.x + exportActionBox!.width).toBeLessThanOrEqual(viewport!.width);
    expect(exportActionBox!.y + exportActionBox!.height).toBeLessThanOrEqual(viewport!.height);

    const downloadPromise = page.waitForEvent("download");
    await exportAction.tap();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.png$/);

    await teacherToggle.tap();
    await expect(teacherPanel).toBeHidden();
    await expect(teacherToggle).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => document.activeElement?.closest("#presentation-controls-panel"),
      ),
    ).toBeNull();

    assertBrowserHealth();
  } finally {
    await context.close();
  }
});

test("captures stable responsive Present compositions and keeps export surfaces clean", async ({
  page,
}) => {
  const screenshotOptions = {
    animations: "disabled" as const,
    caret: "hide" as const,
    scale: "css" as const,
  };
  const liveSurface = page.getByTestId("presentation-surface");

  await stubPresentationState(page, visualAppState);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/present/activity-long-mixed-direction");
  await settlePresentationSurface(page);
  await expect(liveSurface.getByTestId("presentation-layout-divider")).toBeVisible();
  await expect(liveSurface.locator(".presentation-rail--split")).toBeVisible();
  await assertExportSurfaceHasNoLiveDivider(page);
  await expect(liveSurface).toHaveScreenshot(
    "present-wide.png",
    screenshotOptions,
  );

  await page.setViewportSize({ width: 640, height: 800 });
  await page.goto("/present/activity-long-mixed-direction");
  await settlePresentationSurface(page);
  await expect(liveSurface.getByTestId("presentation-layout-divider")).toBeHidden();
  const narrowGridTracks = await liveSurface
    .locator(".presentation-main")
    .evaluate((main) => getComputedStyle(main).gridTemplateColumns.trim().split(/\s+/));
  expect(narrowGridTracks).toHaveLength(1);
  await expect(liveSurface.locator(".presentation-rail--split")).toBeVisible();
  await expect(liveSurface).toHaveScreenshot(
    "present-narrow-single-column.png",
    screenshotOptions,
  );

  await stubPresentationState(page, appState);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/present/activity-long-mixed-direction");
  await settlePresentationSurface(page);
  await hideTimerFromStudents(page);
  await expect(liveSurface.locator(".presentation-main--content-only")).toBeVisible();
  await expect(liveSurface.getByTestId("presentation-layout-divider")).toHaveCount(0);
  await expect(liveSurface).toHaveScreenshot(
    "present-content-only.png",
    screenshotOptions,
  );

  await page.goto("/present/activity-long-mixed-direction");
  await settlePresentationSurface(page);
  await expect(liveSurface.locator(".presentation-rail--timer-only")).toBeVisible();
  await expect(liveSurface.getByTestId("presentation-layout-divider")).toBeVisible();
  await expect(liveSurface).toHaveScreenshot(
    "present-timer-only.png",
    screenshotOptions,
  );

  await stubPresentationState(page, visualAppState);
  await page.goto("/present/activity-long-mixed-direction");
  await settlePresentationSurface(page);
  await hideTimerFromStudents(page);
  await expect(liveSurface.locator(".presentation-rail--image-only")).toBeVisible();
  await expect(liveSurface.getByTestId("presentation-layout-divider")).toBeVisible();
  await expect(liveSurface).toHaveScreenshot(
    "present-visual-only.png",
    screenshotOptions,
  );

  await page.goto("/present/activity-long-mixed-direction");
  await settlePresentationSurface(page);
  await expect(liveSurface.locator(".presentation-rail--split")).toBeVisible();
  await expect(liveSurface.getByTestId("presentation-layout-divider")).toBeVisible();
  await expect(liveSurface).toHaveScreenshot(
    "present-both-present.png",
    screenshotOptions,
  );

  const surfaceBounds = await liveSurface.boundingBox();
  expect(surfaceBounds).not.toBeNull();
  const contentBounds = await liveSurface.locator(".presentation-content").boundingBox();
  expect(contentBounds).not.toBeNull();
  expect(contentBounds!.x).toBeGreaterThanOrEqual(surfaceBounds!.x);
  expect(contentBounds!.y).toBeGreaterThanOrEqual(surfaceBounds!.y);
  expect(contentBounds!.x + contentBounds!.width).toBeLessThanOrEqual(
    surfaceBounds!.x + surfaceBounds!.width,
  );
  expect(contentBounds!.y + contentBounds!.height).toBeLessThanOrEqual(
    surfaceBounds!.y + surfaceBounds!.height,
  );
  await assertExportSurfaceHasNoLiveDivider(page);
});
