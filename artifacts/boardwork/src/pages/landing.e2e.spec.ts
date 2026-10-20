import { expect, test } from "@playwright/test";

test("the public landing and example boards do not load teacher data or call AI", async ({
  page,
}) => {
  const apiRequests: string[] = [];
  await page.route("**/api/**", async (route) => {
    apiRequests.push(route.request().url());
    await route.abort();
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Make the first minutes matter." }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Design", exact: true }).click();
  await expect(
    page.getByRole("tabpanel").getByText("One toy. Two possibilities."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Preview board", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "One toy. Two possibilities.",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Preview board", exact: true }),
  ).toBeFocused();
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

test("the example remains usable with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("tab", { name: "Language", exact: true }).click();
  await expect(
    page.getByRole("tabpanel").getByText("Same scene. A different story."),
  ).toBeVisible();
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
