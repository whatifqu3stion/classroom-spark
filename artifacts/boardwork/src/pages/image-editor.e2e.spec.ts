import { expect, test } from "@playwright/test";
import type { ActivityDraft } from "@/store/boardwork-context";

const svgFile = (name: string, width: number, height: number) => ({
  name,
  mimeType: "image/svg+xml",
  buffer: Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#b3c7b3"/><circle cx="${width / 2}" cy="${height / 2}" r="20" fill="#34495e"/></svg>`,
  ),
});

for (const width of [1280, 390, 287]) {
  for (const dark of [false, true]) {
    test(`simultaneous image previews stay responsive at ${width}px ${dark ? "dark" : "light"}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      let saved: ActivityDraft = {
        id: "image-board",
        classId: "image-class",
        title: "",
        task: "Compare the two diagrams.",
        durationMinutes: 5,
        deviceMode: "off",
        prompts: [],
        visuals: [],
      };
      await page.route("**/api/**", async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (route.request().method() === "PATCH" && path.endsWith("/activities/image-board")) {
          saved = { ...saved, ...route.request().postDataJSON() };
          return route.fulfill({ json: saved });
        }
        if (!["GET", "HEAD"].includes(route.request().method())) return route.abort();
        return route.fulfill({
          json: path.endsWith("/app-state")
            ? {
                activeClassId: "image-class",
                classes: [
                  {
                    id: "image-class",
                    name: "Science",
                    subject: "Science",
                    defaultDuration: 5,
                    defaultDeviceMode: "off",
                    arrivalRoutine: null,
                  },
                ],
                activities: [saved],
                units: [],
                instructionalContexts: [],
                chips: [],
              }
            : path.endsWith("/auth/status")
              ? { authenticated: true, authEnabled: false }
              : { items: [], categories: [] },
        });
      });

      await page.goto("/activity/image-board");
      await page.evaluate((value) => document.documentElement.classList.toggle("dark", value), dark);
      const toggle = page.getByTestId("button-toggle-presentation-visual");
      await toggle.click();
      const area = page.getByTestId("image-workspace");
      await area.scrollIntoViewIfNeeded();

      await expect(area.getByTestId("visual-preview")).toHaveCount(0);
      await expect(page.getByLabel("Add image", { exact: true })).toBeEnabled();
      await expect(area.locator('[data-testid^="image-selector-"]')).toHaveCount(0);
      await expect(area.getByText("Added", { exact: true })).toHaveCount(0);
      await expect(area.getByText("Empty", { exact: true })).toHaveCount(0);

      await page.getByLabel("Add image", { exact: true }).setInputFiles(svgFile("wide.svg", 400, 100));
      await expect(area.getByTestId("visual-preview")).toHaveCount(1);
      await expect(area.getByRole("img", { name: "Image 1 preview" })).toHaveCSS("object-fit", "contain");
      await page.getByLabel("Visual description 1", { exact: true }).fill("Wide diagram");
      await expect(page.getByLabel("Add image", { exact: true })).toBeEnabled();

      await page.getByLabel("Add image", { exact: true }).setInputFiles(svgFile("tall.svg", 100, 400));
      await expect(area.getByTestId("visual-preview")).toHaveCount(2);
      const secondPreview = area.getByRole("img", { name: "Image 2 preview" });
      await expect(secondPreview).toHaveCSS("object-fit", "contain");
      const tallUrl = await secondPreview.getAttribute("src");
      await expect(page.getByLabel("Visual description 2", { exact: true })).toBeFocused();
      await page.getByLabel("Visual description 2", { exact: true }).fill("Tall diagram");
      await expect(page.getByLabel("Add image", { exact: true })).toHaveCount(0);
      await expect(area.locator('input[type="file"]')).toHaveCount(0);
      await expect(area.getByRole("textbox")).toHaveCount(2);
      await expect(area.getByRole("button", { name: /Remove image/ })).toHaveCount(2);

      const boxes = await area.getByTestId("visual-preview").evaluateAll((images) =>
        images.map((image) => {
          const box = image.getBoundingClientRect();
          return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
        }),
      );
      if (width === 1280) {
        expect(boxes[1].left).toBeGreaterThanOrEqual(boxes[0].right - 1);
      } else {
        expect(boxes[1].top).toBeGreaterThanOrEqual(boxes[0].bottom - 1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect.poll(() => saved.visuals?.[1]?.description).toBe("Tall diagram");
      expect(saved.visualUrl).toBe(saved.visuals![0].url);
      expect(saved.visualDescription).toBe("Wide diagram");
      await area.screenshot({ path: testInfo.outputPath("simultaneous-images.png") });

      await page.reload();
      await toggle.click();
      await expect(area.getByTestId("visual-preview")).toHaveCount(2);
      await expect(page.getByLabel("Visual description 1", { exact: true })).toHaveValue("Wide diagram");
      await expect(page.getByLabel("Visual description 2", { exact: true })).toHaveValue("Tall diagram");

      await page.getByRole("button", { name: "Remove image 1", exact: true }).click();
      await expect(page.getByLabel("Add image", { exact: true })).toBeFocused();
      await expect(area.getByTestId("visual-preview")).toHaveCount(1);
      await expect(area.getByRole("img", { name: "Image 1 preview" })).toHaveAttribute(
        "src",
        tallUrl!,
      );
      await expect(page.getByLabel("Visual description 1", { exact: true })).toHaveValue("Tall diagram");

      await page.getByLabel("Add image", { exact: true }).setInputFiles(svgFile("new.svg", 200, 120));
      await expect(area.getByTestId("visual-preview")).toHaveCount(2);
      await expect(page.getByLabel("Visual description 2", { exact: true })).toBeFocused();
      await page.getByRole("button", { name: "Remove image 2", exact: true }).click();
      await expect(page.getByLabel("Add image", { exact: true })).toBeFocused();
      await page.getByRole("button", { name: "Remove image 1", exact: true }).click();
      await expect(page.getByLabel("Add image", { exact: true })).toBeFocused();
      await expect(area.getByTestId("visual-preview")).toHaveCount(0);
    });
  }
}