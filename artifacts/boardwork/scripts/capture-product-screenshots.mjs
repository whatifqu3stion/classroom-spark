/**
 * Capture the actual UI with explicitly illustrative, prewritten classroom data.
 * Run against a local frontend; no backend, API key or paid AI call is involved.
 *
 * node scripts/capture-product-screenshots.mjs http://127.0.0.1:5173 /tmp/boardwork-product
 * Optional: PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH for an already installed Chromium.
 * Outputs PNG originals and a capture manifest. Shipping WebPs are encoded from
 * these originals (Pillow: lossless=True, method=6); no UI is painted into images.
 */
import { chromium } from "@playwright/test";
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
    if (url.pathname === "/api/app-state")
      return route.fulfill({ json: state });
    if (url.pathname === "/api/saved-context")
      return route.fulfill({ json: { items: [], categories: [] } });
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
async function capture(page, name, locator = page) {
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(0, 0);
  await locator.screenshot({
    path: path.join(output, `${name}.png`),
    animations: "disabled",
  });
  captures.push({
    file: `${name}.webp`,
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
try {
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
