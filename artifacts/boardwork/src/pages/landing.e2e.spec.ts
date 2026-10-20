import { expect, test } from "@playwright/test";

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
    page.getByRole("heading", { name: "Make the first minutes matter." }),
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
