import { expect, test, type Locator, type Page } from "@playwright/test";
import type { Activity, ClassProfile, SavedContext, SavedContextSnapshot } from "@workspace/api-client-react";

test.use({ actionTimeout: 10_000 });

const timestamp = "2026-01-01T00:00:00.000Z";
const classA = "context-regression-class-a";
const classB = "context-regression-class-b";
const globalId = "context-regression-global";
const localId = "context-regression-local";
const otherId = "context-regression-other";
const sourceId = "context-regression-source";
const copyId = "context-regression-copy";
const surpriseId = "context-regression-surprise";
const originalLabel = "مراجعة الأدلة — Evidence and explanation";
const originalDetails =
  "قارن الأدلة ثم اشرح فكرتك بالعربية أو English. השתמשו בדוגמה אחת כדי להסביר את המסקנה. " +
  "Keep the original instructions, including this long reference: https://example.test/" +
  "evidence-and-explanation-without-spaces-".repeat(3);
const editedLabel = "Revised library instructions";
const editedDetails = "New library text must not replace the saved board's original context.";

function makeClass(id: string, name: string): ClassProfile {
  return {
    id, name, grade: "5", subject: "Science", color: "#2563eb",
    defaultDuration: 7, defaultDeviceMode: "off",
    createdAt: timestamp, updatedAt: timestamp,
  };
}

function makeContext(id: string, label: string, classId: string | null): SavedContext {
  return {
    id, label, classId, scope: classId ? "class" : "global",
    details: id === globalId ? originalDetails : "Explain using one observation.",
    categoryId: "context-regression-category", categoryName: "Evidence",
    archived: false, lastUsedAt: null, createdAt: timestamp, updatedAt: timestamp,
  };
}

// This is a browser/client contract test, not a replacement for saved-context.test.ts's
// real persistence and source-snapshot resolution checks. Fail closed for every API
// call: even an unexpected autosave must never reach the user's server or provider.
async function installFixture(page: Page) {
  const library = [
    makeContext(globalId, originalLabel, null),
    makeContext(localId, "Class A observation", classA),
    makeContext(otherId, "Class B observation", classB),
  ];
  const snapshot: SavedContextSnapshot[] = library.slice(0, 2).map((item) => ({
    contextId: item.id, label: item.label, category: item.categoryName, details: item.details,
  }));
  const source: Activity = {
    id: sourceId, classId: classA, title: "Saved evidence board",
    eyebrow: "Independent practice", task: "Compare two observations and explain your conclusion.",
    prompts: ["Which observation supports your explanation?"],
    durationMinutes: 7, deviceMode: "off", technologyMode: "no_computer",
    sourceTopic: "Evidence", sourceGoal: "Explain a conclusion", sourceChipIds: [],
    savedContextSnapshot: structuredClone(snapshot), materials: [], favorite: false,
    presentationTheme: { kind: "curated", themeId: "midnight", accentId: "sage" },
    createdAt: timestamp, updatedAt: timestamp,
  };
  const state = {
    activeClassId: classA,
    classes: [makeClass(classA, "Context regression A"), makeClass(classB, "Context regression B")],
    activities: [source], chips: [], units: [], instructionalContexts: [],
  };
  const initialActiveClassId = state.activeClassId;
  const unexpected: string[] = [];
  const updates: { id: string; body: Record<string, unknown> }[] = [];
  const archives: string[] = [];
  const selections: string[] = [];
  const duplicates: string[] = [];
  const generationRequests: Record<string, unknown>[] = [];
  const resolvedSnapshots: SavedContextSnapshot[][] = [];

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const json = (body: unknown, status = 200) => route.fulfill({ status, json: body });
    if (method === "GET" && path === "/api/auth/status") {
      return json({ passwordRequired: false, authenticated: true });
    }
    if (method === "GET" && path === "/api/app-state") return json(state);
    if (method === "GET" && path === "/api/saved-context") {
      const requestedClass = url.searchParams.get("classId");
      if (![classA, classB].includes(requestedClass ?? "")) {
        unexpected.push(`Invalid library class: ${requestedClass}`);
        return json({ error: "Unknown fixture class" }, 400);
      }
      return json({
        items: library.filter((item) => !item.archived && (item.scope === "global" || item.classId === requestedClass)),
        categories: [{ id: "context-regression-category", name: "Evidence", createdAt: timestamp, updatedAt: timestamp }],
      });
    }
    const select = path.match(/^\/api\/classes\/([^/]+)\/select$/);
    if (method === "POST" && select && state.classes.some((item) => item.id === select[1])) {
      state.activeClassId = select[1];
      selections.push(select[1]);
      return json({ activeClassId: state.activeClassId });
    }
    const update = path.match(/^\/api\/saved-context\/([^/]+)$/);
    const item = library.find((entry) => entry.id === update?.[1]);
    if (method === "PATCH" && item) {
      const body = request.postDataJSON();
      updates.push({ id: item.id, body });
      Object.assign(item, body);
      return json(item);
    }
    const archive = path.match(/^\/api\/saved-context\/([^/]+)\/archive$/);
    const archived = library.find((entry) => entry.id === archive?.[1]);
    if (method === "POST" && archived) {
      archived.archived = true;
      archives.push(archived.id);
      return json(archived);
    }
    if (method === "POST" && path === `/api/activities/${sourceId}/duplicate`) {
      duplicates.push(sourceId);
      const copy = { ...structuredClone(source), id: copyId, duplicatedFrom: sourceId, favorite: false };
      state.activities.unshift(copy);
      return json(copy, 201);
    }
    if (method === "POST" && path === "/api/generate") {
      const body = request.postDataJSON();
      generationRequests.push(body);
      const origin = state.activities.find((activity) => activity.id === body.sourceActivityId);
      // Model the server contract: reuse a stored snapshot, never today's library.
      if (!origin || "savedContextIds" in body || "savedContextSnapshot" in body) {
        unexpected.push("Surprise did not reference only its source activity");
        return json({ error: "Invalid snapshot source" }, 400);
      }
      resolvedSnapshots.push(structuredClone(origin.savedContextSnapshot ?? []));
      if (generationRequests.length === 1) {
        return json({ error: "Fixture generation failed. Please try again." }, 503);
      }
      const generated = {
        ...structuredClone(origin), id: surpriseId, sourceActivityId: origin.id,
        task: "Use a fresh comparison to explain the evidence.", duplicatedFrom: null,
      };
      state.activities.unshift(generated);
      return json(generated, 201);
    }
    unexpected.push(`${method} ${path}`);
    return json({ error: `Unstubbed fixture request: ${method} ${path}` }, 501);
  });
  return {
    state, source, snapshot, library, updates, archives, selections, duplicates,
    generationRequests, resolvedSnapshots, unexpected, initialActiveClassId,
  };
}

async function switchClass(page: Page, name: string) {
  await page.getByTestId("select-class").click();
  await page.getByRole("option", { name: `${name} Science`, exact: true }).click();
  await expect(page.getByTestId("select-class")).toContainText(name);
  await expect(page.getByTestId("button-add-context-empty")).toBeVisible();
  await expect(page.locator('[data-testid^="context-pill-"]')).toHaveCount(0);
}

for (const width of [390, 1280]) {
  for (const theme of ["light", "dark"] as const) {
    test(`Saved Context menu polish at ${width}px in ${theme}`, async ({ page }, testInfo) => {
      const fixture = await installFixture(page);
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/app");
      await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), theme === "dark");
      await page.getByTestId("button-add-context-empty").click();
      const dialog = page.getByRole("dialog");
      const search = page.getByRole("textbox", { name: "Search saved contexts" });
      await expect(search).toBeVisible();
      await search.fill("Class A observation");
      const row = page.getByTestId(`context-row-${localId}`);
      await expect(row).toBeVisible();
      await search.clear();
      await row.click();
      await expect(row).toHaveAttribute("aria-pressed", "true");
      const edit = page.getByRole("button", { name: "Edit Class A observation", exact: true });
      await expect(edit).toHaveCSS("opacity", "1");
      const box = await edit.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
      await row.focus();
      await page.keyboard.press("Tab");
      await expect(edit).toBeFocused();
      expect(await edit.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe("none");
      await expect(dialog.getByRole("heading", { name: "Saved context", exact: true })).toHaveCSS("text-align", "left");
      await expectReadableText(page.getByTestId(`context-row-${globalId}`).getByText(originalDetails, { exact: true }), "rtl");
      await page.screenshot({ path: testInfo.outputPath("picker.png") });
      await edit.click();
      await expect(dialog.getByRole("heading", { name: "Edit context" })).toHaveCSS("text-align", "left");
      const category = page.getByRole("combobox", { name: "Category (optional)", exact: true });
      await expect(category).toContainText("Evidence");
      await expect(page.getByRole("radiogroup", { name: "Availability", exact: true })).toBeVisible();
      await expect(dialog.getByText("19/50", { exact: true })).toHaveCSS("font-size", "12px");
      await expect(page.getByRole("button", { name: "Save changes", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Archive", exact: true })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath("edit.png") });
      await category.click();
      const categorySearch = page.getByRole("combobox", { name: "Search or create category", exact: true });
      await expect(categorySearch).toBeVisible();
      await categorySearch.fill("Evidence");
      const option = page.getByRole("option", { name: "Evidence", exact: true });
      await expect(option).toBeVisible();
      await page.mouse.move(0, 0);
      await page.keyboard.press("ArrowDown");
      await expect(option).toHaveAttribute("data-selected", "true");
      await option.hover();
      const optionColors = await option.evaluate((element) => {
        const sample = document.createElement("span");
        sample.style.backgroundColor = "hsl(var(--muted))";
        document.body.append(sample);
        const colors = { actual: getComputedStyle(element).backgroundColor, expected: getComputedStyle(sample).backgroundColor };
        sample.remove();
        return colors;
      });
      expect(optionColors.actual).toBe(optionColors.expected);
      await page.screenshot({ path: testInfo.outputPath("category.png") });
      await option.click();
      await expect(category).toBeFocused();
      await page.getByRole("button", { name: "Back", exact: true }).click();
      await expect(row).toBeFocused();
      await page.getByTestId("button-create-context-picker").click();
      await expect(dialog.getByRole("heading", { name: "Create context" })).toHaveCSS("text-align", "left");
      await expect(dialog.getByRole("button", { name: "Create", exact: true })).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Archive", exact: true })).toHaveCount(0);
      await page.screenshot({ path: testInfo.outputPath("create.png") });
      for (const element of [dialog, page.getByTestId("button-save-context")]) {
        const bounds = await element.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
      }
      expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      await page.getByRole("button", { name: "Back", exact: true }).click();
      await expect(page.getByTestId("button-create-context-picker")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("button-add-context")).toBeFocused();
      expect(fixture.unexpected).toEqual([]);
      expect(fixture.updates).toEqual([]);
      expect(fixture.archives).toEqual([]);
      expect(fixture.selections).toEqual([]);
    });
  }
}

async function expectReadableText(locator: Locator, direction: "rtl" | "ltr") {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();
  await expect(locator).toHaveAttribute("dir", "auto");
  const metrics = await locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    // Walk the actual dark surfaces, not light-theme token names.
    let parent: Element | null = element;
    let background = "rgba(0, 0, 0, 0)";
    while (parent && background === "rgba(0, 0, 0, 0)") {
      background = getComputedStyle(parent).backgroundColor;
      parent = parent.parentElement;
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    const luminance = (color: string) => {
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const channels = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map((value) => {
        const c = value / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const foreground = luminance(style.color);
    const surface = luminance(background);
    return {
      left: box.left, right: box.right, width: window.innerWidth,
      scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
      direction: element.matches(":dir(rtl)") ? "rtl" : "ltr",
      lineClamp: style.webkitLineClamp,
      contrast: (Math.max(foreground, surface) + 0.05) / (Math.min(foreground, surface) + 0.05),
    };
  });
  expect(metrics.direction).toBe(direction);
  expect(metrics.left).toBeGreaterThanOrEqual(0);
  expect(metrics.right).toBeLessThanOrEqual(metrics.width);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(["none", "0", ""]).toContain(metrics.lineClamp);
  expect(metrics.contrast).toBeGreaterThanOrEqual(4.5);
}

async function inspectSnapshot(page: Page) {
  const disclosure = page.getByTestId("button-toggle-snapshot");
  await expect(disclosure).toHaveAttribute("aria-expanded", "false");
  await disclosure.click();
  await expect(disclosure).toHaveAttribute("aria-expanded", "true");
  const inspector = page.getByTestId("saved-context-snapshot-details");
  await expect(inspector).toContainText("2 Saved context items applied");
  await expect(inspector.getByText(originalLabel, { exact: true })).toBeVisible();
  await expect(inspector.getByText(originalDetails, { exact: true })).toBeVisible();
  await expect(inspector).toContainText("Class A observation");
  await expect(inspector).toContainText("Evidence");
  await expect(inspector).not.toContainText(editedLabel);
  await expect(inspector).not.toContainText(editedDetails);
  await expect(inspector).not.toContainText("Edited unselected item");
  await expectReadableText(inspector.getByText(originalLabel, { exact: true }), "rtl");
  await expectReadableText(inspector.getByText(originalDetails, { exact: true }), "rtl");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
}

test("keeps saved context snapshots through library edits, archive, history copy and Present Surprise retry", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const fixture = await installFixture(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => document.documentElement.classList.add("dark"));
  });
  try {
    await page.goto("/app");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByTestId("button-add-context-empty").click();
    await expect(page.getByTestId(`context-row-${otherId}`)).toHaveCount(0);
    const globalRow = page.getByTestId(`context-row-${globalId}`);
    await expectReadableText(globalRow.getByText(originalDetails, { exact: true }), "rtl");
    await page.screenshot({ path: testInfo.outputPath("saved-context-narrow-dark.png") });

    // Editing an unselected item must not opt it into generation.
    await page.getByTestId(`button-edit-context-${localId}`).click();
    await page.getByTestId("input-context-label").fill("Edited unselected item");
    await page.getByTestId("button-save-context").click();
    await expect(page.getByTestId(`context-row-${localId}`)).toHaveText(/Edited unselected item/);
    await expect(page.getByTestId(`context-row-${localId}`)).toHaveAttribute("aria-pressed", "false");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("button-add-context-empty")).toBeFocused();
    await expect(page.locator('[data-testid^="context-pill-"]')).toHaveCount(0);

    // First selection replaces the dialog's original opener while it is open.
    await page.getByTestId("button-add-context-empty").click();
    await globalRow.click();
    await expect(globalRow).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId(`context-row-${localId}`).click();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("button-add-context")).toBeFocused();
    await expect(page.locator('[data-testid^="context-pill-"]')).toHaveCount(2);

    await switchClass(page, "Context regression B");
    await page.getByTestId("button-add-context-empty").click();
    await expect(page.getByTestId(`context-row-${localId}`)).toHaveCount(0);
    await expect(page.getByTestId(`context-row-${otherId}`)).toBeVisible();
    await expect(globalRow).toHaveAttribute("aria-pressed", "false");
    await globalRow.click();
    await page.keyboard.press("Escape");
    await switchClass(page, "Context regression A");
    await page.getByTestId("button-add-context-empty").click();
    await expect(page.getByTestId(`context-row-${otherId}`)).toHaveCount(0);
    await expect(page.getByTestId(`context-row-${localId}`)).toHaveAttribute("aria-pressed", "false");
    await expect(globalRow).toHaveAttribute("aria-pressed", "false");

    await globalRow.click();
    await page.getByTestId(`button-edit-context-${globalId}`).click();
    await page.getByTestId("input-context-label").fill(editedLabel);
    await page.getByTestId("textarea-context-details").fill(editedDetails);
    await page.getByTestId("button-save-context").click();
    await expect(globalRow).toContainText(editedLabel);
    await expect(globalRow).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId(`context-pill-${globalId}`)).toContainText(editedLabel);
    await page.getByTestId("button-add-context").click();
    await page.getByTestId(`button-edit-context-${globalId}`).click();
    await page.getByTestId("button-archive-context").click();
    await expect(globalRow).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("button-add-context-empty")).toBeFocused();
    await expect(page.locator('[data-testid^="context-pill-"]')).toHaveCount(0);
    await page.reload();
    await page.getByTestId("button-add-context-empty").click();
    await expect(globalRow).toHaveCount(0);
    await expect(page.getByTestId(`context-row-${localId}`)).toContainText("Edited unselected item");
    await page.keyboard.press("Escape");

    await page.getByTestId("nav-history").click();
    await page.getByTestId(`button-menu-${sourceId}`).click();
    await page.getByTestId(`menu-open-${sourceId}`).click();
    await expect(page).toHaveURL(new RegExp(`/activity/${sourceId}$`));
    await inspectSnapshot(page);
    await page.reload();
    await inspectSnapshot(page);

    await page.getByTestId("nav-history").click();
    await page.getByTestId(`button-menu-${sourceId}`).click();
    await page.getByTestId(`menu-duplicate-${sourceId}`).click();
    await expect(page).toHaveURL(new RegExp(`/activity/${copyId}$`));
    await inspectSnapshot(page);
    await page.reload();
    await inspectSnapshot(page);
    await page.screenshot({ path: testInfo.outputPath("saved-snapshot-narrow-dark.png") });

    await page.getByTestId("button-present").click();
    await expect(page.getByTestId("present-task")).toHaveText(fixture.source.task);
    await expect(page.getByTestId("saved-context-snapshot-details")).toHaveCount(0);
    await expect(page.getByText(originalLabel, { exact: true })).toHaveCount(0);
    await page.getByTestId("button-teacher-controls").click();
    await page.getByTestId("button-present-surprise").click();
    await expect(page.getByTestId("present-generation-error")).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/present/${copyId}$`));
    await expect(page.getByTestId("present-task")).toHaveText(fixture.source.task);
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/present/${surpriseId}$`));
    await expect(page.getByTestId("present-task")).toHaveText("Use a fresh comparison to explain the evidence.");
    await expect(page.getByTestId("present-generation-error")).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId("present-task")).toHaveText("Use a fresh comparison to explain the evidence.");
    await page.goto(`/activity/${surpriseId}`);
    await inspectSnapshot(page);

    expect(fixture.updates).toEqual([
      { id: localId, body: { label: "Edited unselected item", details: "Explain using one observation.", categoryId: "context-regression-category", scope: "class", classId: classA } },
      { id: globalId, body: { label: editedLabel, details: editedDetails, categoryId: "context-regression-category", scope: "global", classId: null } },
    ]);
    expect(fixture.archives).toEqual([globalId]);
    expect(fixture.duplicates).toEqual([sourceId]);
    const expectedRequest = {
      classId: classA, topic: "Evidence", goal: "Explain a conclusion", chipIds: [],
      sourceActivityId: copyId, deviceMode: "off", technologyMode: "no_computer",
      durationMinutes: 7, activityStyle: null, presentationTheme: fixture.source.presentationTheme,
      teacherProvidedUrl: null, teacherProvidedResourceNote: null, surprise: true,
    };
    expect(fixture.generationRequests).toEqual([expectedRequest, expectedRequest]);
    expect(fixture.resolvedSnapshots).toEqual([fixture.snapshot, fixture.snapshot]);
    expect(fixture.source.savedContextSnapshot).toEqual(fixture.snapshot);
    expect(fixture.selections).toEqual([classB, classA]);
    expect(fixture.state.activeClassId).toBe(fixture.initialActiveClassId);
  } finally {
    // All selection changes are fixture-local; restore even on a mid-journey failure.
    fixture.state.activeClassId = fixture.initialActiveClassId;
    expect(fixture.unexpected, "No request may escape the isolated API fixture").toEqual([]);
  }
});