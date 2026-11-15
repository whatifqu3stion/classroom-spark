import { fileURLToPath } from "node:url";
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
  await page.getByRole("button", { name: "Clear drawing" }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
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


test("keeps vote adjustments grouped and makes clearing the tally deliberate", async ({ page }) => {
  const record = initial();
  const poll = { ...makeWidget("poll"), title: "What should we explore?", w: 4,
    items: ["Test a prediction", "Compare examples"], values: [8, 12] };
  record.widgets = [poll];
  await setup(page, [record]);
  const card = page.getByRole("article", { name: poll.title });
  const stepper = card.getByRole("group", { name: poll.items[0] });
  const minus = stepper.getByRole("button", { name: "Subtract from Test a prediction" });
  const plus = stepper.getByRole("button", { name: "Add to Test a prediction" });
  for (const width of [1200, 390]) {
    await page.setViewportSize({ width, height: 850 });
    const left = await minus.boundingBox();
    const right = await plus.boundingBox();
    expect(left!.height).toBeGreaterThanOrEqual(44);
    expect(left!.width).toBe(right!.width);
    expect(left!.y).toBe(right!.y);
    await expect(card.getByText("20 votes cast")).toBeVisible();
  }
  await plus.click();
  await expect(card.getByText("21 votes cast")).toBeVisible();
  await minus.click();
  await card.getByRole("button", { name: "Reset votes" }).click();
  await card.getByRole("button", { name: "Cancel" }).click();
  await expect(card.getByText("20 votes cast")).toBeVisible();
  await card.getByRole("button", { name: "Reset votes" }).click();
  await card.getByRole("button", { name: "Reset all" }).click();
  await expect(card.getByText("0 votes cast")).toBeVisible();
  await expect(minus).toBeDisabled();
});

test("reorders mobile tools through explicit menu actions and persists their order", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await setup(page);
  const titles = () => page.locator(".hb-canvas > .hb-widget > header h2").allTextContents();
  const before = await titles();
  expect(before.length).toBeGreaterThan(1);
  await expect(page.getByRole("button", { name: `Move ${before[0]}`, exact: true })).toBeHidden();
  await page.getByRole("button", { name: `Options for ${before[0]}`, exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "Move up", exact: true })).toBeDisabled();
  await page.getByRole("menuitem", { name: "Move down", exact: true }).click();
  const reordered = [before[1], before[0], ...before.slice(2)];
  await expect.poll(titles).toEqual(reordered);
  await expect.poll(() => state.records[0].widgets.toSorted((a, b) => a.y - b.y || a.x - b.x).map((widget) => widget.title)).toEqual(reordered);
  await page.reload();
  await expect.poll(titles).toEqual(reordered);
  expect(state.errors).toEqual([]);
});

test("shows the entire month, keeps drawings proportional and renders both PDF pages", async ({
  page,
}) => {
  const record = initial();
  record.widgets = [];
  for (const kind of ["calendar", "draw", "pdf"] as const) {
    const tool = makeWidget(kind, record.widgets);
    if (kind === "pdf") tool.url = "https://classroom.example/worksheet.pdf";
    record.widgets.push(tool);
  }
  await page.route("https://classroom.example/worksheet.pdf", (route) =>
    route.fulfill({
      path: fileURLToPath(
        new URL("./fixtures/homebase-pages.pdf", import.meta.url),
      ),
      headers: {
        "content-type": "application/pdf",
        "access-control-allow-origin": "*",
      },
    }),
  );
  await page.clock.setFixedTime(new Date(2026, 7, 31, 10));
  await setup(page, [record]);
  const pdf = page.getByRole("article", { name: "PDF", exact: true });
  await pdf.getByRole("button", { name: "Load PDF" }).click();
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const calendar = page.getByRole("article", { name: "Date", exact: true });
    await expect(calendar.locator('[aria-current="date"]')).toHaveText("31");
    expect(
      await calendar
        .locator(".hb-widget-content")
        .evaluate((el) => el.scrollHeight - el.clientHeight),
    ).toBeLessThanOrEqual(1);
    const box = await page
      .getByRole("img", { name: /Drawing board/ })
      .boundingBox();
    expect(box!.width / box!.height).toBeCloseTo(5 / 3, 2);
    await pdf.getByRole("button", { name: "Next page" }).click();
    await expect(pdf.getByRole("img", { name: "PDF, page 2" })).toBeVisible();
    await pdf.getByRole("button", { name: "Previous page" }).click();
    await expect(pdf.getByRole("img", { name: "PDF, page 1" })).toBeVisible();
  }
});

test("dice and traffic lights grow with the panel and respect reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const dice = { ...makeWidget("dice"), number: 6 };
  const signal = { ...makeWidget("traffic"), y: 9 };
  await setup(page, [{ ...initial(), widgets: [dice, signal] }]);
  const roll = page.getByRole("button", { name: "Roll dice", exact: true });
  const face = page.locator(".hb-dice [role=img]").first();
  await roll.click();
  await expect(page.locator(".hb-dice [role=img]")).toHaveCount(6);
  const firstFace = await face.elementHandle();
  await roll.click();
  expect(await firstFace!.evaluate(element => element.isConnected)).toBe(false);
  await expect(face).toHaveCSS("animation-name", "hb-roll");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(face).toHaveCSS("animation-name", "none");
  for (const [widget, target] of [[dice, face], [signal, page.locator(".hb-light").first()]] as const) {
    const before = (await target.boundingBox())!.width;
    const resize = page.getByRole("button", { name: `Resize ${widget.title}`, exact: true });
    await resize.press("ArrowRight");
    await resize.press("ArrowRight");
    await resize.press("ArrowDown");
    await resize.press("ArrowDown");
    await expect.poll(async () => (await target.boundingBox())!.width).toBeGreaterThan(before * 1.2);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const element of await page.locator(".hb-dice [role=img], .hb-light").all()) {
    const bounds = (await element.boundingBox())!;
    expect(bounds.width).toBeGreaterThan(35);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  }
});

test("writes formatted board text and creates a scannable classroom link", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const note = makeWidget("note");
  const qr = makeWidget("qr", [note]);
  const state = await setup(page, [{ ...initial(), widgets: [note, qr] }]);
  await edit(page, note.title);
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Font", { exact: true }).selectOption("serif");
  const text = dialog.getByRole("textbox", { name: "Text", exact: true });
  await text.fill("Bring your sketchbook");
  await text.press("ControlOrMeta+a");
  await dialog.getByRole("button", { name: "Bold", exact: true }).click();
  await apply(page);
  const formatted = page.locator('.hb-note [data-hb-font="serif"] .boardwork-inline-bold');
  await expect(formatted).toHaveText("Bring your sketchbook");
  await edit(page, qr.title);
  const url = "https://example.org/classroom?group=2";
  await dialog.getByLabel("Resource link").fill(url);
  await apply(page);
  await expect.poll(() => state.records[0].widgets[1].url).toBe(url);
  await page.reload();
  const code = page.getByRole("article", { name: qr.title, exact: true });
  await expect(code.getByRole("img", { name: "Scan to open example.org" })).toBeVisible();
  await expect(code.getByRole("link")).toHaveAttribute("href", url);
  await expect(formatted).toHaveText("Bring your sketchbook");
  expect(state.errors).toEqual([]);
});

test("picks a local photo, reopens it on mobile, and can switch back to a link", async ({ page }) => {
  const image = { ...makeWidget("image"), text: "Classroom board", url: "https://example.org/board.jpg" };
  const state = await setup(page, [{ ...initial(), widgets: [image] }]);
  const filePath = fileURLToPath(new URL("../../public/images/landing/product/homebase.png", import.meta.url));
  await edit(page, image.title);
  const picker = page.getByLabel("Choose photo", { exact: true });
  await picker.setInputFiles({ name: "damaged.jpg", mimeType: "image/jpeg", buffer: Buffer.from("invalid") });
  await expect(page.getByRole("alert")).toContainText("couldn’t be opened");
  await expect(page.getByLabel("Resource link")).toHaveValue(image.url);
  await picker.setInputFiles(filePath);
  await expect(page.getByAltText("Selected photo preview")).toBeVisible();
  await apply(page);
  await expect.poll(() => state.records[0].widgets[0].photo?.startsWith("data:image/jpeg;base64,")).toBe(true);
  expect(state.records[0].widgets[0].url).toBe("");
  const photo = page.getByAltText("Classroom board", { exact: true });
  await expect.poll(() => photo.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(photo).toBeVisible();
  await edit(page, image.title);
  await page.getByLabel("Replace photo").setInputFiles(filePath);
  await expect(page.getByRole("button", { name: "Remove photo" })).toBeEnabled();
  await page.getByRole("button", { name: "Remove photo" }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(photo).toBeVisible();
  await edit(page, image.title);
  await page.getByRole("button", { name: "Remove photo" }).click();
  await page.getByLabel("Resource link").fill(image.url);
  await apply(page);
  await expect.poll(() => state.records[0].widgets[0].url).toBe(image.url);
  expect(state.records[0].widgets[0].photo).toBeUndefined();
  await expect(page.getByRole("button", { name: "Load image" })).toBeVisible();
});

test("projects the bridge lesson, times stages, and adapts an independent class copy", async ({ page }) => {
  const state = await setup(page);
  await page.clock.install();
  await page.goto("/warmups/paper-bridges.html");
  await expect(page.getByRole("heading", {name:"Which bridge will hold more coins?"})).toBeVisible();
  await page.getByRole("button",{name:"Project warm-up"}).click();
  await page.getByRole("button",{name:"Start", exact:true}).click();
  await page.getByRole("button",{name:"Pause"}).click();
  await page.getByRole("button",{name:"1 min"}).click();
  await expect(page.getByRole("timer")).toHaveText(/0[23]:/);
  await page.getByRole("button",{name:"Start",exact:true}).click();
  await page.clock.fastForward(181000);
  await expect(page.getByRole("timer")).toHaveText("00:00");
  await expect(page.getByRole("status")).toContainText("Time’s up");
  await page.getByRole("button",{name:"Next stage"}).click();
  await page.reload();
  await expect(page.getByRole("heading",{name:"Compare reasons with a partner"})).toBeVisible();
  await page.getByRole("link",{name:"Adapt for my class"}).click();
  await page.getByLabel("Destination class").selectOption(classId);
  await page.getByRole("button",{name:"Create class copy"}).click();
  const board = page.getByRole("article",{name:"Five-minute routine"});
  await expect(board.getByRole("timer")).toHaveText("02:00");
  await board.getByRole("button",{name:"Next stage"}).click();
  await page.getByRole("button",{name:"Use for another class"}).click();
  await page.getByLabel("Destination class").selectOption(secondClassId);
  await page.getByLabel("Board name",{exact:true}).fill("Period two bridges");
  await page.getByRole("button",{name:"Create class copy"}).click();
  await expect(page.getByLabel("Homebase name")).toHaveValue("Period two bridges");
  await expect(board.getByRole("heading",{name:"Sketch your prediction"})).toBeVisible();
  await page.getByRole("button",{name:"Add Timer",exact:true}).click();
  await expect(page.getByRole("article",{name:"Timer",exact:true}).getByRole("button",{name:"Start",exact:true})).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await edit(page,"Five-minute routine");
  await page.getByLabel("Minutes for stage 1").fill("3");
  await apply(page);
  await expect(board.getByRole("timer")).toHaveText("03:00");
  const original = state.records.find(record=>record.name==="Paper bridge warm-up");
  expect(original?.widgets.find(w=>w.kind==="agenda")?.stages?.[0].minutes).toBe(2);
  expect(state.errors).toEqual([]);
});
