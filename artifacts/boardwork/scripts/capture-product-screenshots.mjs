/**
 * Capture the actual UI with explicitly illustrative, prewritten classroom data.
 * Run against a local frontend; no backend, API key or paid AI call is involved.
 *
 * node scripts/capture-product-screenshots.mjs http://127.0.0.1:5173 /tmp/boardwork-product
 * Optional: PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH for an already installed Chromium.
 * Outputs PNG originals and a capture manifest; no UI is painted into images.
 * Pass --expanded-only to capture routines, participation, and saved guidance.
 */
import { chromium } from "@playwright/test";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const origin = new URL(process.argv[2] ?? "http://127.0.0.1:5173");
assert(
  ["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname),
  "Capture only from a local frontend",
);
const output = process.argv[3] ?? path.join(os.tmpdir(), "boardwork-product");
await mkdir(output, { recursive: true });
const server = process.argv.includes("--start-server")
  ? spawn(
      process.execPath,
      [
        "node_modules/vite/bin/vite.js",
        "--config",
        "vite.config.ts",
        "--host",
        "127.0.0.1",
        "--port",
        origin.port || "5173",
      ],
      { cwd: fileURLToPath(new URL("..", import.meta.url)), stdio: "ignore" },
    )
  : undefined;
if (server) {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(origin)).ok) {
        ready = true;
        break;
      }
    } catch {
      /* The local dev server is starting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) {
    server.kill();
    throw new Error("Local frontend did not start");
  }
}
const stamp = "2026-10-20T12:00:00.000Z";
const classes = [
  {
    id: "sample-science",
    name: "Grade 6 Science",
    grade: "6",
    subject: "Science",
    color: "#7b6ca7",
    defaultDuration: 7,
    defaultDeviceMode: "off",
    arrivalRoutine: "Open your notebook. Work independently.",
    generalContext:
      "Use clear examples and ask students to explain their thinking.",
    createdAt: stamp,
    updatedAt: stamp,
  },
  {
    id: "sample-design",
    name: "Grade 7 Design",
    grade: "7",
    subject: "Design",
    color: "#638577",
    defaultDuration: 5,
    defaultDeviceMode: "off",
    arrivalRoutine: "Sketchbook open. Pencil ready.",
    createdAt: stamp,
    updatedAt: stamp,
  },
  {
    id: "sample-language",
    name: "Grade 7 Language",
    grade: "7",
    subject: "Language",
    color: "#b77d61",
    defaultDuration: 5,
    defaultDeviceMode: "off",
    arrivalRoutine: "Open your notebook. Begin on your own.",
    createdAt: stamp,
    updatedAt: stamp,
  },
];
const makeBoard = (id, classId, task, prompts, extra = {}) => ({
  id,
  classId,
  title: "",
  eyebrow: "Start here",
  task,
  prompts,
  durationMinutes: 7,
  deviceMode: "off",
  technologyMode: "no_computer",
  arrivalInstructions: classes.find((item) => item.id === classId)
    .arrivalRoutine,
  resourceUrl: null,
  resourceNote: null,
  visuals: [],
  visualUrl: null,
  visualDescription: null,
  materials: ["Notebook", "Pencil"],
  teacherNote: null,
  sourceTopic: "Cells and systems",
  sourceGoal: null,
  sourceChipIds: [],
  style: "Auto",
  favorite: false,
  presentationTheme: { kind: "curated", themeId: "paper", accentId: "sage" },
  createdAt: stamp,
  updatedAt: stamp,
  ...extra,
});
const state = {
  activeClassId: "sample-science",
  classes,
  chips: [],
  instructionalContexts: [],
  units: [
    {
      id: "sample-unit",
      name: "Cells & systems",
      conceptsTopics: "Cells, osmosis and diffusion",
      skills: "Predict, sketch and explain",
      standardsObjectives: "",
      createdAt: stamp,
      updatedAt: stamp,
    },
  ],
  activities: [
    makeBoard(
      "sample-osmosis",
      "sample-science",
      "Sketch a cell in fresh water and a cell in very salty water. Predict how each one changes.",
      [
        "Show the direction water moves.",
        "Use osmosis to explain your prediction.",
      ],
      { favorite: true },
    ),
    makeBoard(
      "sample-toy",
      "sample-design",
      "Sketch two ways to make a cardboard toy easier for a younger child to use.",
      [
        "Circle the change that matters most.",
        "Explain how it helps your user.",
      ],
      {
        favorite: true,
        durationMinutes: 5,
        materials: ["Sketchbook", "Pencil"],
        updatedAt: "2026-10-19T12:00:00.000Z",
      },
    ),
    makeBoard(
      "sample-voice",
      "sample-language",
      "Describe a rainy morning in three sentences. Make it feel hopeful without using the word happy.",
      [
        "Choose one detail your reader can hear.",
        "Underline the word that does the most work.",
      ],
      { durationMinutes: 5, updatedAt: "2026-10-18T12:00:00.000Z" },
    ),
  ],
};
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
});
const names = ["Alex", "Sam", "Morgan", "Robin", "Casey", "Jordan"];
const widget = (kind, title, x, y, w, h, extra = {}) => ({
  id: randomUUID(), kind, title, x, y, w, h, tone: "paper", ...extra,
});
const homebases = [
  {
    id: randomUUID(), classId: null, name: "Ready for independent work", tone: "sage", revision: 1, updatedAt: stamp,
    widgets: [
      widget("note", "Start here", 0, 0, 5, 4, { tone: "butter", text: "Sketch your prediction.\nExplain it using one observation.\nBe ready to compare with a partner." }),
      widget("timer", "Time to think", 5, 0, 4, 4, { tone: "lavender", minutes: 7 }),
      widget("agenda", "Our next steps", 9, 0, 3, 4, { items: ["Think on your own", "Compare with a partner", "Share one idea"], values: [1, 0, 0] }),
    ],
  },
  {
    id: randomUUID(), classId: null, name: "Make room for more voices", tone: "paper", revision: 1, updatedAt: stamp,
    widgets: [
      widget("randomizer", "Who will share next?", 0, 0, 4, 4, { items: names, tone: "butter" }),
      widget("groups", "New partners, new ideas", 4, 0, 4, 4, { items: names, number: 2, tone: "sage" }),
      widget("poll", "What should we explore?", 8, 0, 4, 4, { items: ["Test a prediction", "Compare examples"], values: [8, 12] }),
    ],
  },
];
const contexts = [
  ["Explain with evidence", "Ask learners to connect a claim to one observation or example.", "Thinking routines"],
  ["Think, pair, share", "Give quiet thinking time before partners compare and share an idea.", "Thinking routines"],
  ["Make the first step clear", "Start with one concrete action. Keep instructions short and direct.", "Clear instructions"],
].map(([label, details, categoryName], index) => ({
  id: `sample-context-${index}`, label, details, categoryName, categoryId: `category-${categoryName}`,
  scope: "global", classId: null, archived: false, lastUsedAt: null, createdAt: stamp, updatedAt: stamp,
}));
const captures = [];
const errors = [];
let blockedRequests = 0;
async function newPage(width, height) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin.origin) {
      blockedRequests++;
      return route.abort("blockedbyclient");
    }
    if (!url.pathname.startsWith("/api/")) return route.continue();
    if (url.pathname === "/api/auth/status")
      return route.fulfill({ json: { passwordRequired: false, authenticated: true } });
    if (url.pathname === "/api/homebases")
      return route.fulfill({ json: homebases });
    if (url.pathname === "/api/app-state")
      return route.fulfill({ json: state });
    if (url.pathname === "/api/saved-context")
      return route.fulfill({ json: { items: contexts, categories: [] } });
    if (url.pathname.includes("/curriculum"))
      return route.fulfill({
        json: { ready: false, reason: "setup_required", items: [] },
      });
    const board = state.activities.find(
      (item) => url.pathname === `/api/activities/${item.id}`,
    );
    if (board && request.method() === "GET")
      return route.fulfill({ json: board });
    throw new Error(
      `Unexpected API request during screenshot capture: ${request.method()} ${url.pathname}`,
    );
  });
  return page;
}
async function capture(page, name, locator = page, options = {}) {
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await locator.screenshot({
    path: path.join(output, `${name}.png`),
    animations: "disabled",
    ...options,
  });
  captures.push({
    file: `${name}.png`,
    source: `${name}.png`,
    route: new URL(page.url()).pathname,
    viewport: page.viewportSize(),
    deviceScaleFactor: 2,
    element:
      locator === page ? "viewport" : await locator.getAttribute("data-testid"),
    data: "Prewritten illustrative classroom fixtures; no student records or API credentials",
    createdAt: new Date().toISOString(),
  });
}
async function captureTools(page, name) {
  const canvas = await page.getByTestId("homebase-canvas").boundingBox();
  const tools = await page.getByTestId("homebase-canvas").getByRole("article").all();
  const bounds = await Promise.all(tools.map(tool => tool.boundingBox()));
  const bottom = Math.max(...bounds.map(box => box.y + box.height));
  await capture(page, name, page, { clip: { ...canvas, height: bottom - canvas.y + 16 } });
}
try {
  if (!process.argv.includes("--expanded-only")) {
  const desktop = await newPage(1280, 960);
  await desktop.goto(new URL("/activity/sample-osmosis", origin).href);
  await desktop.getByTestId("board-editor").waitFor();
  await desktop
    .getByTestId("input-topic")
    .fill("Osmosis: explain how water moves across a cell membrane.");
  await desktop.getByTestId("select-unit").click();
  await desktop
    .getByRole("option", { name: "Cells & systems", exact: true })
    .click();
  await desktop.getByTestId("input-topic").blur();
  await capture(desktop, "workspace");
  await capture(desktop, "setup", desktop.getByTestId("creation-controls"));

  await desktop.setViewportSize({ width: 1280, height: 800 });
  await desktop.goto(new URL("/present/sample-osmosis", origin).href);
  await desktop.getByTestId("presentation-surface").waitFor();
  await capture(desktop, "present");
  await desktop.goto(new URL("/history", origin).href);
  await desktop.getByTestId("history-item-sample-osmosis").waitFor();
  await capture(desktop, "history");
  await desktop.close();

  const mobile = await newPage(390, 844);
  await mobile.goto(new URL("/activity/sample-osmosis", origin).href);
  await mobile.getByTestId("board-editor").waitFor();
  await capture(
    mobile,
    "workspace-mobile",
    mobile.getByTestId("editor-workspace-panel"),
  );
  await mobile.goto(new URL("/present/sample-osmosis", origin).href);
  await mobile.getByTestId("presentation-surface").waitFor();
  await capture(mobile, "present-mobile");
  await mobile.goto(new URL("/history", origin).href);
  await mobile.getByTestId("history-item-sample-osmosis").waitFor();
  await capture(mobile, "history-mobile");
  await mobile.close();
  }
  const expanded = await newPage(1200, 850);
  await expanded.goto(new URL("/homebase", origin).href);
  await expanded.getByTestId("homebase-canvas").waitFor();
  await captureTools(expanded, "lesson-routines");
  await expanded.getByLabel("Saved homebase", { exact: true }).selectOption(homebases[1].id);
  await expanded.getByRole("button", { name: "Pick a name", exact: true }).click();
  await expanded.getByRole("button", { name: "Make groups", exact: true }).click();
  await captureTools(expanded, "participation");
  await expanded.setViewportSize({ width: 390, height: 844 });
  await capture(expanded, "participation-mobile", expanded.getByRole("article", { name: "New partners, new ideas", exact: true }));
  await expanded.getByLabel("Saved homebase", { exact: true }).selectOption(homebases[0].id);
  await capture(expanded, "lesson-routines-mobile", expanded.getByRole("article", { name: "Time to think", exact: true }));
  await expanded.setViewportSize({ width: 1200, height: 850 });
  await expanded.goto(new URL("/app", origin).href);
  await expanded.getByTestId("button-add-context-empty").click();
  await expanded.getByTestId("context-row-sample-context-0").waitFor();
  await capture(expanded, "teaching-context", expanded.getByRole("dialog"));
  await expanded.close();
  assert.deepEqual(errors, []);
  assert.equal(
    blockedRequests,
    0,
    "The app should not attempt external requests",
  );
  await writeFile(
    path.join(output, "captures.json"),
    JSON.stringify({ captures, errors, blockedRequests }, null, 2) + "\n",
  );
  console.log(
    `Captured ${captures.length} actual UI views using sample data in ${output}`,
  );
} finally {
  await browser.close();
  server?.kill();
}
