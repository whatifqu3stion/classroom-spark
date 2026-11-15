import { expect, test } from "@playwright/test";
import { installReadingCapacityFixture } from "../test/fixtures/reading-capacity-fixture";

test("mobile saved boards expose editing and presentation before setup", async ({ page }) => {
  const { activityId } = await installReadingCapacityFixture(page, false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/activity/${activityId}`);
  const editor = page.getByTestId("editor-workspace-panel");
  await expect(editor).toBeVisible();
  expect((await editor.boundingBox())!.y).toBeLessThan(200);
  await expect(page.getByTestId("creation-controls")).toBeHidden();
  for (const name of ["Homebase", "Workspace", "History"]) {
    await expect(page.getByRole("navigation").getByRole("link", { name, exact: true })).toHaveText(name);
  }
  await page.getByRole("link", { name: "Create another board" }).click();
  await expect(page.getByTestId("creation-controls")).toBeVisible();
});

test("curriculum sources and objective fields work with keyboard and accessible names", async ({ page }) => {
  await installReadingCapacityFixture(page, false);
  const source = {
    id: "keyboard-source", title: "Water movement", kind: "text", status: "draft", version: 1,
    summary: "Diffusion and osmosis", subject: "Science", unitId: null,
    objectives: [{ id: "osmosis", label: "Explain osmosis", selected: true, excerpt: "Water crosses a membrane." }],
  };
  await page.route("**/api/**/curriculum**", (route) => route.fulfill({
    json: new URL(route.request().url()).pathname.endsWith(source.id) ? source : { ready: true, items: [source] },
  }));
  await page.goto("/app");
  await page.getByRole("button", { name: "Edit class settings" }).click();
  const openSource = page.getByTestId(`curriculum-source-${source.id}`);
  await expect(openSource).toHaveRole("button");
  await openSource.focus();
  await page.keyboard.press("Enter");
  const objective = page.getByRole("textbox", { name: "Objective 1 wording" });
  await expect(objective).toHaveValue("Explain osmosis");
  const checkbox = page.getByRole("checkbox", { name: "Use objective 1: Explain osmosis" });
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
  await objective.fill("Describe osmosis");
  await expect(page.getByRole("checkbox", { name: "Use objective 1: Describe osmosis" })).toBeVisible();
});

test("slow initial loading remains understandable without motion", async ({ page }) => {
  await installReadingCapacityFixture(page, false);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/app-state", async (route) => {
    await pending;
    await route.fallback();
  });
  await page.goto("/app");
  const status = page.getByRole("status").filter({ hasText: "Loading your classes and boards" });
  await expect(status).toBeVisible();
  await expect(status.locator("svg")).toHaveCSS("animation-name", "none");
  release();
  await expect(page.getByTestId("creation-controls")).toBeVisible();
});
