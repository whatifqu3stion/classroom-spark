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

const longClassAppState = {
  ...appState,
  classes: [
    {
      ...appState.classes[0],
      name: "Grade 7 Design Studio — Forces, Motion & Modeling",
    },
  ],
};

const savedBoardAppState = {
  ...appState,
  activities: [
    {
      id: "activity-saved-board",
      classId: "class-1",
      eyebrow: "Independent practice",
      title: "Explain how the evidence supports your idea",
      task: "Read the evidence and write one connected explanation.",
      prompts: ["Describe the strongest pattern in the data."],
      durationMinutes: 7,
      deviceMode: "off",
      technologyMode: "no_computer",
      resourceUrl: null,
      resourceNote: null,
      visualUrl: null,
      visualDescription: null,
      materials: [],
      teacherNote: null,
      style: "Auto",
      presentationTheme: { kind: "curated", themeId: "midnight", accentId: "sage" },
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
};

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "narrow", width: 390, height: 844 },
] as const;
type Viewport = { width: number; height: number };

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
  viewport: Viewport,
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
  viewport: Viewport,
) {
  const box = await locator.boundingBox();

  expect(box, `${await locator.getAttribute("data-testid")} should have geometry`).not.toBeNull();
  expect(box!.x, `${await locator.getAttribute("data-testid")} should start in the viewport`).toBeGreaterThanOrEqual(0);
  expect(
    box!.x + box!.width,
    `${await locator.getAttribute("data-testid")} should not extend past the viewport`,
  ).toBeLessThanOrEqual(viewport.width);
}

async function expectHeaderControlsDoNotOverlap(page: Page) {
  const header = page.getByTestId("creation-class-header");
  const controls = [
    page.getByTestId("select-class"),
    page.getByTestId("button-edit-class"),
    page.getByTestId("button-new-class"),
  ];
  const boxes = await Promise.all(controls.map((control) => control.boundingBox()));

  for (const [index, box] of boxes.entries()) {
    expect(box, `header control ${index} should have geometry`).not.toBeNull();
  }

  for (let index = 0; index < boxes.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < boxes.length; otherIndex += 1) {
      const box = boxes[index]!;
      const otherBox = boxes[otherIndex]!;
      const overlaps =
        box.x < otherBox.x + otherBox.width &&
        box.x + box.width > otherBox.x &&
        box.y < otherBox.y + otherBox.height &&
        box.y + box.height > otherBox.y;
      expect(overlaps, `header controls ${index} and ${otherIndex} should not overlap`).toBe(false);
    }
  }

  const metrics = await header.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(metrics.scrollWidth, "the class header should not overflow horizontally").toBeLessThanOrEqual(
    metrics.clientWidth,
  );
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

test("keeps long class header controls separate at an intermediate scaled width", async ({ page }) => {
  await page.unroute("**/api/app-state");
  await page.route("**/api/app-state", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(longClassAppState),
    }),
  );
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "125%";
  });

  const header = page.getByTestId("creation-class-header");
  await expect(header).toBeVisible();
  await expect(page.getByTestId("select-class")).toContainText(
    "Grade 7 Design Studio — Forces, Motion & Modeling",
  );
  await expect(page.getByTestId("button-edit-class")).toBeVisible();
  await expect(page.getByTestId("button-new-class")).toBeVisible();
  await expectHeaderControlsDoNotOverlap(page);

  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(documentWidth, "the scaled header should not create horizontal page overflow").toBeLessThanOrEqual(
    1024,
  );
});

for (const viewport of viewports) {
  test(`keeps saved-board editor controls reachable at ${viewport.name} width`, async ({ page }) => {
    await page.unroute("**/api/app-state");
    await page.route("**/api/app-state", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(savedBoardAppState),
      }),
    );
    await page.setViewportSize(viewport);
    await page.goto("/activity/activity-saved-board");

    const editor = page.getByTestId("board-editor");
    const header = page.getByTestId("board-editor-header");
    const saveStatus = page.getByTestId("text-save-status");
    const presentButton = page.getByTestId("button-present");
    const editingControls = [
      page.getByRole("textbox", { name: "Enter a short title..." }),
      page.getByRole("textbox", { name: "Describe the main task for students..." }),
      page.getByRole("textbox", { name: "Enter prompt..." }),
      page.getByTestId("button-toggle-presentation-visual"),
    ];

    await expect(editor).toBeVisible();
    await expect(header).toBeVisible();
    await expect(saveStatus).toHaveText("Saved");
    await expect(presentButton).toBeVisible();

    for (const control of [saveStatus, presentButton, ...editingControls]) {
      await expect(control).toBeVisible();
      await expectElementReachableInViewport(page, control, viewport);
    }

    const [documentWidth, editorMetrics] = await Promise.all([
      page.evaluate(() => document.documentElement.scrollWidth),
      editor.evaluate((element) => ({
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      })),
    ]);
    expect(documentWidth, "the saved-board editor should not overflow the document horizontally").toBeLessThanOrEqual(
      viewport.width,
    );
    expect(editorMetrics.scrollWidth, "the saved-board editor should not overflow horizontally").toBeLessThanOrEqual(
      editorMetrics.clientWidth,
    );
    await expectElementFitsHorizontally(page, editor, viewport);
  });
}

for (const viewport of viewports) {
  test(`keeps board creation readable and reachable at ${viewport.name} width`, async ({ page }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto("/");

    const workspace = page.getByTestId("creation-workspace");
    const controls = page.getByTestId("creation-controls");
    const editorPanel = page.getByTestId("editor-workspace-panel");
    const actions = page.getByTestId("creation-actions");

    await expect(workspace).toBeVisible();
    await expect(controls).toHaveClass(/boardwork-creation-panel/);
    await expect(controls.getByTestId("select-class")).toBeVisible();
    await expect(editorPanel).toHaveClass(/boardwork-editor-panel/);
    await expect(controls.getByRole("heading", { name: APPROVED_HEADING, level: 1 })).toBeVisible();
    await expect(controls.getByText(APPROVED_SUPPORTING_COPY)).toBeVisible();
    await expect(controls.getByLabel("Topic or starting point (optional)")).toBeVisible();
    await expect(controls.getByLabel("Learning goal (optional)")).toBeVisible();

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
    await expectElementFitsHorizontally(page, controls, viewport);
    await expectElementFitsHorizontally(page, editorPanel, viewport);
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

test("keeps creation examples readable in dark mode", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
  });

  await page.getByTestId("button-toggle-customize").click();
  await page.getByTestId("segment-computer_available").click();

  const placeholderInputs = [
    page.getByTestId("input-topic"),
    page.getByTestId("input-goal"),
    page.getByTestId("input-student-output"),
    page.getByTestId("input-resource-url"),
    page.getByTestId("input-resource-note"),
    page.getByTestId("input-custom-activity-duration"),
  ];

  for (const input of placeholderInputs) {
    await expect(input).toBeVisible();
  }

  await page.getByTestId("input-topic").fill("Entered topic");

  const styles = await page.getByTestId("input-goal").evaluate((element) => {
    const placeholder = getComputedStyle(element, "::placeholder");
    const input = getComputedStyle(element);
    const label = getComputedStyle(document.querySelector('label[for="goal"]')!);
    const control = getComputedStyle(document.querySelector('[data-testid="button-generate"]')!);
    const parseColor = (value: string) => {
      const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return {
        red: channels[0] ?? 0,
        green: channels[1] ?? 0,
        blue: channels[2] ?? 0,
        alpha: channels[3] ?? 1,
      };
    };
    const composite = (foreground: string, background: string) => {
      const foregroundColor = parseColor(foreground);
      const backgroundColor = parseColor(background);
      return [foregroundColor.red, foregroundColor.green, foregroundColor.blue].map(
        (channel, index) =>
          channel * foregroundColor.alpha +
          [backgroundColor.red, backgroundColor.green, backgroundColor.blue][index] *
            (1 - foregroundColor.alpha),
      );
    };
    const luminance = (color: number[]) => {
      const channels = color.map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.03928
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const contrast = (foreground: number[], background: number[]) => {
      const foregroundLuminance = luminance(foreground);
      const backgroundLuminance = luminance(background);
      const lighter = Math.max(foregroundLuminance, backgroundLuminance);
      const darker = Math.min(foregroundLuminance, backgroundLuminance);
      return (lighter + 0.05) / (darker + 0.05);
    };

    const background = composite(input.backgroundColor, input.backgroundColor);
    const placeholderColor = composite(placeholder.color, input.backgroundColor);
    const textColor = composite(input.color, input.backgroundColor);

    return {
      placeholderOpacity: placeholder.opacity,
      placeholderContrast: contrast(placeholderColor, background),
      textContrast: contrast(textColor, background),
      placeholderLuminance: luminance(placeholderColor),
      textLuminance: luminance(textColor),
      backgroundLuminance: luminance(background),
      inputBackground: input.backgroundColor,
      inputText: input.color,
      labelText: label.color,
      controlBackground: control.backgroundColor,
      controlText: control.color,
    };
  });

  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(styles.placeholderOpacity).toBe("1");
  expect(styles.placeholderContrast).toBeGreaterThanOrEqual(4.5);
  expect(styles.placeholderContrast).toBeLessThan(styles.textContrast);
  expect(styles.placeholderLuminance).toBeGreaterThan(styles.backgroundLuminance);
  expect(styles.placeholderLuminance).toBeLessThan(styles.textLuminance);
  expect(styles.inputText).toBe(styles.labelText);
  expect(styles.inputText).not.toBe(styles.inputBackground);
  expect(styles.controlBackground).not.toBe(styles.inputBackground);
  expect(styles.controlText).not.toBe(styles.controlBackground);
  await expect(page.getByTestId("input-topic")).toHaveValue("Entered topic");
});

test("lets keyboard users complete board setup without losing focus", async ({ page }) => {
  const viewport = { width: 390, height: 844 };

  await page.setViewportSize(viewport);
  await page.goto("/");

  const setup = page.getByTestId("board-creation-setup");
  const actions = page.getByTestId("creation-actions");
  const focusOrderBeforeDetails = [
    "select-class",
    "button-edit-class",
    "button-new-class",
    "select-unit",
    "input-topic",
    "input-goal",
    "segment-no_computer",
    "segment-computer_available",
    "segment-computer_required",
    "segment-3",
    "segment-5",
    "segment-7",
    "input-custom-activity-duration",
    "button-toggle-customize",
  ];

  await page.getByTestId(focusOrderBeforeDetails[0]).focus();

  const tabTo = async (locator: Locator, label: string) => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      if (await locator.evaluate((element) => element === document.activeElement)) {
        return;
      }
      await page.keyboard.press("Tab");
    }
    throw new Error(`${label} was not reachable with Tab`);
  };

  for (const testId of focusOrderBeforeDetails) {
    const control = page.getByTestId(testId);
    await tabTo(control, testId);
    await expect(control).toBeFocused();

    const focusStyles = await control.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        outlineStyle: styles.outlineStyle,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    });
    expect(
      focusStyles.outlineStyle !== "none" ||
        focusStyles.outlineWidth !== "0px" ||
        focusStyles.boxShadow !== "none",
      `${testId} should have a visible keyboard focus indicator`,
    ).toBe(true);

    if (testId === "button-toggle-customize") {
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("input-student-output")).toBeVisible();
    }
    await page.keyboard.press("Tab");
  }

  const focusOrderAfterDetails = [
    "button-add-chip",
    "input-student-output",
    "select-work-mode",
    "input-materials-available",
    "input-completion-signal",
    "select-activity-style",
    "button-generate",
    "button-surprise",
    "button-blank",
  ];

  for (const testId of focusOrderAfterDetails) {
    const control = page.getByTestId(testId);
    await tabTo(control, testId);
    await expect(control).toBeFocused();

    const [controlBox, setupBox, actionsBox] = await Promise.all([
      control.boundingBox(),
      setup.boundingBox(),
      actions.boundingBox(),
    ]);
    expect(controlBox, `${testId} should have geometry`).not.toBeNull();
    expect(setupBox, "the setup scroll container should have geometry").not.toBeNull();
    expect(actionsBox, "the sticky creation actions should have geometry").not.toBeNull();
    if (testId !== "button-generate" && testId !== "button-surprise" && testId !== "button-blank") {
      expect(
        controlBox!.y,
        `${testId} should stay inside the setup scroll container`,
      ).toBeGreaterThanOrEqual(setupBox!.y);
      expect(
        controlBox!.y + controlBox!.height,
        `${testId} should not be hidden below the sticky creation actions`,
      ).toBeLessThanOrEqual(actionsBox!.y);
    }

    await page.keyboard.press("Tab");
  }
});

test("keeps the empty editor preview visually quiet", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const emptyState = page.getByTestId("empty-editor-state");
  await expect(emptyState).toBeVisible();
  await expect(emptyState).toHaveClass(/border-dashed/);
  await expect(emptyState).toHaveClass(/bg-muted\/20/);
  await expect(
    emptyState.getByRole("heading", { name: "No activity created yet" }),
  ).toBeVisible();
  await expect(
    emptyState.getByText(
      "Add a topic or goal on the left, then choose Create board. You can also start blank from the creation actions.",
    ),
  ).toBeVisible();
  await expect(emptyState.locator("svg")).toHaveAttribute("aria-hidden", "true");

  const styles = await emptyState.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      borderStyle: computed.borderStyle,
      boxShadow: computed.boxShadow,
      backgroundImage: computed.backgroundImage,
    };
  });

  expect(styles.borderStyle).toBe("dashed");
  expect(styles.boxShadow).toBe("none");
  expect(styles.backgroundImage).toBe("none");
  await expect(emptyState.locator(".board-editor-empty-state-card")).toHaveCount(0);
  await expect(emptyState.locator(".board-editor-empty-state-outline-line")).toHaveCount(0);
});

test("keeps the empty editor preview contained when text is enlarged", async ({ page }) => {
  const viewport = { width: 1024, height: 800 };

  await page.setViewportSize(viewport);
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "150%";
  });

  const workspace = page.getByTestId("creation-workspace");
  const emptyState = page.getByTestId("empty-editor-state");
  await expect(emptyState).toBeVisible();
  await expect(emptyState).toHaveClass(/border-dashed/);

  const bounds = await emptyState.evaluate((element) => {
    const container = element.getBoundingClientRect();
    const content = Array.from(element.querySelectorAll("svg, h3, p")).map((child) => {
      const childBounds = child.getBoundingClientRect();
      return {
        top: childBounds.top,
        right: childBounds.right,
        bottom: childBounds.bottom,
        left: childBounds.left,
      };
    });

    return {
      container: {
        top: container.top,
        right: container.right,
        bottom: container.bottom,
        left: container.left,
      },
      content,
    };
  });

  for (const child of bounds.content) {
    expect(child.top, "empty preview content should stay inside its top edge").toBeGreaterThanOrEqual(
      bounds.container.top,
    );
    expect(
      child.right,
      "empty preview content should stay inside its right edge",
    ).toBeLessThanOrEqual(bounds.container.right);
    expect(
      child.bottom,
      "empty preview content should stay inside its bottom edge",
    ).toBeLessThanOrEqual(bounds.container.bottom);
    expect(child.left, "empty preview content should stay inside its left edge").toBeGreaterThanOrEqual(
      bounds.container.left,
    );
  }

  for (const testId of requiredControls) {
    const locator = page.getByTestId(testId);
    await expect(locator).toBeVisible();
    await expectElementReachableInViewport(page, locator, viewport);
  }

  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(documentWidth, "enlarged text should not create horizontal page overflow").toBeLessThanOrEqual(
    viewport.width,
  );
  await expectElementFitsHorizontally(page, workspace, viewport);
});
