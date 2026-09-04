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

const exportDurationActivity = {
  ...longMixedDirectionActivity,
  id: "activity-export-duration",
  eyebrow: "Export check",
  title: "Duration export check",
  task: "Read the prompt and respond.",
  prompts: ["Name one pattern you notice."],
  durationMinutes: 7,
};

const contentTallActivity = {
  ...longMixedDirectionActivity,
  id: "activity-content-tall",
  title: "Content-tall board",
  task:
    "Read the full set of observations before choosing the evidence that best supports your explanation. Keep the reasoning visible while you compare each part of the system.",
  prompts: Array.from(
    { length: 12 },
    (_, index) =>
      `Observation ${index + 1}: record the pattern, name the evidence that supports it, and explain how a partner could check the same conclusion without skipping any of the intermediate reasoning.`,
  ),
  materials: [
    "Observation notes",
    "Evidence comparison sheet",
    "Partner explanation checklist",
  ],
};

const portraitVisualUrl =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="360" height="1200" viewBox="0 0 360 1200">
      <rect width="360" height="1200" rx="24" fill="#fef3c7"/>
      <rect x="42" y="72" width="276" height="1056" rx="18" fill="#f59e0b"/>
      <circle cx="180" cy="330" r="92" fill="#1d4ed8"/>
      <path d="M92 760h176M92 840h176M92 920h120" stroke="#fff7ed" stroke-width="24" stroke-linecap="round"/>
    </svg>
  `);

const landscapeVisualUrl =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="260" viewBox="0 0 1600 260">
      <rect width="1600" height="260" rx="24" fill="#dcfce7"/>
      <path d="M72 190 C280 32 438 218 652 88 S1064 36 1528 176" fill="none" stroke="#15803d" stroke-width="28" stroke-linecap="round"/>
      <circle cx="360" cy="104" r="42" fill="#2563eb"/>
      <circle cx="1230" cy="122" r="54" fill="#ea580c"/>
    </svg>
  `);

const longVisualCaption =
  "A teacher-authored visual explanation that stays readable below the image while students compare the evidence, name the pattern, and connect each observation to the larger classroom idea without clipping at the edge of the rail.";

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

const surprisePresentActivity = {
  ...longMixedDirectionActivity,
  id: "activity-present-source",
  title: "Current live board",
  classId: "class-1",
  deviceMode: "on",
  technologyMode: "computer_available",
  durationMinutes: 12,
  resourceUrl: "https://example.com/source-reading",
  resourceNote: "Use the source reading for one comparison.",
  sourceTopic: "Forces in a changing system",
  sourceGoal: "Explain the strongest pattern with evidence",
  sourceUnitId: "unit-forces",
  sourceUnitName: "Forces and motion",
  sourceChipIds: ["chip-evidence"],
  presentationTheme: {
    kind: "curated" as const,
    themeId: "midnight" as const,
    accentId: "sage" as const,
  },
};

const surprisePresentAppState = {
  ...appState,
  activities: [surprisePresentActivity],
};

const contentTallAppState = {
  ...appState,
  activities: [contentTallActivity],
};

const extremeVisualActivities = {
  ...appState,
  activities: [
    {
      ...longMixedDirectionActivity,
      id: "activity-portrait-visual",
      title: "Portrait visual",
      task: "Study the tall visual.",
      prompts: ["Describe one detail you notice."],
      visualUrl: portraitVisualUrl,
      visualDescription: `A tall portrait classroom visual. ${longVisualCaption}`,
    },
    {
      ...longMixedDirectionActivity,
      id: "activity-landscape-visual",
      title: "Landscape visual",
      task: "Study the wide visual.",
      prompts: ["Describe one pattern you notice."],
      visualUrl: landscapeVisualUrl,
      visualDescription: `A wide landscape classroom visual. ${longVisualCaption}`,
    },
  ],
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
  await page.getByTestId("button-teacher-controls").click();
  await page.getByRole("button", { name: "Adjust" }).click();
  await page.getByRole("button", { name: "Hide timer from students" }).click();
  await expect(page.getByTestId("button-show-timer")).toBeVisible();
}

async function openTeacherControls(page: Page) {
  const toggle = page.getByTestId("button-teacher-controls");
  const panel = page.locator("#presentation-controls-panel");
  if (!(await panel.isVisible())) await toggle.click();
  await expect(panel).toBeVisible();
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

test("keeps the configured duration badge out of the downloaded student PNG", async ({
  page,
}) => {
  const assertBrowserHealth = await reportBrowserHealth(page);
  await stubPresentationState(page, {
    ...appState,
    activities: [exportDurationActivity],
  });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/present/activity-export-duration");
  await expect(page.getByTestId("present-title")).toHaveText("Duration export check");
  await openTeacherControls(page);
  await expect(
    page.locator(".presentation-surface--export").getByText("7 MIN"),
  ).toHaveCount(0);

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("button-export-png").click();
  const download = await downloadPromise;
  const png = decodePng(await readFile(await download.path()!));

  expect({ width: png.width, height: png.height }).toEqual({
    width: 1920,
    height: 1080,
  });
  expect(
    countVisiblePixels(png, {
      name: "duration badge header area",
      x: 1450,
      y: 54,
      width: 334,
      height: 150,
    }),
    "the downloaded PNG should not contain the configured 7 MIN badge",
  ).toBe(0);

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
  await openTeacherControls(page);

  const splitGeometry = await page.locator(".presentation-timer").evaluate((timer) => {
    const reading = timer.querySelector<HTMLElement>(".presentation-timer-reading");
    const progress = timer.querySelector<HTMLElement>(".presentation-timer-progress");
    if (!reading || !progress) throw new Error("Missing large timer row");

    const timerBounds = timer.getBoundingClientRect();
    const readingBounds = reading.getBoundingClientRect();
    const progressBounds = progress.getBoundingClientRect();
    return {
      timerWidth: timerBounds.width,
      readingWidth: readingBounds.width,
      readingRight: readingBounds.right,
      timerRight: timerBounds.right,
      progressWidth: progressBounds.width,
      whiteSpace: getComputedStyle(reading).whiteSpace,
    };
  });

  expect(splitGeometry.readingWidth).toBeLessThan(splitGeometry.timerWidth);
  expect(splitGeometry.readingRight).toBeLessThanOrEqual(splitGeometry.timerRight);
  expect(splitGeometry.progressWidth).toBeGreaterThan(splitGeometry.timerWidth * 0.8);
  expect(splitGeometry.whiteSpace).toBe("nowrap");
  await expect(page.locator(".presentation-timer").locator(".presentation-timer-controls")).toHaveCount(0);
  await expect(page.locator("#presentation-controls-panel .presentation-timer-controls")).toBeVisible();

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
    await openTeacherControls(page);
    await openTeacherControls(page);

    const timerOnlyReading = page.locator(".presentation-timer-reading");
    const timerProgress = page.getByRole("progressbar", { name: "Time remaining" });
    const timerControls = page.locator("#presentation-controls-panel .presentation-timer-controls");
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
      return {
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        timerWidth: timerBounds?.width ?? 0,
        readingWidth: readingBounds.width,
        readingRight: readingBounds.right,
        timerRight: timerBounds?.right ?? 0,
        progressWidth: progressBounds?.width ?? 0,
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
    await expect(timerControls).toBeVisible();
    expect(
      await timerControls.evaluate((controls) => controls.closest(".presentation-timer") === null),
    ).toBe(true);

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
    await openTeacherControls(page);

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

    const initialProgress = Number(await timerProgress.getAttribute("aria-valuenow"));
    await timerToggle.click();
    await expect(page.locator("#presentation-timer-controls-panel")).toBeVisible();
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
    await expect(teacherPanel.locator(".presentation-timer-controls")).toHaveCount(0);

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
  await openTeacherControls(page);
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

test("restores hidden timer actions through the compact clock without duplicating them in docks", async ({
  page,
}) => {
  const assertBrowserHealth = await reportBrowserHealth(page);
  await stubPresentationState(page, appState);
  await page.setViewportSize({ width: 640, height: 400 });
  await page.goto("/present/activity-long-mixed-direction");
  await settlePresentationSurface(page);

  await openTeacherControls(page);
  await page.getByRole("button", { name: "Minimize timer" }).click();

  const timerToggle = page.getByTestId("button-toggle-timer-controls");
  const compactTimer = page.getByTestId("compact-timer-progress");
  const compactTimerPanel = page.locator("#presentation-timer-controls-panel");
  const teacherPanel = page.locator("#presentation-controls-panel");
  await expect(timerToggle).toBeVisible();
  await timerToggle.click();
  await expect(compactTimerPanel).toBeVisible();
  await page.getByRole("button", { name: "Adjust" }).click();
  await page.getByRole("button", { name: "Hide timer from students" }).click();

  const showTimer = page.getByTestId("button-show-timer");
  await expect(showTimer).toBeVisible();
  await expect(compactTimer).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Show timer controls" })).toHaveCount(0);

  const recoveryBounds = await showTimer.boundingBox();
  expect(recoveryBounds).not.toBeNull();
  expect(recoveryBounds!.x).toBeGreaterThanOrEqual(0);
  expect(recoveryBounds!.y).toBeGreaterThanOrEqual(0);
  expect(recoveryBounds!.x + recoveryBounds!.width).toBeLessThanOrEqual(640);
  expect(recoveryBounds!.y + recoveryBounds!.height).toBeLessThanOrEqual(400);

  await showTimer.focus();
  await showTimer.press("Enter");
  await expect(showTimer).toHaveCount(0);
  await expect(compactTimer).toBeVisible();
  await expect(compactTimer.locator(".presentation-time-reading")).toHaveText("7:00");

  await page.getByTestId("button-teacher-controls").click();
  await page.mouse.move(10, 10);
  await expect(teacherPanel).toBeHidden();
  await expect(teacherPanel.locator(".presentation-timer-controls")).toHaveCount(0);
  await expect(
    page.locator(".presentation-export-stage .presentation-time"),
  ).toHaveCount(0);
  await expect(
    page.locator(".presentation-export-stage .presentation-timer"),
  ).toHaveCount(0);

  await timerToggle.focus();
  await timerToggle.press("Enter");
  await expect(compactTimerPanel).toBeVisible();
  await expect(
    compactTimerPanel.getByRole("button", { name: "Start or resume timer" }),
  ).toBeVisible();
  await expect(
    page.locator(".presentation-controls-dock .presentation-timer-controls"),
  ).toHaveCount(0);

  const panelBounds = await compactTimerPanel.boundingBox();
  expect(panelBounds).not.toBeNull();
  expect(panelBounds!.x).toBeGreaterThanOrEqual(0);
  expect(panelBounds!.y).toBeGreaterThanOrEqual(0);
  expect(panelBounds!.x + panelBounds!.width).toBeLessThanOrEqual(640);
  expect(panelBounds!.y + panelBounds!.height).toBeLessThanOrEqual(400);

  await page.getByRole("button", { name: "Start or resume timer" }).focus();
  await page.keyboard.press("Escape");
  await expect(compactTimerPanel).toBeHidden();
  await expect(timerToggle).toBeFocused();
  await expect(timerToggle).toBeInViewport();

  assertBrowserHealth();
});

test("keeps hidden timer recovery reachable below a tall Present board", async ({
  page,
}) => {
  const assertBrowserHealth = await reportBrowserHealth(page);
  await stubPresentationState(page, contentTallAppState);
  await page.setViewportSize({ width: 640, height: 400 });
  await page.goto("/present/activity-content-tall");
  await settlePresentationSurface(page);

  const teacherToggle = page.getByTestId("button-teacher-controls");
  const teacherPanel = page.locator("#presentation-controls-panel");
  const initialMetrics = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
    scrollY: window.scrollY,
  }));
  expect(initialMetrics.scrollHeight).toBeGreaterThan(initialMetrics.viewportHeight);
  expect(initialMetrics.scrollY).toBe(0);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await expect(teacherToggle).toBeInViewport();
  await teacherToggle.click();
  await expect(teacherPanel).toBeVisible();

  await page.getByRole("button", { name: "Adjust" }).click();
  await page.getByRole("button", { name: "Hide timer from students" }).click();

  const showTimer = page.getByTestId("button-show-timer");
  await expect(showTimer).toBeVisible();
  await expect(showTimer).not.toBeInViewport();

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(showTimer).toBeInViewport();
  await showTimer.focus();
  await expect(showTimer).toBeFocused();
  await showTimer.press("Enter");

  const compactTimer = page.getByTestId("compact-timer-progress");
  const timerToggle = page.getByTestId("button-toggle-timer-controls");
  const compactTimerPanel = page.locator("#presentation-timer-controls-panel");
  await expect(showTimer).toHaveCount(0);
  await expect(compactTimer).toBeVisible();
  await expect(compactTimer.locator(".presentation-time-reading")).toHaveText("7:00");

  await expect(
    page.locator(".presentation-controls-dock .presentation-timer-controls"),
  ).toHaveCount(0);
  await expect(
    page.locator(".presentation-export-stage .presentation-time"),
  ).toHaveCount(0);
  await expect(
    page.locator(".presentation-export-stage .presentation-timer"),
  ).toHaveCount(0);

  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await timerToggle.scrollIntoViewIfNeeded();
  await expect(timerToggle).toBeInViewport();
  await timerToggle.focus();
  await timerToggle.press("Enter");
  await expect(compactTimerPanel).toBeVisible();
  await expect(
    compactTimerPanel.getByRole("button", { name: "Start or resume timer" }),
  ).toBeVisible();

  const panelBounds = await compactTimerPanel.boundingBox();
  const pageMetrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  }));
  expect(panelBounds).not.toBeNull();
  expect(panelBounds!.x).toBeGreaterThanOrEqual(0);
  expect(panelBounds!.y).toBeGreaterThanOrEqual(0);
  expect(panelBounds!.x + panelBounds!.width).toBeLessThanOrEqual(
    pageMetrics.viewportWidth,
  );
  expect(panelBounds!.y + panelBounds!.height).toBeLessThanOrEqual(
    pageMetrics.viewportHeight,
  );
  expect(pageMetrics.documentWidth).toBeLessThanOrEqual(pageMetrics.viewportWidth);

  await page.getByRole("button", { name: "Start or resume timer" }).focus();
  await page.keyboard.press("Escape");
  await expect(compactTimerPanel).toBeHidden();
  await expect(timerToggle).toBeFocused();

  assertBrowserHealth();
});

test("keeps Present controls tappable in a short landscape tablet viewport", async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
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

    await openTeacherControls(page);
    await page.getByRole("button", { name: "Minimize timer" }).tap();
  const timerToggle = page.getByTestId("button-toggle-timer-controls");
    await expect(timerToggle).toBeVisible();
    await timerToggle.tap();

    const timerPanel = page.locator("#presentation-timer-controls-panel");
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
  const teacherPanel = page.locator("#presentation-controls-panel");
    await expect(teacherPanel).toBeVisible();
    await expect(teacherPanel.locator(".presentation-timer-controls")).toHaveCount(0);

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

test("lets teachers replace a live board with a context-matched Surprise me result", async ({
  page,
}) => {
  await stubPresentationState(page, surprisePresentAppState);
  await page.setViewportSize({ width: 390, height: 844 });

  const generatedActivity = {
    ...surprisePresentActivity,
    id: "activity-present-surprise",
    title: "Fresh surprise board",
    task: "Compare the evidence and explain the new pattern.",
  };
  let requestPayload: Record<string, unknown> | undefined;
  let releaseGeneration!: () => void;
  const generationReleased = new Promise<void>((resolve) => {
    releaseGeneration = resolve;
  });

  await page.route("**/api/generate", async (route) => {
    requestPayload = route.request().postDataJSON() as Record<string, unknown>;
    await generationReleased;
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(generatedActivity),
    });
  });

  await page.goto("/present/activity-present-source");
  await expect(page.getByTestId("present-title")).toHaveText("Current live board");
  await openTeacherControls(page);

  const surpriseButton = page.getByTestId("button-present-surprise");
  await expect(surpriseButton).toBeVisible();
  const surpriseBounds = await surpriseButton.boundingBox();
  expect(surpriseBounds).not.toBeNull();
  expect(surpriseBounds!.x).toBeGreaterThanOrEqual(0);
  expect(surpriseBounds!.x + surpriseBounds!.width).toBeLessThanOrEqual(390);
  await expect(
    page.locator(".presentation-surface--export").getByTestId("button-present-surprise"),
  ).toHaveCount(0);

  await surpriseButton.focus();
  await page.keyboard.press("Enter");
  await expect(surpriseButton).toBeDisabled();
  await expect(surpriseButton).toContainText("Generating");
  await expect(page.getByTestId("present-title")).toHaveText("Current live board");

  await surpriseButton.click({ force: true });
  await expect.poll(() => requestPayload).toBeTruthy();
  releaseGeneration();

  await expect(page).toHaveURL(/\/present\/activity-present-surprise$/);
  await expect(page.getByTestId("present-title")).toHaveText("Fresh surprise board");
  expect(requestPayload).toMatchObject({
    classId: "class-1",
    unitId: "unit-forces",
    topic: "Forces in a changing system",
    goal: "Explain the strongest pattern with evidence",
    chipIds: ["chip-evidence"],
    deviceMode: "on",
    technologyMode: "computer_available",
    durationMinutes: 12,
    activityStyle: null,
    presentationTheme: {
      kind: "curated",
      themeId: "midnight",
      accentId: "sage",
    },
    teacherProvidedUrl: "https://example.com/source-reading",
    teacherProvidedResourceNote: "Use the source reading for one comparison.",
    surprise: true,
  });
});

test("keeps the live board and offers a retry after Present Surprise me fails", async ({
  page,
}) => {
  await stubPresentationState(page, surprisePresentAppState);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/generate", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "The generator is temporarily unavailable." }),
    });
  });

  await page.goto("/present/activity-present-source");
  await openTeacherControls(page);
  const surpriseButton = page.getByTestId("button-present-surprise");
  await surpriseButton.click();

  await expect(page.getByTestId("present-generation-error")).toContainText(
    "The generator is temporarily unavailable.",
  );
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  await expect(page.getByTestId("present-title")).toHaveText("Current live board");
  await expect(page).toHaveURL(/\/present\/activity-present-source$/);

  const errorBounds = await page.getByTestId("present-generation-error").boundingBox();
  expect(errorBounds).not.toBeNull();
  expect(errorBounds!.x).toBeGreaterThanOrEqual(0);
  expect(errorBounds!.x + errorBounds!.width).toBeLessThanOrEqual(390);
  expect(errorBounds!.y + errorBounds!.height).toBeLessThanOrEqual(844);
});

test("returns focus to the compact timer trigger after teacher controls close", async ({
  page,
}) => {
  await stubPresentationState(page, appState);
  await page.setViewportSize({ width: 640, height: 400 });
  await page.goto("/present/activity-long-mixed-direction");
  await settlePresentationSurface(page);

  await openTeacherControls(page);
  await page.getByRole("button", { name: "Minimize timer" }).click();
  await page.getByTestId("button-teacher-controls").click();
  await page.mouse.move(10, 10);

  const timerToggle = page.getByTestId("button-toggle-timer-controls");
  const timerPanel = page.locator("#presentation-timer-controls-panel");
  await expect(timerToggle).toBeVisible();
  await expect(timerPanel).toBeHidden();
  await timerToggle.focus();

  await timerToggle.press("Enter");
  await expect(timerPanel).toBeVisible();
  await expect(timerToggle).toHaveAttribute("aria-expanded", "true");

  const openGeometry = await page.evaluate(() => {
    const panelBounds = document.querySelector("#presentation-timer-controls-panel")!.getBoundingClientRect();
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      panelLeft: panelBounds.left,
      panelRight: panelBounds.right,
      panelBottom: panelBounds.bottom,
      viewportHeight: window.innerHeight,
    };
  });
  expect(openGeometry.documentWidth).toBeLessThanOrEqual(openGeometry.viewportWidth);
  expect(openGeometry.panelLeft).toBeGreaterThanOrEqual(0);
  expect(openGeometry.panelRight).toBeLessThanOrEqual(openGeometry.viewportWidth);
  expect(openGeometry.panelBottom).toBeLessThanOrEqual(openGeometry.viewportHeight);

  await timerToggle.press("Enter");
  await expect(timerPanel).toBeHidden();
  await expect(timerToggle).toBeFocused();
  await expect(timerToggle).toBeInViewport();

  await timerToggle.press("Enter");
  await expect(timerPanel).toBeVisible();
  await page.getByRole("button", { name: "Start or resume timer" }).focus();
  await page.keyboard.press("Escape");
  await expect(timerPanel).toBeHidden();
  await expect(timerToggle).toBeFocused();
  await expect(timerToggle).toBeInViewport();
});

test("keeps teacher controls reachable below content-tall Present boards", async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();

  try {
    await stubPresentationState(page, contentTallAppState);

    for (const viewport of [
      { width: 854, height: 534, label: "150% zoom equivalent" },
      { width: 640, height: 400, label: "200% zoom equivalent" },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/present/activity-content-tall");
      await settlePresentationSurface(page);

  const teacherToggle = page.getByTestId("button-teacher-controls");
  const teacherPanel = page.locator("#presentation-controls-panel");
      const studentRegion = page.locator(".presentation-main");
      const dock = page.locator(".presentation-controls-dock");

      const initialMetrics = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        scrollY: window.scrollY,
      }));
      expect(
        initialMetrics.scrollHeight,
        `${viewport.label} should create a scrollable board`,
      ).toBeGreaterThan(initialMetrics.viewportHeight);
      expect(initialMetrics.scrollY).toBe(0);

      await page.mouse.move(viewport.width / 2, viewport.height / 2);
      await page.mouse.wheel(0, viewport.height);
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeGreaterThan(0);

      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect(teacherToggle).toBeInViewport();

      await teacherToggle.tap();
      await expect(teacherPanel).toBeVisible();
      await expect(teacherToggle).toBeInViewport();

      const openGeometry = await page.evaluate(() => {
        const studentBounds = document.querySelector(".presentation-main")!.getBoundingClientRect();
        const panelBounds = document.querySelector("#presentation-controls-panel")!.getBoundingClientRect();
        const dockBounds = document.querySelector(".presentation-controls-dock")!.getBoundingClientRect();
        return {
          studentBottom: studentBounds.bottom,
          panelTop: panelBounds.top,
          dockBottom: dockBounds.bottom,
          viewportHeight: window.innerHeight,
        };
      });
      expect(
        openGeometry.panelTop,
        `${viewport.label} teacher panel should stay below student content`,
      ).toBeGreaterThanOrEqual(openGeometry.studentBottom);
      expect(
        openGeometry.dockBottom,
        `${viewport.label} opened teacher dock should remain reachable`,
      ).toBeLessThanOrEqual(openGeometry.viewportHeight);

      await teacherToggle.tap();
      await expect(teacherPanel).toBeHidden();
      await expect(teacherToggle).toBeFocused();

      await page.evaluate(() => {
        window.scrollTo(0, 0);
        document.body.tabIndex = 0;
        document.body.focus();
      });
      let teacherToggleReached = false;
      for (let tabCount = 0; tabCount < 8; tabCount += 1) {
        await page.keyboard.press("Tab");
        if (
          await teacherToggle.evaluate(
            (element) => element === document.activeElement,
          )
        ) {
          teacherToggleReached = true;
          break;
        }
      }
      expect(teacherToggleReached).toBe(true);
      expect(
        await page.evaluate(() => window.scrollY),
        `${viewport.label} keyboard focus should scroll to the dock`,
      ).toBeGreaterThan(0);

      await page.keyboard.press("Enter");
      await expect(teacherPanel).toBeVisible();
      await page.keyboard.press("Tab");
      expect(
        await page.evaluate(
          () => document.activeElement?.closest("#presentation-controls-panel") !== null,
        ),
      ).toBe(true);
      await page.keyboard.press("Escape");
      await expect(teacherPanel).toBeHidden();
      await expect(teacherToggle).toBeFocused();

      const closedGeometry = await dock.boundingBox();
      expect(closedGeometry).not.toBeNull();
      expect(closedGeometry!.x).toBeGreaterThanOrEqual(0);
      expect(closedGeometry!.x + closedGeometry!.width).toBeLessThanOrEqual(viewport.width);
    }
  } finally {
    await context.close();
  }
});

test("keeps hover-open teacher controls reachable below content-tall boards", async ({
  page,
}) => {
  await stubPresentationState(page, contentTallAppState);
  await page.setViewportSize({ width: 640, height: 400 });
  await page.goto("/present/activity-content-tall");
  await settlePresentationSurface(page);

  const teacherToggle = page.getByTestId("button-teacher-controls");
  const teacherPanel = page.locator("#presentation-controls-panel");

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(teacherToggle).toBeInViewport();
  await teacherToggle.hover();
  await expect(teacherPanel).toBeVisible();
  await expect(page.getByTestId("button-export-png")).toBeVisible();

  const geometry = await page.evaluate(() => {
    const studentBounds = document.querySelector(".presentation-main")!.getBoundingClientRect();
    const panelBounds = document.querySelector("#presentation-controls-panel")!.getBoundingClientRect();
    const dockBounds = document.querySelector(".presentation-controls-dock")!.getBoundingClientRect();
    return {
      studentBottom: studentBounds.bottom,
      panelTop: panelBounds.top,
      dockBottom: dockBounds.bottom,
      viewportHeight: window.innerHeight,
    };
  });
  expect(geometry.panelTop).toBeGreaterThanOrEqual(geometry.studentBottom);
  expect(geometry.dockBottom).toBeLessThanOrEqual(geometry.viewportHeight + 1);
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
  const widePromptTracks = await liveSurface.locator(".presentation-prompts").evaluate(
    (prompts) => getComputedStyle(prompts).gridTemplateColumns.trim().split(/\s+/),
  );
  expect(widePromptTracks).toHaveLength(1);
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
  const narrowPromptTracks = await liveSurface.locator(".presentation-prompts").evaluate(
    (prompts) => getComputedStyle(prompts).gridTemplateColumns.trim().split(/\s+/),
  );
  expect(narrowPromptTracks).toHaveLength(1);
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

test("contains extreme portrait and landscape visuals across Present modes", async ({
  page,
}) => {
  const assertBrowserHealth = await reportBrowserHealth(page);
  await stubPresentationState(page, extremeVisualActivities);

  const viewports = [
    { width: 1920, height: 1080, label: "wide classroom" },
    { width: 640, height: 800, label: "narrow classroom" },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const liveSurface = page.getByTestId("presentation-surface");

    await page.goto("/present/activity-portrait-visual");
    await settlePresentationSurface(page);
    await hideTimerFromStudents(page);
    await expect(liveSurface.locator(".presentation-rail--image-only")).toBeVisible();
    await expect(
      liveSurface.getByRole("img", {
        name: `A tall portrait classroom visual. ${longVisualCaption}`,
      }),
    ).toBeVisible();
    await expect(
      liveSurface.getByText(`A tall portrait classroom visual. ${longVisualCaption}`),
    ).toBeVisible();

    const portraitGeometry = await liveSurface.locator(".presentation-rail--image-only").evaluate((rail) => {
      const image = rail.querySelector<HTMLImageElement>(".presentation-visual img");
      const caption = rail.querySelector<HTMLElement>(".presentation-visual figcaption");
      if (!image || !caption) throw new Error("Missing portrait visual framing");
      const railBounds = rail.getBoundingClientRect();
      const imageBounds = image.getBoundingClientRect();
      const captionBounds = caption.getBoundingClientRect();
      return {
        rail: railBounds.toJSON(),
        image: imageBounds.toJSON(),
        caption: captionBounds.toJSON(),
      };
    });

    expect(portraitGeometry.image.width).toBeGreaterThan(0);
    expect(portraitGeometry.image.height).toBeGreaterThan(portraitGeometry.image.width);
    expect(portraitGeometry.image.x).toBeGreaterThanOrEqual(portraitGeometry.rail.x);
    expect(portraitGeometry.image.x + portraitGeometry.image.width).toBeLessThanOrEqual(
      portraitGeometry.rail.x + portraitGeometry.rail.width,
    );
    expect(portraitGeometry.image.x + portraitGeometry.image.width / 2).toBeCloseTo(
      portraitGeometry.rail.x + portraitGeometry.rail.width / 2,
      0,
    );
    expect(portraitGeometry.caption.width).toBeGreaterThan(0);
    expect(portraitGeometry.caption.y).toBeGreaterThanOrEqual(
      portraitGeometry.image.y + portraitGeometry.image.height,
    );
    expect(portraitGeometry.caption.x).toBeGreaterThanOrEqual(portraitGeometry.rail.x);
    expect(portraitGeometry.caption.x + portraitGeometry.caption.width).toBeLessThanOrEqual(
      portraitGeometry.rail.x + portraitGeometry.rail.width,
    );
    expect(portraitGeometry.caption.y + portraitGeometry.caption.height).toBeLessThanOrEqual(
      portraitGeometry.rail.y + portraitGeometry.rail.height,
    );

    await page.goto("/present/activity-landscape-visual");
    await settlePresentationSurface(page);
    await expect(liveSurface.locator(".presentation-rail--split")).toBeVisible();
    await expect(
      liveSurface.getByRole("img", {
        name: `A wide landscape classroom visual. ${longVisualCaption}`,
      }),
    ).toBeVisible();
    await expect(
      liveSurface.getByText(`A wide landscape classroom visual. ${longVisualCaption}`),
    ).toBeVisible();
    await expect(liveSurface.getByText("Time remaining")).toBeVisible();

    const landscapeGeometry = await liveSurface.locator(".presentation-rail--split").evaluate((rail) => {
      const image = rail.querySelector<HTMLImageElement>(".presentation-visual img");
      const caption = rail.querySelector<HTMLElement>(".presentation-visual figcaption");
      const timer = rail.querySelector<HTMLElement>(".presentation-timer");
      if (!image || !caption || !timer) throw new Error("Missing landscape split framing");
      const railBounds = rail.getBoundingClientRect();
      const imageBounds = image.getBoundingClientRect();
      const captionBounds = caption.getBoundingClientRect();
      const timerBounds = timer.getBoundingClientRect();
      return {
        rail: railBounds.toJSON(),
        image: imageBounds.toJSON(),
        caption: captionBounds.toJSON(),
        timer: timerBounds.toJSON(),
      };
    });

    expect(landscapeGeometry.image.width).toBeGreaterThan(landscapeGeometry.image.height);
    expect(landscapeGeometry.image.x).toBeGreaterThanOrEqual(landscapeGeometry.rail.x);
    expect(landscapeGeometry.image.x + landscapeGeometry.image.width).toBeLessThanOrEqual(
      landscapeGeometry.rail.x + landscapeGeometry.rail.width,
    );
    expect(landscapeGeometry.caption.width).toBeGreaterThan(0);
    expect(landscapeGeometry.caption.y).toBeGreaterThanOrEqual(
      landscapeGeometry.image.y + landscapeGeometry.image.height,
    );
    expect(landscapeGeometry.caption.x).toBeGreaterThanOrEqual(landscapeGeometry.rail.x);
    expect(
      landscapeGeometry.caption.x + landscapeGeometry.caption.width,
    ).toBeLessThanOrEqual(landscapeGeometry.rail.x + landscapeGeometry.rail.width);
    expect(
      landscapeGeometry.caption.y + landscapeGeometry.caption.height,
    ).toBeLessThanOrEqual(landscapeGeometry.rail.y + landscapeGeometry.rail.height);
    expect(landscapeGeometry.timer.width).toBeGreaterThan(0);
    expect(landscapeGeometry.timer.x + landscapeGeometry.timer.width).toBeLessThanOrEqual(
      landscapeGeometry.rail.x + landscapeGeometry.rail.width,
    );

    const exportGeometry = await page.locator(".presentation-surface--export").evaluate((surface) => {
      const image = surface.querySelector<HTMLImageElement>(".presentation-visual img");
      const caption = surface.querySelector<HTMLElement>(".presentation-visual figcaption");
      if (!image || !caption) throw new Error("Missing export visual framing");
      const surfaceBounds = surface.getBoundingClientRect();
      const imageBounds = image.getBoundingClientRect();
      const captionBounds = caption.getBoundingClientRect();
      return {
        surface: surfaceBounds.toJSON(),
        image: imageBounds.toJSON(),
        caption: captionBounds.toJSON(),
      };
    });

    expect(exportGeometry.surface.width).toBe(1920);
    expect(exportGeometry.surface.height).toBe(1080);
    expect(exportGeometry.image.x).toBeGreaterThan(exportGeometry.surface.x);
    expect(exportGeometry.image.y).toBeGreaterThan(exportGeometry.surface.y);
    expect(exportGeometry.image.x + exportGeometry.image.width).toBeLessThan(
      exportGeometry.surface.x + exportGeometry.surface.width,
    );
    expect(exportGeometry.image.y + exportGeometry.image.height).toBeLessThan(
      exportGeometry.surface.y + exportGeometry.surface.height,
    );
    expect(exportGeometry.caption.width).toBeGreaterThan(0);
    expect(exportGeometry.caption.y).toBeGreaterThanOrEqual(
      exportGeometry.image.y + exportGeometry.image.height,
    );
    expect(exportGeometry.caption.x).toBeGreaterThanOrEqual(exportGeometry.surface.x);
    expect(exportGeometry.caption.x + exportGeometry.caption.width).toBeLessThanOrEqual(
      exportGeometry.surface.x + exportGeometry.surface.width,
    );
    expect(exportGeometry.caption.y + exportGeometry.caption.height).toBeLessThanOrEqual(
      exportGeometry.surface.y + exportGeometry.surface.height,
    );
  }

  assertBrowserHealth();
});
