import { expect, test, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.use({ hasTouch: true });

const activityId = "inline-formatting-board";
const duplicateId = "inline-formatting-copy";
const taskText = "Explain the evidence carefully and compare both claims.";
const promptText = "Use one observation in your explanation.";

const initialActivity = {
  id: activityId,
  classId: "inline-formatting-class",
  title: "",
  eyebrow: "Evidence review",
  task: taskText,
  prompts: [promptText],
  durationMinutes: 7,
  deviceMode: "off",
  technologyMode: "no_computer",
  materials: [],
  favorite: false,
  presentationTheme: {
    kind: "curated",
    themeId: "boardwork",
    accentId: "blue",
  },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

type FixtureActivity = typeof initialActivity & {
  duplicatedFrom?: string | null;
  contentFormatting?: {
    version: 1;
    task?: Array<{
      text: string;
      bold?: boolean;
      underline?: boolean;
      highlight?: boolean;
    }>;
    prompts?: Array<Array<{
      text: string;
      bold?: boolean;
      underline?: boolean;
      highlight?: boolean;
    }>>;
  } | null;
};

async function installFixture(page: Page, activitySeed: FixtureActivity = initialActivity) {
  let activity = structuredClone(activitySeed);
  let duplicate: FixtureActivity | null = null;
  let failNextPatch = false;
  const patchBodies: Record<string, unknown>[] = [];

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();

    if (method === "PATCH" && path.endsWith(`/activities/${activity.id}`)) {
      const body = request.postDataJSON() as Record<string, unknown>;
      patchBodies.push(body);
      if (failNextPatch) {
        failNextPatch = false;
        return route.fulfill({
          status: 503,
          json: { error: "Fixture save unavailable" },
        });
      }
      activity = { ...activity, ...body, updatedAt: "2026-01-02T00:00:00.000Z" };
      return route.fulfill({ json: activity });
    }

    if (method === "POST" && path.endsWith(`/activities/${activity.id}/duplicate`)) {
      duplicate = {
        ...structuredClone(activity),
        id: duplicateId,
        duplicatedFrom: activity.id,
        favorite: false,
        createdAt: "2026-01-03T00:00:00.000Z",
        updatedAt: "2026-01-03T00:00:00.000Z",
      };
      return route.fulfill({ json: duplicate });
    }

    // This suite must never create, update, or delete a real teacher record.
    if (!["GET", "HEAD"].includes(method)) return route.abort();

    if (path.endsWith("/app-state")) {
      return route.fulfill({
        json: {
          activeClassId: "inline-formatting-class",
          classes: [{
            id: "inline-formatting-class",
            name: "Science",
            grade: "5",
            subject: "Science",
            color: "#2563eb",
            defaultDuration: 7,
            defaultDeviceMode: "off",
            arrivalRoutine: null,
          }],
          activities: duplicate ? [duplicate, activity] : [activity],
          units: [],
          instructionalContexts: [],
          chips: [],
        },
      });
    }
    if (path.endsWith("/auth/status")) {
      return route.fulfill({ json: { authenticated: true, authEnabled: false } });
    }
    return route.fulfill({ json: { items: [], categories: [] } });
  });

  return {
    failOnePatch: () => {
      failNextPatch = true;
    },
    getActivity: () => activity,
    getDuplicate: () => duplicate,
    getPatchBodies: () => patchBodies,
  };
}

async function selectText(editor: Locator, selectedText: string, innerOffset = 0, length = selectedText.length) {
  await editor.evaluate((element, selection) => {
    element.focus();
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let textNode: Text | null = null;
    let offset = 0;
    while ((textNode = walker.nextNode() as Text | null)) {
      const index = textNode.data.indexOf(selection.selectedText);
      if (index !== -1) {
        offset = index;
        break;
      }
    }
    if (!textNode) throw new Error(`Could not select "${selection.selectedText}"`);
    const range = document.createRange();
    range.setStart(textNode, offset + selection.innerOffset);
    range.setEnd(textNode, offset + selection.innerOffset + selection.length);
    const browserSelection = window.getSelection();
    browserSelection?.removeAllRanges();
    browserSelection?.addRange(range);
    document.dispatchEvent(new Event("selectionchange", { bubbles: true }));
  }, { selectedText, innerOffset, length });
}

function formattingToolbar(page: Page) {
  return page.getByRole("toolbar", { name: "Text formatting", exact: true });
}

async function expectMarkedText(editor: Locator, selector: "strong" | "u" | "mark", text: string) {
  await expect(editor.locator(selector).filter({ hasText: text })).toHaveCount(1);
}

test("desktop formatting persists, retries, reopens, duplicates, presents, and exports", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const fixture = await installFixture(page);
  await page.goto(`/activity/${activityId}`);

  const task = page.getByRole("textbox", {
    name: "Describe the main task for students...",
    exact: true,
  });
  const prompt = page.getByRole("textbox", { name: "Prompt 1", exact: true });
  const toolbar = formattingToolbar(page);
  await expect(task).toHaveText(taskText);
  await expect(toolbar).toBeHidden();
  await page.waitForTimeout(900);
  expect(fixture.getPatchBodies()).toHaveLength(0);

  await selectText(task, "evidence carefully");
  await expect(toolbar).toBeVisible();
  await toolbar.getByRole("button", { name: "Bold", exact: true }).click();
  await toolbar.getByRole("button", { name: "Underline", exact: true }).click();
  await toolbar.getByRole("button", { name: "Highlight", exact: true }).click();
  await expect(toolbar.getByRole("button", { name: "Bold", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expectMarkedText(task, "strong", "evidence carefully");
  await expectMarkedText(task, "u", "evidence carefully");
  await expectMarkedText(task, "mark", "evidence carefully");

  await toolbar.getByRole("button", { name: "Clear formatting", exact: true }).click();
  await expect(task.locator("strong, u, mark")).toHaveCount(0);
  await task.press("Control+z");
  await expectMarkedText(task, "mark", "evidence carefully");
  await task.press("Control+Shift+z");
  await expect(task.locator("strong, u, mark")).toHaveCount(0);
  await task.press("Control+z");
  await expectMarkedText(task, "strong", "evidence carefully");

  await expect.poll(() => fixture.getPatchBodies().length).toBeGreaterThan(0);
  await expect.poll(() => fixture.getActivity().contentFormatting?.task).toEqual([
    { text: "Explain the " },
    { text: "evidence carefully", bold: true, underline: true, highlight: true },
    { text: " and compare both claims." },
  ]);
  const formattingPatch = fixture.getPatchBodies().find((body) => {
    const formatting = body.contentFormatting as FixtureActivity["contentFormatting"];
    return formatting?.task?.some((run) => run.bold && run.underline && run.highlight);
  });
  expect(formattingPatch).toMatchObject({
    task: taskText,
    prompts: [promptText],
    contentFormatting: {
      version: 1,
      task: expect.arrayContaining([
        expect.objectContaining({
          text: "evidence carefully",
          bold: true,
          underline: true,
          highlight: true,
        }),
      ]),
    },
  });

  const highlighted = task.locator("mark").filter({ hasText: "evidence carefully" });
  const blueHighlight = await highlighted.evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.getByTestId("button-toggle-presentation-visual").click();
  await page.getByTestId("theme-option-paper").click();
  await page.getByTestId("accent-option-plum").click();
  await expect.poll(() => fixture.getActivity().presentationTheme?.accentId).toBe("plum");
  const plumHighlight = await highlighted.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(plumHighlight).not.toBe(blueHighlight);

  fixture.failOnePatch();
  await selectText(prompt, "observation");
  await formattingToolbar(page).getByRole("button", { name: "Bold", exact: true }).click();
  await expect(page.getByTestId("text-save-status")).toContainText("Save failed");
  await expect(page.getByTestId("activity-save-error")).toContainText("Fixture save unavailable");
  await page.getByTestId("button-retry-activity-save").click();
  await expect(page.getByTestId("text-save-status")).toContainText("Saved");
  await expect.poll(() => fixture.getActivity().contentFormatting?.prompts?.[0]).toEqual([
    { text: "Use one " },
    { text: "observation", bold: true },
    { text: " in your explanation." },
  ]);

  await page.reload();
  await expectMarkedText(page.getByRole("textbox", {
    name: "Describe the main task for students...",
    exact: true,
  }), "mark", "evidence carefully");
  await expectMarkedText(page.getByRole("textbox", { name: "Prompt 1", exact: true }), "strong", "observation");

  await page.goto("/history");
  await page.getByTestId(`link-open-${activityId}`).click();
  await expectMarkedText(page.getByRole("textbox", {
    name: "Describe the main task for students...",
    exact: true,
  }), "strong", "evidence carefully");
  await page.goto("/history");
  await page.getByTestId(`button-menu-${activityId}`).click();
  await page.getByRole("menuitem", { name: "Remix / Copy", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/activity/${duplicateId}$`));
  await expect.poll(() => fixture.getDuplicate()?.contentFormatting).toEqual(fixture.getActivity().contentFormatting);
  await expectMarkedText(page.getByRole("textbox", {
    name: "Describe the main task for students...",
    exact: true,
  }), "mark", "evidence carefully");

  await page.goto(`/present/${duplicateId}`);
  const surface = page.getByTestId("presentation-surface");
  await expectMarkedText(surface.getByTestId("present-task"), "strong", "evidence carefully");
  await expectMarkedText(surface.getByTestId("present-task"), "u", "evidence carefully");
  await expectMarkedText(surface.getByTestId("present-task"), "mark", "evidence carefully");
  await expectMarkedText(surface, "strong", "observation");
  await surface.screenshot({ path: testInfo.outputPath("formatted-present.png") });
  await page.getByTestId("button-teacher-controls").click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("button-export-png").click();
  const download = await downloadPromise;
  await download.saveAs(testInfo.outputPath("formatted-board-export.png"));
  expect(download.suggestedFilename()).toMatch(/\.png$/);
  const png = await readFile(await download.path()!);
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(png.readUInt32BE(16)).toBe(1920);
  expect(png.readUInt32BE(20)).toBe(1080);
});

test("narrow keyboard and touch-sized formatting preserves Unicode, breaks, and atomic formulas", async ({
  page,
}, testInfo) => {
  const narrowTask = "Study $x^2 + y^2$ carefully.\nשלום 😀 مرحبا";
  const narrowPrompt = "Compare café, العربية, and 👩🏽‍🔬 observations.";
  const fixture = await installFixture(page, {
    ...initialActivity,
    task: narrowTask,
    prompts: [narrowPrompt],
    contentFormatting: { version: 1 },
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto(`/activity/${activityId}`);
  await page.evaluate(() => document.documentElement.classList.add("dark"));

  const task = page.getByRole("textbox", {
    name: "Describe the main task for students...",
    exact: true,
  });
  const toolbar = formattingToolbar(page);
  await expect(toolbar).toBeHidden();
  await task.click();
  await task.press("Control+Home");
  for (let index = 0; index < "Study".length; index += 1) {
    await task.press("Shift+ArrowRight");
  }
  await expect(toolbar).toBeVisible();
  await task.press("Tab");
  await expect(toolbar.getByRole("button", { name: "Bold", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(toolbar.getByRole("button", { name: "Underline", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(toolbar.getByRole("button", { name: "Highlight", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expectMarkedText(task, "mark", "Study");
  await page.keyboard.press("Escape");
  await expect(task).toBeFocused();
  await expect(toolbar).toBeHidden();

  // Select only the middle of the notation, then invoke the control with a
  // touch pointer. The persisted semantic mark must expand to the whole token.
  await selectText(task, "$x^2 + y^2$", 2, 3);
  await expect(toolbar).toBeVisible();
  const underline = toolbar.getByRole("button", { name: "Underline", exact: true });
  await underline.tap();
  await expectMarkedText(task, "u", "$x^2 + y^2$");

  const prompt = page.getByRole("textbox", { name: "Prompt 1", exact: true });
  await selectText(prompt, "العربية");
  const bold = formattingToolbar(page).getByRole("button", { name: "Bold", exact: true });
  await bold.tap();
  await expectMarkedText(prompt, "strong", "العربية");

  const buttonSizes = await formattingToolbar(page).getByRole("button").evaluateAll((buttons) =>
    buttons.map((button) => {
      const bounds = button.getBoundingClientRect();
      return { width: bounds.width, height: bounds.height };
    }),
  );
  for (const size of buttonSizes) {
    expect(size.width).toBeGreaterThanOrEqual(40);
    expect(size.height).toBeGreaterThanOrEqual(40);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await expect.poll(() => fixture.getActivity().contentFormatting?.task).toEqual([
    { text: "Study", highlight: true },
    { text: " " },
    { text: "$x^2 + y^2$", underline: true },
    { text: " carefully.\nשלום 😀 مرحبا" },
  ]);
  await expect.poll(() => fixture.getActivity().contentFormatting?.prompts?.[0]).toEqual([
    { text: "Compare café, " },
    { text: "العربية", bold: true },
    { text: ", and 👩🏽‍🔬 observations." },
  ]);
  expect(fixture.getActivity().task).toBe(narrowTask);
  await expect(task.locator("br")).toHaveCount(1);
  await expect(task).toContainText("שלום 😀 مرحبا");
  await page.screenshot({ path: testInfo.outputPath("narrow-formatting-toolbar.png") });

  await task.click();
  await expect(toolbar).toBeHidden();
});