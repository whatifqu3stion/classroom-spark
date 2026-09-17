import { expect, test } from "@playwright/test";
import type { ActivityDraft } from "@/store/boardwork-context";

const board: ActivityDraft & { id: string } = {
  id: "sizing-board", classId: "sizing-class", title: "", task: "Work quietly.",
  prompts: [], durationMinutes: 5, deviceMode: "off", materials: [],
  presentationTheme: { kind: "curated", themeId: "paper-v2", accentId: "sage" },
};
const state = {
  activeClassId: "sizing-class",
  classes: [{
    id: "sizing-class", name: "Science", grade: "5", subject: "Science",
    color: "#2563eb", defaultDuration: 5, defaultDeviceMode: "off", arrivalRoutine: null,
  }],
  units: [], chips: [], instructionalContexts: [], activities: [board],
};

for (const viewport of [
  { width: 1280, height: 1000 },
  { width: 1280, height: 600 },
  { width: 390, height: 844 },
]) {
  for (const dark of [false, true]) {
    test(`content-sized editor ${viewport.width}x${viewport.height} ${dark ? "dark" : "light"}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ reducedMotion: "reduce" });
      // All data is local to the test; no requests can change real saved boards.
      let fixture = structuredClone(state);
      await page.route("**/api/**", (route) => {
        const path = new URL(route.request().url()).pathname;
        if (!["GET", "HEAD"].includes(route.request().method())) return route.abort();
        const json = path.endsWith("/app-state") ? fixture
          : path.endsWith("/auth/status") ? { authenticated: true, authEnabled: false }
          : { items: [], categories: [] };
        return route.fulfill({ json });
      });
      const panel = page.getByTestId("editor-workspace-panel");
      const body = page.getByTestId("board-editor-content");
      const toggle = page.getByTestId("button-toggle-presentation-visual");
      const height = () => panel.evaluate((el) => el.getBoundingClientRect().height);
      const maxHeight = viewport.height - 104; // Existing navigation and workspace padding.

      for (const saved of [false, true]) {
        await page.goto(saved ? "/activity/sizing-board" : "/");
        await page.evaluate((value) => document.documentElement.classList.toggle("dark", value), dark);
        if (!saved) {
          await expect(page.getByTestId("empty-editor-state")).toBeVisible();
          if (viewport.width >= 1024) {
            expect(Math.abs(await height() - maxHeight)).toBeLessThan(2);
          }
          await page.getByTestId("button-blank").click();
        }
        await expect(toggle).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const collapsed = await height();
        if (viewport.width >= 1024) {
          expect(collapsed).toBeLessThan(maxHeight - 1);
          const top = await panel.evaluate((el) => el.getBoundingClientRect().top);
          expect(top).toBe(await page.getByTestId("creation-controls").evaluate((el) => el.getBoundingClientRect().top));
        } else {
          expect(collapsed).toBeLessThan(500);
        }
        const footerGap = await panel.evaluate((el) => {
          const section = el.querySelector('[data-testid="presentation-visual-section"]')!;
          return el.getBoundingClientRect().bottom - section.getBoundingClientRect().bottom;
        });
        expect(footerGap).toBeGreaterThanOrEqual(12);
        expect(footerGap).toBeLessThanOrEqual(41);
        expect(await page.getByTestId("presentation-visual-editor").evaluate((el) => el.getBoundingClientRect().height)).toBe(0);
        await toggle.focus();
        await page.keyboard.press("Enter");
        await expect(toggle).toHaveAttribute("aria-expanded", "true");
        await expect.poll(height).toBeGreaterThan(
          viewport.width >= 1024 ? Math.min(collapsed + 20, maxHeight - 1) : collapsed + 20,
        );
        if (viewport.width >= 1024) {
          expect(await height()).toBeLessThanOrEqual(maxHeight + 1);
          expect(await body.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
        } else {
          expect(await body.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
        }
        await page.getByTestId("button-add-teacher-note").scrollIntoViewIfNeeded();
        await expect(page.getByTestId("button-add-teacher-note")).toBeInViewport();
        await toggle.focus();
        await page.keyboard.press("Space");
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
        await expect(toggle).toBeFocused();
        await expect(toggle).toBeInViewport();
        await expect.poll(height).toBeCloseTo(collapsed, 0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }

      await panel.screenshot({ path: testInfo.outputPath("collapsed-editor.png") });
      // A saved long board exercises intrinsic task/prompt/snapshot growth and overflowing settings.
      fixture = {
        ...state,
        activities: [{
          ...board, task: "Explain the evidence in your own words. ".repeat(50),
          prompts: ["Describe your reasoning. ".repeat(25)],
          teacherNote: "Remember to ask for evidence. ".repeat(30),
          savedContextSnapshot: [{ label: "Class routine", details: "Draw before explaining. ".repeat(20), category: "Routine" }],
          visuals: [{ url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3C/svg%3E", description: "First" }],
        }],
      };
      await page.goto("/activity/sizing-board");
      await page.evaluate((value) => document.documentElement.classList.toggle("dark", value), dark);
      await expect(body).toBeVisible();
      if (viewport.width >= 1024) {
        expect(await height()).toBeLessThanOrEqual(maxHeight + 1);
        expect(await body.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
        await expect(page.getByTestId("button-present")).toBeInViewport();
      }
      await toggle.scrollIntoViewIfNeeded();
      await toggle.click();
      const note = page.getByRole("textbox", { name: "Optional note for the teacher..." });
      await note.scrollIntoViewIfNeeded();
      await expect(note).toBeInViewport();
      await toggle.focus();
      await page.keyboard.press("Space");
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(toggle).toBeFocused();
      await expect(toggle).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
}