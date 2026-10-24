import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { HomebaseRecord } from "@workspace/api-zod";
import { makeWidget, template } from "../features/homebase/catalog";

test.use({
  launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? {
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        args: [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--no-zygote",
          "--single-process",
        ],
      }
    : undefined,
});
const classId = "ccda1986-777e-47de-872c-6c9a55575d70";
const secondClassId = "884bf822-ec61-4175-a00f-d2a073e7587e";
const initial = () => ({
  ...template("arrival"),
  id: randomUUID(),
  classId,
  revision: 1,
  updatedAt: "2026-10-22T12:00:00Z",
});
async function setup(page: Page, records: HomebaseRecord[] = [initial()]) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let failSave = false;
  const appState = {
    activeClassId: classId,
    classes: [
      {
        id: classId,
        name: "Grade 7 Design",
        grade: "7",
        subject: "Design",
        defaultDeviceMode: "off",
        defaultDuration: 7,
      },
      {
        id: secondClassId,
        name: "Grade 8 Design",
        grade: "8",
        subject: "Design",
        defaultDeviceMode: "off",
        defaultDuration: 7,
      },
    ],
    activities: [
      {
        id: randomUUID(),
        classId,
        title: "A stronger bridge",
        task: "Sketch two ways to strengthen a paper bridge. Label the change in each.",
        prompts: ["Explain which design you would test first."],
        durationMinutes: 5,
        deviceMode: "off",
        teacherNote: "Private teacher guidance",
      },
    ],
    chips: [],
    units: [],
    instructionalContexts: [],
  };
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/app-state")
      return route.fulfill({ json: appState });
    if (url.pathname === "/api/ai/status")
      return route.fulfill({ json: { configured: false } });
    if (url.pathname === "/api/homebases" && request.method() === "GET")
      return route.fulfill({
        json: records.filter(
          (board) =>
            board.classId === (url.searchParams.get("classId") || null),
        ),
      });
    if (url.pathname === "/api/homebases" && request.method() === "POST") {
      const next = {
        ...request.postDataJSON(),
        id: randomUUID(),
        revision: 1,
        updatedAt: new Date().toISOString(),
      };
      records.push(next);
      return route.fulfill({ status: 201, json: next });
    }
    if (
      url.pathname.startsWith("/api/homebases/") &&
      request.method() === "PUT"
    ) {
      if (failSave)
        return route.fulfill({
          status: 503,
          json: { error: "Connection interrupted. Try again." },
        });
      const input = request.postDataJSON();
      const index = records.findIndex(
        (board) => board.id === url.pathname.split("/").pop(),
      );
      if (index < 0 || records[index].revision !== input.revision)
        return route.fulfill({
          status: 409,
          json: {
            error:
              "This board changed in another tab. Save your draft as a copy.",
          },
        });
      records[index] = {
        ...records[index],
        ...input,
        revision: input.revision + 1,
        updatedAt: new Date().toISOString(),
      };
      return route.fulfill({ json: records[index] });
    }
    if (
      url.pathname.startsWith("/api/homebases/") &&
      request.method() === "DELETE"
    ) {
      const index = records.findIndex(
        (board) => board.id === url.pathname.split("/").pop(),
      );
      records.splice(index, 1);
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({
      status: 500,
      json: { error: `Unexpected API request: ${request.url()}` },
    });
  });
  await page.goto("/homebase");
  await expect(
    page.getByRole("heading", { name: "Homebase", exact: true }),
  ).toBeVisible();
  return {
    records,
    errors,
    setFailSave(value: boolean) {
      failSave = value;
    },
  };
}
async function edit(page: Page, name: string) {
  await page.getByRole("button", { name: `Edit ${name}`, exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Edit tool" })).toBeVisible();
}
async function apply(page: Page) {
  await page.getByRole("button", { name: "Apply changes" }).click();
  await expect(page.getByRole("dialog", { name: "Edit tool" })).toBeHidden();
}

test("edits, saves, recovers, scopes, and embeds an activity without teacher notes", async ({
  page,
}) => {
  const state = await setup(page);
  await edit(page, "Welcome. Start here.");
  await page
    .getByLabel("Text", { exact: true })
    .fill("Put your sketchbook on the desk. Draw one thing you notice.");
  await apply(page);
  await expect
    .poll(() => state.records[0].widgets[0].text)
    .toContain("sketchbook");
  await page.reload();
  await expect(
    page.getByText(
      "Put your sketchbook on the desk. Draw one thing you notice.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add tool", exact: true }).click();
  await page.getByRole("button", { name: "Add activity", exact: true }).click();
  await expect(
    page.getByText(
      "Sketch two ways to strengthen a paper bridge. Label the change in each.",
    ),
  ).toBeVisible();
  await expect(page.getByText("Private teacher guidance")).toHaveCount(0);
  await expect.poll(() => state.records[0].widgets.length).toBe(5);
  await page.getByLabel("Class for homebase").selectOption(secondClassId);
  await expect(
    page.getByRole("heading", { name: "Your room, ready to begin." }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Focus time A timer/ }).click();
  await expect(page.getByLabel("Homebase name")).toHaveValue("Focus time");
  await page.getByLabel("Class for homebase").selectOption(classId);
  await expect(page.getByLabel("Homebase name")).toHaveValue("Class homebase");
  expect(state.errors).toEqual([]);
});

test("moves and resizes by pointer and keyboard, locks layout, and preserves a timer in focus mode", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const state = await setup(page);
  const timer = page.getByRole("article", { name: "Timer", exact: true });
  const handle = page.getByRole("button", { name: "Move Timer", exact: true });
  await handle.focus();
  await page.keyboard.press("ArrowDown");
  await expect
    .poll(
      () =>
        state.records[0].widgets.find((widget) => widget.kind === "timer")?.y,
    )
    .toBe(1);
  const move = await handle.boundingBox();
  await page.mouse.move(move!.x + move!.width / 2, move!.y + move!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    move!.x + move!.width / 2,
    move!.y + move!.height / 2 + 80,
  );
  await page.mouse.up();
  await expect
    .poll(
      () =>
        state.records[0].widgets.find((widget) => widget.kind === "timer")?.y,
    )
    .toBe(2);
  const resize = page.getByRole("button", {
    name: "Resize Timer",
    exact: true,
  });
  await resize.focus();
  await page.keyboard.press("ArrowDown");
  await expect
    .poll(
      () =>
        state.records[0].widgets.find((widget) => widget.kind === "timer")?.h,
    )
    .toBe(5);
  await page.getByRole("button", { name: "Lock layout", exact: true }).click();
  await expect(handle).toBeHidden();
  await timer.getByRole("button", { name: "Start", exact: true }).click();
  await timer.getByRole("button", { name: "Focus on timer" }).click();
  await expect(
    page.getByRole("button", { name: "Back to board" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add tool", exact: true }),
  ).toBeHidden();
  await expect(
    timer.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await timer.getByRole("button", { name: "Pause", exact: true }).click();
  const reading = await timer.getByRole("timer").textContent();
  await page.keyboard.press("Escape");
  await expect(timer.getByRole("timer")).toHaveText(reading!);
  await expect(
    page.getByRole("button", { name: "Focus on timer" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Present", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit Timer", exact: true }),
  ).toBeHidden();
  const exitPresentation = page.getByRole("button", {
    name: "Exit presentation",
  });
  await expect(exitPresentation).toBeFocused();
  expect(
    await page
      .locator(".workspace-header")
      .evaluate((element) => (element as HTMLElement).inert),
  ).toBe(true);
  expect(
    await page
      .locator(".hb-page-header")
      .evaluate((element) => (element as HTMLElement).inert),
  ).toBe(true);
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press(i < 6 ? "Tab" : "Shift+Tab");
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest(".hb-board-root"),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Present", exact: true }),
  ).toBeFocused();
  expect(
    await page
      .locator(".workspace-header")
      .evaluate((element) => (element as HTMLElement).inert),
  ).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 });
  const ring = timer.locator(".hb-timer-face > svg");
  await expect(ring).toBeVisible();
  expect((await ring.boundingBox())!.height).toBeGreaterThan(80);
  expect(state.errors).toEqual([]);
});

test("recovers a failed save and preserves both versions on revision conflict", async ({
  page,
}) => {
  const state = await setup(page);
  state.setFailSave(true);
  await edit(page, "Welcome. Start here.");
  await page
    .getByLabel("Text", { exact: true })
    .fill("Keep this work through a connection interruption.");
  await apply(page);
  await expect(page.getByRole("alert")).toContainText("Connection interrupted");
  page.once("dialog", (dialog) => void dialog.accept());
  await page.reload();
  await expect(
    page.getByText("Keep this work through a connection interruption."),
  ).toBeVisible();
  state.setFailSave(false);
  state.records[0].revision += 1;
  await page.getByRole("button", { name: "Retry save" }).click();
  await expect(page.getByRole("alert")).toContainText("changed in another tab");
  await page.getByRole("button", { name: "Save draft as a copy" }).click();
  await expect(page.getByLabel("Homebase name")).toHaveValue(
    "Class homebase (copy)",
  );
  expect(state.records.length).toBe(2);
  expect(state.records[1].widgets[0].text).toContain("Keep this work");
  expect(state.errors).toEqual([]);
});

test("class tools work on mobile without overflow and resources wait for a click", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const record = initial();
  record.widgets = [];
  for (const kind of [
    "randomizer",
    "groups",
    "dice",
    "scoreboard",
    "traffic",
    "work",
    "draw",
    "image",
  ] as const) {
    const widget = makeWidget(kind, record.widgets);
    if (["randomizer", "groups"].includes(kind))
      widget.items = ["Alex", "Sam", "Rae", "Taylor"];
    if (kind === "image")
      widget.url = "https://images.example.test/example.png";
    record.widgets.push(widget);
  }
  let mediaRequests = 0;
  await page.route("https://images.example.test/**", (route) => {
    mediaRequests++;
    return route.abort();
  });
  const state = await setup(page, [record]);
  const picker = page.getByRole("article", {
    name: "Name picker",
    exact: true,
  });
  const picked = new Set<string>();
  for (let i = 0; i < 4; i++) {
    await picker.getByRole("button", { name: "Pick a name" }).click();
    picked.add((await picker.locator(".hb-picked").textContent())!);
  }
  expect(picked.size).toBe(4);
  await expect(
    picker.getByRole("button", { name: "Everyone had a turn" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Make groups", exact: true }).click();
  await expect(page.locator(".hb-group-list section")).toHaveCount(2);
  await page.getByRole("button", { name: "Roll die", exact: true }).click();
  await expect(page.locator(".hb-dice > span")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Add to Team 1", exact: true })
    .click();
  await expect(page.locator(".hb-scores strong").first()).toHaveText("1");
  await page.getByRole("button", { name: "Go", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Go", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("combobox", { name: "Work mode", exact: true })
    .selectOption("partner");
  await expect(
    page.getByText("Work with a partner", { exact: true }).first(),
  ).toBeVisible();
  const drawing = page.getByRole("img", { name: /Drawing board/ });
  await drawing.scrollIntoViewIfNeeded();
  const box = await drawing.boundingBox();
  await page.mouse.move(box!.x + 20, box!.y + 30);
  await page.mouse.down();
  await page.mouse.move(box!.x + 100, box!.y + 100);
  await page.mouse.up();
  await expect(drawing.locator("path")).toHaveCount(1);
  await page.getByRole("button", { name: "Undo stroke" }).click();
  await expect(drawing.locator("path")).toHaveCount(0);
  expect(mediaRequests).toBe(0);
  await page.getByRole("button", { name: "Load image" }).click();
  await expect.poll(() => mediaRequests).toBe(1);
  await expect(
    page.getByText("The resource couldn't load.", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(state.errors).toEqual([]);
});
