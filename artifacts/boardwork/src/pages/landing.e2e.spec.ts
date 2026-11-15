import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`expanded features show readable screenshots and open their full view at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const apiRequests: string[] = [];
    await page.route("**/api/**", route => {
      apiRequests.push(route.request().url());
      return route.abort();
    });
    await page.goto("/");
    for (const [label, filename] of [
      ["lesson routines", "lesson-routines"],
      ["participation tools", "participation"],
      ["saved teaching guidance", "teaching-context"],
    ]) {
      const trigger = page.getByRole("button", { name: `Enlarge ${label} screenshot`, exact: true });
      await trigger.scrollIntoViewIfNeeded();
      const image = trigger.getByRole("img");
      await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      const variant = width < 640 && filename !== "teaching-context" ? "-mobile" : "";
      await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.currentSrc)).toContain(`${filename}${variant}.png`);
      await trigger.click();
      await expect(page.getByRole("dialog").getByRole("img")).toHaveAttribute("src", new RegExp(`${filename}\\.png$`));
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(apiRequests).toEqual([]);
  });
}

test("opening the workspace loads the editable app", async ({ page }) => {
  await page.route("**/api/app-state", (route) =>
    route.fulfill({
      json: {
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
      },
    }),
  );
  await page.route("**/api/saved-context?*", (route) =>
    route.fulfill({ json: { items: [], categories: [] } }),
  );
  await page.route("**/api/auth/status", (route) =>
    route.fulfill({ json: { passwordRequired: false, authenticated: true } }),
  );
  await page.goto("/");
  await page
    .getByRole("link", { name: "Open your workspace", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(
    page.getByRole("heading", { name: "What are students working on today?" }),
  ).toBeVisible();
  await expect(page.getByTestId("button-blank")).toBeVisible();
});

test("the public product tour shows real UI captures without teacher data or AI requests", async ({
  page,
}) => {
  const apiRequests: string[] = [];
  await page.route("**/api/**", async (route) => {
    apiRequests.push(route.request().url());
    await route.abort();
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Less juggling. More teaching." }),
  ).toBeVisible();
  await expect(page.getByRole("tabpanel").getByRole("img")).toHaveAttribute(
    "src",
    /\/product\/workspace\.webp$/,
  );
  await page.getByRole("tab", { name: "Present", exact: true }).click();
  await expect(page.getByRole("tabpanel").getByRole("img")).toHaveAttribute(
    "src",
    /\/product\/present\.webp$/,
  );
  await expect(page.locator(".landing-demo-footer")).toContainText(
    "Give students a clear task, reasoning prompts, and time to work.",
  );
  const preview = page.getByRole("tabpanel").getByRole("button", {
    name: "Enlarge classroom view screenshot",
    exact: true,
  });
  await preview.click();
  await expect(page.getByRole("dialog")).toContainText(
    "Classroom view in Boardwork",
  );
  await expect(page.getByRole("dialog").getByRole("img")).toHaveAttribute(
    "src",
    /\/product\/present\.webp$/,
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(preview).toBeFocused();
  await page.getByRole("tab", { name: "Reuse", exact: true }).click();
  await expect(page.getByRole("tabpanel").getByRole("img")).toHaveAttribute(
    "src",
    /\/product\/history\.webp$/,
  );
  await page
    .getByRole("button", {
      name: "Can I make a board without AI?",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("An OpenAI key is only needed for AI features.", {
      exact: false,
    }),
  ).toBeVisible();
  expect(apiRequests).toEqual([]);
  await expect(
    page
      .getByRole("link", { name: "Open your workspace", exact: true })
      .first(),
  ).toHaveAttribute("href", "/app");
});

test("compact navigation supports Escape and anchor selection without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await expect
    .poll(() =>
      page
        .getByRole("tabpanel")
        .getByRole("img")
        .evaluate((image: HTMLImageElement) => image.currentSrc),
    )
    .toContain("workspace-mobile.webp");
  const trigger = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  await trigger.click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Questions", exact: true })
    .click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).not.toBeVisible();
  await expect(page).toHaveURL(/\/#questions$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("the product tour remains usable with reduced motion and keyboard tabs", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("tab", { name: "Prepare", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Present", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel").getByRole("img")).toHaveAttribute(
    "src",
    /\/product\/present\.webp$/,
  );
  expect(
    await page
      .locator(".landing-hero-art")
      .evaluate((el) => getComputedStyle(el).transform),
  ).toBe("none");
  expect(
    await page
      .locator("html")
      .evaluate((el) => getComputedStyle(el).scrollBehavior),
  ).toBe("auto");
});
