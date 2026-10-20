import { expect, test, type Locator, type Page } from "@playwright/test";

const APPROVED_HEADING = "What are students working on today?";
const APPROVED_SUPPORTING_COPY =
  "Add a topic, learning goal, standard, concept, or anything else that should shape the Boardwork.";

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
      sourceTopic: "Saved legacy topic",
      sourceGoal: "Saved legacy goal",
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

const scaledSavedBoardAppState = {
  ...savedBoardAppState,
  activities: [
    {
      ...savedBoardAppState.activities[0],
      eyebrow: "Evidence analysis warm-up",
      title: "Explain how the evidence supports your scientific idea",
      task: "Read the evidence, identify the strongest pattern, and write one connected explanation that links your claim to specific observations.",
      prompts: [
        "Describe the strongest pattern in the data and explain why it matters.",
        "Use one observation from the evidence to support your explanation.",
      ],
      materials: ["Printed evidence packet", "Pencil", "Science notebook"],
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
  "button-generate",
  "button-surprise",
  "button-blank",
] as const;

async function expectElementReachableInViewport(
  page: Page,
  locator: Locator,
  viewport: Viewport,
) {
  await page.evaluate(() => document.fonts.ready);
  await locator.evaluate((element) => {
    element.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
    const bounds = element.getBoundingClientRect();
    // Long editable blocks may need end alignment within nested scroll containers.
    if (bounds.top < 0 || bounds.bottom > window.innerHeight) {
      element.scrollIntoView({ block: "end", inline: "nearest", behavior: "instant" });
    }
  });
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
  ).toBeLessThanOrEqual(viewport.height + 0.5);
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

async function expectSingleEditorFrame(page: Page) {
  const editorPanel = page.getByTestId("editor-workspace-panel");
  const boardEditor = page.getByTestId("board-editor");
  const frameMetrics = await page.evaluate(() => {
    const outer = document.querySelector('[data-testid="editor-workspace-panel"]');
    const inner = document.querySelector('[data-testid="board-editor"]');
    if (!outer || !inner) return null;

    const outerStyles = getComputedStyle(outer);
    const innerStyles = getComputedStyle(inner);
    const outerBounds = outer.getBoundingClientRect();
    const innerBounds = inner.getBoundingClientRect();

    return {
      outerBorderStyle: outerStyles.borderStyle,
      outerBorderWidth: outerStyles.borderWidth,
      innerBorderStyle: innerStyles.borderStyle,
      innerBorderWidth: innerStyles.borderWidth,
      innerRadius: innerStyles.borderRadius,
      outerBounds: {
        left: outerBounds.left,
        right: outerBounds.right,
        top: outerBounds.top,
        bottom: outerBounds.bottom,
      },
      innerBounds: {
        left: innerBounds.left,
        right: innerBounds.right,
        top: innerBounds.top,
        bottom: innerBounds.bottom,
      },
      outerScrollWidth: outer.scrollWidth,
      outerClientWidth: outer.clientWidth,
      innerScrollWidth: inner.scrollWidth,
      innerClientWidth: inner.clientWidth,
    };
  });

  expect(frameMetrics).not.toBeNull();
  expect(frameMetrics!.outerBorderStyle).toBe("solid");
  expect(frameMetrics!.outerBorderWidth).not.toBe("0px");
  expect(frameMetrics!.innerBorderWidth).toBe("0px");
  expect(frameMetrics!.innerRadius).toBe("0px");
  expect(frameMetrics!.innerBounds.left).toBeGreaterThanOrEqual(frameMetrics!.outerBounds.left);
  expect(frameMetrics!.innerBounds.right).toBeLessThanOrEqual(frameMetrics!.outerBounds.right);
  expect(frameMetrics!.innerBounds.top).toBeGreaterThanOrEqual(frameMetrics!.outerBounds.top);
  expect(frameMetrics!.innerBounds.bottom).toBeLessThanOrEqual(frameMetrics!.outerBounds.bottom);
  expect(frameMetrics!.outerScrollWidth).toBeLessThanOrEqual(frameMetrics!.outerClientWidth);
  expect(frameMetrics!.innerScrollWidth).toBeLessThanOrEqual(frameMetrics!.innerClientWidth);
  await expectElementFitsHorizontally(page, editorPanel, {
    width: await page.evaluate(() => window.innerWidth),
    height: await page.evaluate(() => window.innerHeight),
  });
  await expectElementFitsHorizontally(page, boardEditor, {
    width: await page.evaluate(() => window.innerWidth),
    height: await page.evaluate(() => window.innerHeight),
  });
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
  await page.route("**/api/saved-context?*", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ items: [], categories: [] }),
    }),
  );
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
  await page.goto("/app");
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

test("keeps the Add image focus outline from being clipped", async ({ page }) => {
  await page.unroute("**/api/app-state");
  await page.route("**/api/app-state", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(savedBoardAppState),
    }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/activity/activity-saved-board");

  await page.getByTestId("button-toggle-presentation-visual").click();
  const addImage = page.locator("label").filter({ hasText: "Add image" });
  const fileInput = page.locator('input[type="file"]').first();
  const content = page.getByTestId("presentation-visual-editor-content");

  await expect(addImage).toBeVisible();
  await fileInput.focus();

  const outlineState = await addImage.evaluate((label) => ({
    hasFocusWithin: label.matches(":focus-within"),
    boxShadow: getComputedStyle(label).boxShadow,
  }));
  const contentOverflow = await content.evaluate(
    (element) => getComputedStyle(element).overflow,
  );

  expect(outlineState.hasFocusWithin).toBe(true);
  expect(outlineState.boxShadow).not.toBe("none");
  expect(contentOverflow).toBe("visible");
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
      page.getByRole("textbox", { name: "Describe the main task for students..." }),
      page.getByRole("textbox", { name: /^Prompt \d+$/ }),
      page.getByTestId("button-toggle-presentation-visual"),
    ];

    await expect(editor).toBeVisible();
    await expect(header).toBeVisible();
    await expect(saveStatus).toHaveText("Saved");
    await expect(presentButton).toBeVisible();
    await expectSingleEditorFrame(page);

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

test("keeps populated activity editing readable at 150% text scaling", async ({ page }) => {
  await page.unroute("**/api/app-state");
  await page.route("**/api/app-state", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(scaledSavedBoardAppState),
    }),
  );
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto("/activity/activity-saved-board");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "150%";
  });

    const editor = page.getByTestId("board-editor");
  const header = page.getByTestId("board-editor-header");
    const saveStatus = page.getByTestId("text-save-status");
    const presentButton = page.getByTestId("button-present");
    const task = page.getByRole("textbox", {
      name: "Describe the main task for students...",
    });
    const prompts = page.getByRole("textbox", { name: /^Prompt \d+$/ });
    const materials = page.getByRole("textbox", {
      name: "Optional materials, separated by commas...",
    });

  await expect(editor).toBeVisible();
  await expect(header).toBeVisible();
  await expect(saveStatus).toHaveText("Saved");
  await expect(presentButton).toBeVisible();
  await expectSingleEditorFrame(page);
  await expect(task).toContainText("identify the strongest pattern");
  await expect(prompts).toHaveCount(2);
  await expect(prompts.nth(0)).toContainText("Describe the strongest pattern in the data");
  await expect(materials).toContainText("Printed evidence packet");

  for (const control of [saveStatus, presentButton, task, prompts.nth(0), prompts.nth(1), materials]) {
    await expect(control).toBeVisible();
    await expectElementReachableInViewport(page, control, { width: 1024, height: 800 });
    await expectElementFitsHorizontally(page, control, { width: 1024, height: 800 });
  }

  const [documentWidth, editorMetrics] = await Promise.all([
    page.evaluate(() => document.documentElement.scrollWidth),
    editor.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    })),
  ]);
  expect(documentWidth, "the scaled populated editor should not overflow the document horizontally").toBeLessThanOrEqual(
    1024,
  );
  expect(editorMetrics.scrollWidth, "the scaled populated editor should not overflow horizontally").toBeLessThanOrEqual(
    editorMetrics.clientWidth,
  );
  await expectElementFitsHorizontally(page, editor, { width: 1024, height: 800 });
});

for (const viewport of viewports) {
  test(`keeps board creation readable and reachable at ${viewport.name} width`, async ({ page }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto("/app");

  const workspace = page.getByTestId("creation-workspace");
    const controls = page.getByTestId("creation-controls");
    const editorPanel = page.getByTestId("editor-workspace-panel");
    const actions = page.getByTestId("creation-actions");

    await expect(workspace).toBeVisible();
    await expect(controls).toHaveClass(/boardwork-creation-panel/);
    await expect(controls.getByTestId("select-class")).toBeVisible();
    await expect(editorPanel).toHaveClass(/boardwork-editor-panel/);
    await expect(controls.getByRole("heading", { name: APPROVED_HEADING, level: 1 })).toBeVisible();
    await expect(controls.getByText(APPROVED_SUPPORTING_COPY)).toHaveAttribute(
      "id",
      "boardwork-context-description",
    );
    await expect(controls.getByLabel(APPROVED_HEADING)).toBeVisible();
    await expect(controls.getByTestId("input-topic")).toHaveAttribute("id", "topic");
    await expect(controls.getByTestId("input-topic")).toHaveAttribute(
      "aria-describedby",
      "boardwork-context-description",
    );
    await expect(controls.getByTestId("input-topic")).toHaveAttribute("maxLength", "1000");
    await expect(controls.getByTestId("input-goal")).toHaveCount(0);

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

test("keeps creation examples distinct from entered text and readable", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/app");

  const styles = await page.getByTestId("input-topic").evaluate((element) => {
    const computed = getComputedStyle(element);
    const placeholder = getComputedStyle(element, "::placeholder");
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    const channels = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const rgba = Array.from(context.getImageData(0, 0, 1, 1).data);
      return [rgba[0], rgba[1], rgba[2], rgba[3] / 255];
    };
    const luminance = (rgb: number[]) => {
      const linear = rgb.slice(0, 3).map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const panel = channels(getComputedStyle(element.closest('[data-testid="creation-controls"]')!).backgroundColor);
    const surface = channels(computed.backgroundColor);
    const alpha = surface[3] ?? 1;
    const background = surface.slice(0, 3).map((value, index) => value * alpha + panel[index] * (1 - alpha));
    const contrast = (color: string) => (luminance(background) + 0.05) / (luminance(channels(color)) + 0.05);
    return {
      placeholderOpacity: placeholder.opacity,
      placeholderColor: placeholder.color,
      textColor: computed.color,
      placeholderContrast: contrast(placeholder.color),
      textContrast: contrast(computed.color),
    };
  });

  expect(styles.placeholderOpacity).toBe("1");
  expect(styles.placeholderColor).not.toBe(styles.textColor);
  expect(styles.placeholderContrast).toBeGreaterThanOrEqual(4.5);
  expect(styles.textContrast).toBeGreaterThan(styles.placeholderContrast);
});

test("keeps the workspace canvas warm while separating white panels", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/app");
  await expect(page.getByTestId("creation-controls")).toBeVisible();
  await expect(page.getByTestId("editor-workspace-panel")).toBeVisible();

  const colors = await page.evaluate(() => {
    const parseColor = (value: string) => {
      const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
      if (value.includes("oklab")) {
        const alpha = value.match(/\/\s*([\d.]+)\s*\)/)?.[1];
        return {
          red: 255,
          green: 255,
          blue: 255,
          alpha: alpha ? Number(alpha) : 1,
        };
      }
      const normalizedChannels = value.includes("color(srgb")
        ? channels.slice(0, 3).map((channel) => channel * 255)
        : channels;
      return {
        red: normalizedChannels[0] ?? 0,
        green: normalizedChannels[1] ?? 0,
        blue: normalizedChannels[2] ?? 0,
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

    const canvas = parseColor(getComputedStyle(document.body).backgroundColor);
    const creationPanel = document.querySelector('[data-testid="creation-controls"]');
    const editorPanel = document.querySelector('[data-testid="editor-workspace-panel"]');
    if (!creationPanel || !editorPanel) {
      throw new Error("Workspace panels should be present");
    }
    const creationSurface = composite(
      getComputedStyle(creationPanel).backgroundColor,
      getComputedStyle(document.body).backgroundColor,
    );
    const editorSurface = composite(
      getComputedStyle(editorPanel).backgroundColor,
      getComputedStyle(document.body).backgroundColor,
    );

    return {
      canvas,
      creationSurface,
      editorSurface,
      canvasLuminance: luminance([canvas.red, canvas.green, canvas.blue]),
      creationLuminance: luminance(creationSurface),
      editorLuminance: luminance(editorSurface),
    };
  });

  expect(colors.canvas).toMatchObject({ red: 249, green: 247, blue: 244, alpha: 1 });
  expect(colors.canvas.red).toBeGreaterThan(colors.canvas.blue);
  expect(colors.creationLuminance).toBeGreaterThan(colors.canvasLuminance + 0.015);
  expect(colors.editorLuminance).toBeGreaterThan(colors.canvasLuminance + 0.008);
});

test("keeps creation examples readable in dark mode", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/app");
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
  });

  await page.getByTestId("segment-computer_required").click();

  const placeholderInputs = [
    page.getByTestId("input-topic"),
    page.getByTestId("input-resource-url"),
    page.getByTestId("input-resource-note"),
    page.getByTestId("input-custom-activity-duration"),
  ];

  for (const input of placeholderInputs) {
    await expect(input).toBeVisible();
  }

  await page.getByTestId("input-topic").fill("Entered topic");

  const styles = await page.getByTestId("input-topic").evaluate((element) => {
    const computed = getComputedStyle(element);
    const placeholder = getComputedStyle(element, "::placeholder");
    const label = document.querySelector('label[for="topic"]');
    const control = document.querySelector('[data-testid="select-unit"]');
    if (!label || !control) throw new Error("Setup label and unit control must be present");
    const luminance = (color: string) => {
      const channels = color.match(/[\d.]+/g)?.map(Number);
      if (!channels || channels.length < 3) throw new Error(`Invalid color: ${color}`);
      return channels.slice(0, 3).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.03928
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      }).reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
    };
    const placeholderLuminance = luminance(placeholder.color);
    const textLuminance = luminance(computed.color);
    const backgroundLuminance = luminance(computed.backgroundColor);
    const contrast = (foreground: number) =>
      (Math.max(foreground, backgroundLuminance) + 0.05) /
      (Math.min(foreground, backgroundLuminance) + 0.05);
    return {
      placeholderOpacity: placeholder.opacity,
      placeholderContrast: contrast(placeholderLuminance),
      textContrast: contrast(textLuminance),
      placeholderLuminance,
      textLuminance,
      backgroundLuminance,
      inputText: computed.color,
      labelText: getComputedStyle(label).color,
      inputBackground: computed.backgroundColor,
      controlBackground: getComputedStyle(control).backgroundColor,
      controlText: getComputedStyle(control).color,
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

for (const viewport of viewports) {
  test(`keeps populated editor content readable in dark mode at ${viewport.name} width`, async ({
    page,
  }) => {
    const mutationRequests: string[] = [];
    page.on("request", (request) => {
      if (["POST", "PATCH", "PUT", "DELETE"].includes(request.method())) {
        mutationRequests.push(`${request.method()} ${request.url()}`);
      }
    });

    await page.setViewportSize(viewport);
    await page.unroute("**/api/app-state");
    await page.route("**/api/app-state", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(scaledSavedBoardAppState),
      }),
    );
    await page.goto("/activity/activity-saved-board");
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });

    const editor = page.getByTestId("board-editor");
    const task = page.getByRole("textbox", {
      name: "Describe the main task for students...",
    });
    const prompts = page.getByRole("textbox", { name: /^Prompt \d+$/ });
    const materials = page.getByRole("textbox", {
      name: "Optional materials, separated by commas...",
    });
    const saveStatus = page.getByTestId("text-save-status");
    const presentButton = page.getByTestId("button-present");
    const materialsLabel = page.getByText("Materials", { exact: true });

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(editor).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Enter a short title..." })).toHaveCount(0);
    await expect(task).toContainText("identify the strongest pattern");
    await expect(prompts).toHaveCount(2);
    await expect(prompts.first()).toContainText(
      "Describe the strongest pattern in the data and explain why it matters.",
    );
    await expect(materials).toContainText("Printed evidence packet");
    await expect(saveStatus).toHaveText("Saved");
    await expect(presentButton).toBeVisible();
    await expect(materialsLabel).toBeVisible();

    for (const control of [
      task,
      prompts.first(),
      materials,
      saveStatus,
      presentButton,
    ]) {
      await expect(control).toBeVisible();
      await expectElementReachableInViewport(page, control, viewport);
    }

    const metrics = await page.evaluate(() => {
      const boardEditor = document.querySelector<HTMLElement>('[data-testid="board-editor"]');
      return {
        documentWidth: document.documentElement.scrollWidth,
        editorScrollWidth: boardEditor?.scrollWidth ?? 0,
        editorClientWidth: boardEditor?.clientWidth ?? 0,
      };
    });
    expect(
      metrics.documentWidth,
      `${viewport.name} dark editor should not overflow the document horizontally`,
    ).toBeLessThanOrEqual(viewport.width);
    expect(
      metrics.editorScrollWidth,
      `${viewport.name} dark editor should not overflow its panel horizontally`,
    ).toBeLessThanOrEqual(metrics.editorClientWidth);

    const contrast = await page.evaluate(() => {
      const parseRgb = (value: string) => {
        const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
        return channels.slice(0, 3);
      };
      const luminance = (value: string) => {
        const [red, green, blue] = parseRgb(value).map((channel) => channel / 255);
        return [red, green, blue]
          .map((channel) =>
            channel <= 0.03928
              ? channel / 12.92
              : ((channel + 0.055) / 1.055) ** 2.4,
          )
          .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
      };
      const ratio = (foreground: string, background: string) => {
        const foregroundLuminance = luminance(foreground);
        const backgroundLuminance = luminance(background);
        const lighter = Math.max(foregroundLuminance, backgroundLuminance);
        const darker = Math.min(foregroundLuminance, backgroundLuminance);
        return (lighter + 0.05) / (darker + 0.05);
      };
      const stylesFor = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) throw new Error(`Missing contrast sample: ${selector}`);
        const styles = getComputedStyle(element);
        return {
          color: styles.color,
          background: styles.backgroundColor,
        };
      };
      const stylesForExactText = (text: string) => {
        const element = Array.from(document.querySelectorAll<HTMLElement>("div")).find(
          (candidate) => candidate.textContent?.trim() === text,
        );
        if (!element) throw new Error(`Missing contrast sample text: ${text}`);
        const styles = getComputedStyle(element);
        return {
          color: styles.color,
          background: styles.backgroundColor,
        };
      };

      const editor = stylesFor('[data-testid="board-editor"]');
      const task = stylesFor('[aria-label="Describe the main task for students..."]');
      const prompt = stylesFor('[aria-label="Prompt 1"]');
      const materials = stylesFor('[aria-label="Optional materials, separated by commas..."]');
      const materialsLabel = stylesForExactText("Materials");
      const saveStatus = stylesFor('[data-testid="text-save-status"]');
      const present = stylesFor('[data-testid="button-present"]');

      return {
        editorSurface: editor.background,
        task: ratio(task.color, editor.background),
        prompt: ratio(prompt.color, editor.background),
        materials: ratio(materials.color, editor.background),
        materialsLabel: ratio(materialsLabel.color, editor.background),
        saveStatus: ratio(saveStatus.color, editor.background),
        present: ratio(present.color, present.background),
      };
    });

    expect(contrast.editorSurface).not.toBe("rgba(0, 0, 0, 0)");
    for (const [name, value] of Object.entries(contrast)) {
      if (name === "editorSurface") continue;
      expect(value, `${name} should remain readable in dark mode`).toBeGreaterThanOrEqual(4.5);
    }
    expect(mutationRequests).toEqual([]);
  });
}

test("lets keyboard users complete board setup without losing focus", async ({ page }) => {
  const viewport = { width: 1024, height: 800 };

  await page.setViewportSize(viewport);
  await page.goto("/app");

  await page.getByTestId("segment-computer_required").click();

  const focusOrder = [
    "select-class",
    "button-edit-class",
    "button-new-class",
    "input-topic",
    "button-add-unit",
    "select-unit",
    "button-add-context-empty",
    "segment-no_computer",
    "segment-computer_required",
    "input-resource-url",
    "input-resource-note",
    "segment-3",
    "segment-5",
    "segment-7",
    "input-custom-activity-duration",
  ];

  await page.getByTestId(focusOrder[0]).focus();

  const tabTo = async (locator: Locator, label: string) => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      if (await locator.evaluate((element) => element === document.activeElement)) {
        return;
      }
      await page.keyboard.press("Tab");
    }
    throw new Error(`${label} was not reachable with Tab`);
  };

  for (const testId of focusOrder) {
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

    await page.keyboard.press("Tab");
  }

  const focusOrderActions = [
    "button-generate",
    "button-surprise",
    "button-blank",
  ];

  for (const testId of focusOrderActions) {
    const control = page.getByTestId(testId);

    await tabTo(control, testId);
    await expect(control).toBeFocused();

    const controlBox = await control.boundingBox();
    expect(controlBox, `${testId} should have geometry`).not.toBeNull();
    expect(controlBox!.y, `${testId} should scroll into view on focus`).toBeGreaterThanOrEqual(0);
    expect(controlBox!.y + controlBox!.height).toBeLessThanOrEqual(viewport.height);

    await page.keyboard.press("Tab");
  }
});

test("keeps the empty editor preview visually quiet", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/app");

    const editorPanel = page.getByTestId("editor-workspace-panel");
    const emptyState = page.getByTestId("empty-editor-state");
  const emptyContent = page.getByTestId("empty-editor-content");
  await expect(emptyState).toBeVisible();
  await expect(emptyContent).toBeVisible();
  await expect(emptyState).toHaveClass(/bg-card/);
  await expect(emptyState).not.toHaveClass(/border-dashed/);
  await expect(editorPanel).toHaveClass(/boardwork-editor-panel/);
  await expect(editorPanel).toHaveClass(/\bborder\b/);
  await expect(
    emptyState.getByRole("heading", { name: "No activity created yet" }),
  ).toBeVisible();
  await expect(
    emptyState.getByText(
      "Add what students are working on in Board Setup, then choose Create board. You can also start blank.",
    ),
  ).toBeVisible();
  await expect(emptyState.locator("svg")).toHaveAttribute("aria-hidden", "true");

  const [editorBounds, emptyStateBounds] = await Promise.all([
    editorPanel.boundingBox(),
    emptyState.boundingBox(),
  ]);
  expect(editorBounds).not.toBeNull();
  expect(emptyStateBounds).not.toBeNull();
  const emptyContentBounds = await emptyContent.boundingBox();
  expect(emptyContentBounds).not.toBeNull();
  expect(emptyStateBounds!.x).toBeGreaterThanOrEqual(editorBounds!.x);
  expect(emptyStateBounds!.x + emptyStateBounds!.width).toBeLessThanOrEqual(
    editorBounds!.x + editorBounds!.width,
  );
  expect(
    Math.abs(
      emptyContentBounds!.x +
        emptyContentBounds!.width / 2 -
        (editorBounds!.x + editorBounds!.width / 2),
    ),
    "empty editor content should be centered in the full editor panel",
  ).toBeLessThanOrEqual(1);

  const alignment = await emptyContent.evaluate((element) => {
    const container = element.getBoundingClientRect();
    const containerCenter = container.left + container.width / 2;
    const childCenters = Array.from(element.children).map((child) => {
      const bounds = child.getBoundingClientRect();
      return bounds.left + bounds.width / 2;
    });
    return {
      containerCenter,
      childCenters,
      top: container.top,
      bottom: container.bottom,
    };
  });
  for (const childCenter of alignment.childCenters) {
    expect(
      Math.abs(childCenter - alignment.containerCenter),
      "empty editor content should share one centered axis",
    ).toBeLessThanOrEqual(1);
  }

  const styles = await emptyState.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      borderStyle: computed.borderStyle,
      borderWidth: computed.borderWidth,
      boxShadow: computed.boxShadow,
      backgroundImage: computed.backgroundImage,
    };
  });

  expect(styles.borderWidth).toBe("0px");
  expect(styles.boxShadow).toBe("none");
  expect(styles.backgroundImage).toBe("none");
  await expect(emptyState.locator(".board-editor-empty-state-card")).toHaveCount(0);
  await expect(emptyState.locator(".board-editor-empty-state-outline-line")).toHaveCount(0);
});

test("keeps the empty editor preview contained when text is enlarged", async ({ page }) => {
  const viewport = { width: 1024, height: 800 };

  await page.setViewportSize(viewport);
  await page.goto("/app");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "150%";
  });

  const workspace = page.getByTestId("creation-workspace");
    const editorPanel = page.getByTestId("editor-workspace-panel");
    const emptyState = page.getByTestId("empty-editor-state");
  const emptyContent = page.getByTestId("empty-editor-content");
  await expect(emptyState).toBeVisible();
  await expect(emptyContent).toBeVisible();
  await expect(emptyState).not.toHaveClass(/border-dashed/);
  await expect(editorPanel).toHaveClass(/boardwork-editor-panel/);
  await expect(editorPanel).toHaveClass(/\bborder\b/);

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

  const contentAlignment = await emptyContent.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return {
      left: bounds.left,
      right: bounds.right,
      center: bounds.left + bounds.width / 2,
    };
  });
  const emptyStateBounds = await emptyState.boundingBox();
  expect(emptyStateBounds).not.toBeNull();
  const editorPanelBounds = await editorPanel.boundingBox();
  expect(editorPanelBounds).not.toBeNull();
  expect(
    Math.abs(
      contentAlignment.center -
        (editorPanelBounds!.x + editorPanelBounds!.width / 2),
    ),
    "enlarged empty editor content should be centered in the full editor panel",
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(
      contentAlignment.center -
        (emptyStateBounds!.x + emptyStateBounds!.width / 2),
    ),
    "enlarged empty editor content should remain centered",
  ).toBeLessThanOrEqual(1);

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
  expect(documentWidth, "creating a scaled blank board should not overflow horizontally").toBeLessThanOrEqual(
    viewport.width,
  );
});

for (const viewport of [
  { name: "desktop", width: 1280, height: 800 },
  { name: "narrow", width: 390, height: 844 },
] as const) {
  test(`keeps one editor frame when a blank board is created at ${viewport.name} width`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/app");

    const editorPanel = page.getByTestId("editor-workspace-panel");
    const emptyState = page.getByTestId("empty-editor-state");
    await expect(emptyState).toBeVisible();
    await expect(editorPanel).toHaveClass(/\bborder\b/);

    const initialBounds = await editorPanel.boundingBox();
  expect(initialBounds).not.toBeNull();

  await page.getByTestId("button-blank").click();

  await expect(page.getByTestId("board-editor")).toBeVisible();
  await expectSingleEditorFrame(page);
  const populatedBounds = await editorPanel.boundingBox();
  expect(populatedBounds).not.toBeNull();
  expect(populatedBounds!.x).toBe(initialBounds!.x);
  expect(populatedBounds!.width).toBe(initialBounds!.width);

  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth, "creating a blank board should not overflow horizontally").toBeLessThanOrEqual(
      viewport.width,
    );
  });
}

test("keeps one editor frame when a blank board is created with enlarged text", async ({ page }) => {
  const viewport = { width: 1024, height: 800 };
  await page.setViewportSize(viewport);
  await page.goto("/app");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "150%";
  });

    const editorPanel = page.getByTestId("editor-workspace-panel");
    const initialBounds = await editorPanel.boundingBox();
  expect(initialBounds).not.toBeNull();

  await page.getByTestId("button-blank").click();

  await expect(page.getByTestId("board-editor")).toBeVisible();
  await expectSingleEditorFrame(page);
  const populatedBounds = await editorPanel.boundingBox();
  expect(populatedBounds).not.toBeNull();
  expect(populatedBounds!.x).toBe(initialBounds!.x);
  expect(populatedBounds!.width).toBe(initialBounds!.width);

  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(documentWidth, "creating a scaled blank board should not overflow horizontally").toBeLessThanOrEqual(
    viewport.width,
  );
});

for (const viewport of [
  { name: "desktop", width: 1280, height: 800 },
  { name: "narrow", width: 390, height: 844 },
] as const) {
  test(`keeps one editor frame and resets fresh-board setup at ${viewport.name} width`, async ({ page }) => {
    await page.unroute("**/api/app-state");
    await page.route("**/api/app-state", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(savedBoardAppState),
      }),
    );
    await page.setViewportSize(viewport);
    await page.goto("/activity/activity-saved-board");

    const editorPanel = page.getByTestId("editor-workspace-panel");
    await expect(page.getByTestId("board-editor")).toBeVisible();
    await expectSingleEditorFrame(page);

    const initialBounds = await editorPanel.boundingBox();
    expect(initialBounds).not.toBeNull();

    await page.getByRole("link", { name: "Workspace" }).click();

    await expect(page.getByTestId("empty-editor-state")).toBeVisible();
    await expect(page.getByTestId("board-editor")).toHaveCount(0);
    await expect(editorPanel).toHaveClass(/\bborder\b/);
    await expect(page.getByTestId("input-topic")).toHaveValue("");
    await expect(page.getByTestId("segment-5")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("segment-7")).toHaveAttribute("aria-pressed", "false");

    const emptyBounds = await editorPanel.boundingBox();
    expect(emptyBounds).not.toBeNull();
    expect(emptyBounds!.x).toBe(initialBounds!.x);
    expect(emptyBounds!.width).toBe(initialBounds!.width);

    const [documentWidth, frameMetrics] = await Promise.all([
      page.evaluate(() => document.documentElement.scrollWidth),
      editorPanel.evaluate((element) => ({
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        borderWidth: getComputedStyle(element).borderWidth,
      })),
    ]);
    expect(frameMetrics.borderWidth).not.toBe("0px");
    expect(frameMetrics.scrollWidth).toBeLessThanOrEqual(frameMetrics.clientWidth);
    expect(documentWidth, "returning to the empty editor should not overflow horizontally").toBeLessThanOrEqual(
      viewport.width,
    );
  });
}

test("preserves a saved board duration when opening Present", async ({ page }) => {
  await page.unroute("**/api/app-state");
  await page.route("**/api/app-state", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(savedBoardAppState),
    }),
  );
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/activity/activity-saved-board");

  await expect(page.getByTestId("button-present")).toBeVisible();
  await page.getByTestId("button-present").click();
  await expect(page).toHaveURL(/\/present\/activity-saved-board$/);

  await page.getByRole("button", { name: "Minimize timer" }).click();
  const timerProgress = page.getByRole("progressbar", { name: "Time remaining" });
  await expect(timerProgress).toHaveAttribute("aria-valuemax", "420");
  await expect(timerProgress).toHaveAttribute("aria-valuenow", "420");
});
