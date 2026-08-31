import { expect, test, type Locator, type Page } from "@playwright/test";

const APPROVED_HEADING = "What are students working on today?";
const APPROVED_SUPPORTING_COPY =
  "Add a topic or goal. You can refine the board before presenting.";

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
  activities: [],
};

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "narrow", width: 390, height: 844 },
] as const;

const requiredControls = [
  "select-unit",
  "input-topic",
  "input-goal",
  "button-generate",
  "button-surprise",
  "button-blank",
] as const;

async function expectElementReachableInViewport(
  page: Page,
  locator: Locator,
  viewport: (typeof viewports)[number],
) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();

  expect(box, `${await locator.getAttribute("data-testid")} should have geometry`).not.toBeNull();
  expect(box!.x, `${await locator.getAttribute("data-testid")} should start in the viewport`).toBeGreaterThanOrEqual(0);
  expect(box!.y, `${await locator.getAttribute("data-testid")} should start in the viewport`).toBeGreaterThanOrEqual(0);
  expect(
    box!.x + box!.width,
    `${await locator.getAttribute("data-testid")} should not extend past the viewport`,
  ).toBeLessThanOrEqual(viewport.width);
  expect(
    box!.y + box!.height,
    `${await locator.getAttribute("data-testid")} should be reachable after scrolling`,
  ).toBeLessThanOrEqual(viewport.height);
}

async function expectElementFitsHorizontally(
  page: Page,
  locator: Locator,
  viewport: (typeof viewports)[number],
) {
  const box = await locator.boundingBox();

  expect(box, `${await locator.getAttribute("data-testid")} should have geometry`).not.toBeNull();
  expect(box!.x, `${await locator.getAttribute("data-testid")} should start in the viewport`).toBeGreaterThanOrEqual(0);
  expect(
    box!.x + box!.width,
    `${await locator.getAttribute("data-testid")} should not extend past the viewport`,
  ).toBeLessThanOrEqual(viewport.width);
}

test.beforeEach(async ({ page }) => {
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
});

for (const viewport of viewports) {
  test(`keeps board creation readable and reachable at ${viewport.name} width`, async ({ page }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto("/");

    const workspace = page.getByTestId("creation-workspace");
    const controls = page.getByTestId("creation-controls");
    const actions = page.getByTestId("creation-actions");

    await expect(workspace).toBeVisible();
    await expect(controls.getByRole("heading", { name: APPROVED_HEADING, level: 1 })).toBeVisible();
    await expect(controls.getByText(APPROVED_SUPPORTING_COPY)).toBeVisible();

    for (const testId of requiredControls) {
      const locator = page.getByTestId(testId);
      await expect(locator).toBeVisible();
      await expectElementReachableInViewport(page, locator, viewport);
    }

    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth, "the document should not overflow horizontally").toBeLessThanOrEqual(
      viewport.width,
    );

    await expectElementFitsHorizontally(page, workspace, viewport);
    await expectElementReachableInViewport(page, actions, viewport);
  });
}

test("keeps creation examples very faint compared with entered text", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const topic = page.getByTestId("input-topic");
  const styles = await topic.evaluate((element) => {
    const placeholder = getComputedStyle(element, "::placeholder");
    const text = getComputedStyle(element);
    const parseRgb = (value: string) => {
      const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return channels.slice(0, 3);
    };
    const luminance = (value: string) => {
      const [red, green, blue] = parseRgb(value);
      return red * 0.2126 + green * 0.7152 + blue * 0.0722;
    };

    return {
      placeholderColor: placeholder.color,
      placeholderOpacity: placeholder.opacity,
      textColor: text.color,
      placeholderLuminance: luminance(placeholder.color),
      textLuminance: luminance(text.color),
    };
  });

  expect(styles.placeholderOpacity).toBe("1");
  expect(styles.placeholderColor).not.toBe(styles.textColor);
  expect(styles.placeholderLuminance).toBeGreaterThan(styles.textLuminance + 60);
});