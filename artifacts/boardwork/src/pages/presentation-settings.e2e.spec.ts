import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  getCuratedPresentationTheme,
  presentationAccentThemes,
  presentationSurfaceThemes,
} from "@workspace/api-zod";

const activityId = "presentation-settings-regression";

const initialActivity = {
  id: activityId,
  classId: "presentation-settings-class",
  eyebrow: "Visual comparison",
  title: "Compare two diagrams",
  task: "Compare the two diagrams and explain one difference.",
  prompts: ["Use one observation in your explanation."],
  durationMinutes: 7,
  deviceMode: "off",
  technologyMode: "no_computer",
  resourceUrl: null,
  resourceNote: null,
  materials: [],
  teacherNote: null,
  visualUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='100'%3E%3Crect width='160' height='100' fill='%23b3c7b3'/%3E%3C/svg%3E",
  visualDescription: "First classroom diagram",
  visuals: [
    {
      url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='100'%3E%3Crect width='160' height='100' fill='%23b3c7b3'/%3E%3C/svg%3E",
      description: "First classroom diagram",
    },
    {
      url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='160'%3E%3Crect width='100' height='160' fill='%23d6b38a'/%3E%3C/svg%3E",
      description: "Second classroom diagram",
    },
  ],
  presentationTheme: {
    kind: "curated",
    themeId: "boardwork",
    accentId: "blue",
  },
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const initialAppState = {
  activeClassId: "presentation-settings-class",
  classes: [
    {
      id: "presentation-settings-class",
      name: "Science",
      grade: "5",
      subject: "Science",
      color: "#2563eb",
      defaultDuration: 7,
      defaultDeviceMode: "off",
      arrivalRoutine: null,
    },
  ],
  units: [],
  chips: [],
  instructionalContexts: [],
  activities: [initialActivity],
};

function hexToRgb(color: string) {
  const value = color.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgb(${red}, ${green}, ${blue})`;
}

function surfaceTestId(id: string) {
  return id === "paper-v2" ? "paper" : id.replace("-v2", "");
}

async function installFixture(page: Page) {
  let activity = structuredClone(initialActivity);
  let writes = 0;

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (
      request.method() === "PATCH" &&
      path.endsWith(`/activities/${activityId}`)
    ) {
      activity = {
        ...activity,
        ...(request.postDataJSON() as Record<string, unknown>),
      };
      writes += 1;
      return route.fulfill({ json: activity });
    }

    if (!["GET", "HEAD"].includes(request.method())) {
      return route.abort();
    }

    if (path.endsWith("/app-state")) {
      return route.fulfill({
        json: { ...initialAppState, activities: [activity] },
      });
    }
    if (path.endsWith("/auth/status")) {
      return route.fulfill({ json: { authenticated: true, authEnabled: false } });
    }
    return route.fulfill({ json: { items: [], categories: [] } });
  });

  return {
    getActivity: () => activity,
    getWrites: () => writes,
  };
}

async function computedTileStyle(locator: Locator) {
  return locator.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      background: styles.backgroundColor,
      border: styles.borderTopColor,
      color: styles.color,
      boxShadow: styles.boxShadow,
      outline: styles.outlineStyle,
    };
  });
}

async function expectTileContentsToFit(option: Locator) {
  const metrics = await option.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const descendants = Array.from(element.querySelectorAll("*"));
    const boxes = descendants.map((child) => {
      const box = child.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        text: child.textContent?.trim() ?? "",
        scrollWidth: child.scrollWidth,
        clientWidth: child.clientWidth,
      };
    });
    return {
      bounds: {
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
        bottom: bounds.bottom,
      },
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      boxes,
    };
  });

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  for (const box of metrics.boxes) {
    expect(box.left).toBeGreaterThanOrEqual(metrics.bounds.left);
    expect(box.right).toBeLessThanOrEqual(metrics.bounds.right);
    expect(box.top).toBeGreaterThanOrEqual(metrics.bounds.top);
    expect(box.bottom).toBeLessThanOrEqual(metrics.bounds.bottom);
    if (box.text && box.clientWidth > 0) {
      expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    }
  }
}

async function expectNeutralTileStates(
  selected: Locator,
  unselected: Locator,
) {
  const resting = await computedTileStyle(unselected);
  await unselected.hover();
  const hovered = await computedTileStyle(unselected);
  await pageMouseAway(unselected);
  const selectedStyle = await computedTileStyle(selected);

  expect(hovered.background).not.toBe(resting.background);
  expect(selectedStyle.background).not.toBe(resting.background);
  expect(selectedStyle.background).not.toBe(hovered.background);
  expect(selectedStyle.border).not.toBe(selectedStyle.color);

  return { resting, hovered, selected: selectedStyle };
}

async function pageMouseAway(locator: Locator) {
  await locator.page().mouse.move(0, 0);
}

for (const viewport of [
  { name: "desktop", width: 1280, height: 1000 },
  { name: "narrow", width: 390, height: 1000 },
  { name: "extra-narrow", width: 287, height: 1000 },
] as const) {
  for (const dark of [false, true]) {
    test(`presentation settings tiles remain usable at ${viewport.name} ${dark ? "dark" : "light"}`, async ({
      page,
     }, testInfo) => {
      const fixture = await installFixture(page);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.emulateMedia({
        colorScheme: dark ? "dark" : "light",
        reducedMotion: "reduce",
      });
      await page.goto(`/activity/${activityId}`);
      await page.evaluate((isDark) => {
        document.documentElement.classList.toggle("dark", isDark);
        document.documentElement.style.fontSize = "20px";
      }, dark);
      await page.evaluate(() => document.fonts.ready);

      const toggle = page.getByTestId("button-toggle-presentation-visual");
      await toggle.click();
      const picker = page.getByTestId("presentation-theme-picker");
      await expect(picker).toBeVisible();

      const visualColors = picker.getByText("Visual presentation colors", {
        exact: true,
      });
      const backgroundLabel = picker.getByText("Background", { exact: true });
      const accentLabel = picker.getByText("Accent", { exact: true });
      const noteLabel = page.getByText("Teacher note", { exact: true });
      for (const label of [visualColors, backgroundLabel, accentLabel, noteLabel]) {
        await expect(label).toBeVisible();
        await expect(label).toHaveCSS("text-transform", "none");
        await expect(label).toHaveCSS("font-size", "17.5px");
      }

      // At the enlarged root size the editor's desktop content column is
      // medium-width (two tiles); the two narrow viewports fit one.
      const expectedColumnCount = viewport.width === 1280 ? 2 : 1;
      const grids = await picker.locator(".presentation-theme-grid").all();
      for (const grid of grids) {
        await expect(grid).toHaveCSS(
          "grid-template-columns",
          new RegExp(`^(?:[^ ]+\\s+){${expectedColumnCount - 1}}[^ ]+$`),
        );
      }

      const selectedSurface = page.getByTestId("theme-option-boardwork");
      const unselectedSurface = page.getByTestId("theme-option-paper");
      const selectedAccent = page.getByTestId("accent-option-blue");
      const unselectedAccent = page.getByTestId("accent-option-sage");
      const surfaceStates = await expectNeutralTileStates(
        selectedSurface,
        unselectedSurface,
      );
      await expectNeutralTileStates(
        selectedAccent,
        unselectedAccent,
      );

      for (const surface of presentationSurfaceThemes) {
        const option = page.getByTestId(`theme-option-${surfaceTestId(surface.id)}`);
        await expect(option).toHaveAttribute(
          "aria-pressed",
          surface.id === "boardwork" ? "true" : "false",
        );
        await expect(option.locator(".presentation-theme-check")).toHaveClass(
          surface.id === "boardwork" ? /./ : /(?:^| )invisible(?: |$)/,
        );
        await expect(option).toHaveCSS("min-height", "55px");
        await expect(option.locator(".presentation-theme-option__name")).toHaveCount(0);
        await expect(option.locator(".truncate")).toHaveCount(0);
        await expectTileContentsToFit(option);

        const expected = getCuratedPresentationTheme(
          surface.id,
          surface.defaultAccentId,
        ).colors.background;
        await expect(
          page.getByTestId(`theme-swatch-color-${surface.id}`),
        ).toHaveCSS("background-color", hexToRgb(expected));
      }

      for (const accent of presentationAccentThemes) {
        const option = page.getByTestId(`accent-option-${accent.id}`);
        await expect(option).toHaveAttribute(
          "aria-pressed",
          accent.id === "blue" ? "true" : "false",
        );
        await expect(option.locator(".presentation-theme-check")).toHaveClass(
          accent.id === "blue" ? /./ : /(?:^| )invisible(?: |$)/,
        );
        await expect(option).toHaveCSS("min-height", "55px");
        await expectTileContentsToFit(option);
        const expected = getCuratedPresentationTheme(
          "boardwork",
          accent.id,
        ).colors.accent;
        await expect(option.locator(".presentation-theme-swatch")).toHaveCSS(
          "background-color",
          hexToRgb(expected),
        );
      }

      // Keyboard focus must add a ring without changing the selected border.
      await selectedSurface.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await page.mouse.move(0, 0);
      await expect(selectedSurface).toBeFocused();
      const focused = await computedTileStyle(selectedSurface);
      expect(focused.boxShadow !== "none" || focused.outline !== "none").toBe(true);
      expect(focused.border).toBe(surfaceStates.selected.border);

      const imageWorkspace = page.getByTestId("image-workspace");
      const imageHeight = await imageWorkspace.evaluate(
        (element) => element.getBoundingClientRect().height,
      );
      await expect(imageWorkspace.locator('[data-testid^="image-selector-"]')).toHaveCount(0);
      await expect(imageWorkspace.getByText("Added", { exact: true })).toHaveCount(0);
      await expect(imageWorkspace.getByText("Empty", { exact: true })).toHaveCount(0);
      await expect(imageWorkspace.locator('input[type="file"]')).toHaveCount(0);
      await expect(imageWorkspace.getByRole("img")).toHaveCount(2);
      await expect(
        imageWorkspace.getByRole("img", { name: "Image 1 preview", exact: true }),
      ).toBeVisible();
      await expect(
        imageWorkspace.getByRole("img", { name: "Image 2 preview", exact: true }),
      ).toBeVisible();
      await expect(imageWorkspace.getByRole("textbox")).toHaveCount(2);
      expect(
        await imageWorkspace.evaluate((element) => element.scrollWidth),
      ).toBeLessThanOrEqual(viewport.width);

      const removeImage = page.getByRole("button", {
        name: "Remove image 2",
        exact: true,
      });
      const removeSize = await removeImage.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return { width: bounds.width, height: bounds.height };
      });
      expect(removeSize.width).toBeGreaterThanOrEqual(40);
      expect(removeSize.height).toBeGreaterThanOrEqual(40);
      const removeResting = await computedTileStyle(removeImage);
      await removeImage.hover();
      const removeHovered = await computedTileStyle(removeImage);
      expect(removeHovered.background).not.toBe(removeResting.background);
      await page.mouse.move(0, 0);

      const caption = page.getByRole("textbox", {
        name: "Visual description 2",
        exact: true,
      });
      await caption.fill("Updated second classroom diagram");
      await expect.poll(() => fixture.getActivity().visuals?.[1]?.description).toBe(
        "Updated second classroom diagram",
      );

      const addNote = page.getByTestId("button-add-teacher-note");
      await expect(addNote).toHaveCSS("min-height", "55px");
      const addNoteResting = await computedTileStyle(addNote);
      await addNote.hover();
      const addNoteHovered = await computedTileStyle(addNote);
      expect(addNoteHovered.background).not.toBe(addNoteResting.background);
      expect(addNoteHovered.color).toBe(addNoteResting.color);
      await addNote.click();
      const note = page.getByRole("textbox", {
        name: "Optional note for the teacher...",
        exact: true,
      });
      await note.fill("Keep the comparison brief.");
      await expect.poll(() => fixture.getActivity().teacherNote).toBe(
        "Keep the comparison brief.",
      );
      const removeNote = page.getByTestId("button-remove-teacher-note");
      await expect(removeNote).toHaveCSS("min-height", "55px");
      await expect(removeNote).toHaveClass(/hover:bg-muted\/70/);
      await page.mouse.move(0, 0);

      await page.getByTestId("theme-option-paper").click();
      await page.getByTestId("accent-option-plum").click();
      await expect(page.getByTestId("theme-option-paper")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(
        page.getByTestId("theme-option-paper").locator(".presentation-theme-check"),
      ).not.toHaveClass(/invisible/);
      await expect(
        page.getByTestId("theme-option-boardwork").locator(".presentation-theme-check"),
      ).toHaveClass(/(?:^| )invisible(?: |$)/);
      await expect(page.getByTestId("accent-option-plum")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(
        page.getByTestId("accent-option-plum").locator(".presentation-theme-check"),
      ).not.toHaveClass(/invisible/);
      await expect.poll(() => fixture.getActivity().presentationTheme).toEqual({
        kind: "curated",
        themeId: "paper-v2",
        accentId: "plum",
      });

      await toggle.click();
      await expect(page.getByTestId("presentation-visual-editor")).toHaveAttribute(
        "inert",
      );
      await toggle.click();
      await expect(imageWorkspace.getByRole("img")).toHaveCount(2);
      await expect(caption).toHaveValue("Updated second classroom diagram");
      await expect(note).toHaveText("Keep the comparison brief.");
      await expect(page.getByTestId("theme-option-paper")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(page.getByTestId("accent-option-plum")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(fixture.getWrites()).toBeGreaterThan(0);
      expect(
        await imageWorkspace.evaluate((element) => element.getBoundingClientRect().height),
      ).toBe(imageHeight);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(viewport.width);

      if (viewport.width === 1280 && !dark) {
        await page.screenshot({
          path: testInfo.outputPath("presentation-settings-desktop-light.png"),
          fullPage: true,
        });
      }
      if (viewport.width === 390 && dark) {
        await page.screenshot({
          path: testInfo.outputPath("presentation-settings-narrow-dark.png"),
          fullPage: true,
        });
      }
    });
  }
}