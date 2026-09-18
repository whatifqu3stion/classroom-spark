import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";

const activityId = "reading-capacity-design-critique";

export async function createReadingCapacityFixture(
  withVisual: boolean,
  themeId: "charcoal-v2" | "paper-v2" = "charcoal-v2",
) {
  const reconstructedImage = await readFile(
    new URL("./design-critique-lock-reconstruction.png", import.meta.url),
  );
  const visualUrl = `data:image/png;base64,${reconstructedImage.toString("base64")}`;
  const task = "Choose one classroom object. In your notebook, evaluate it and propose one improvement.";
  const prompts = [
    "What does the object do well?",
    "What problem or frustration might a user have?",
    "What one change would improve it, and why?",
  ];
  const activity = {
    id: activityId,
    classId: "reading-capacity-class",
    title: "Design Critique",
    eyebrow: "Design Critique",
    task,
    prompts,
    durationMinutes: 5,
    deviceMode: "off",
    technologyMode: "no_computer",
    materials: [],
    favorite: false,
    presentationTheme: {
      kind: "curated",
      themeId,
      accentId: themeId === "charcoal-v2" ? "plum" : "blue",
    },
    contentFormatting: {
      version: 1,
      task: [
        { text: "Choose", bold: true },
        { text: task.slice("Choose".length) },
      ],
      prompts: [
        [
          { text: "What " },
          { text: "does", highlight: true },
          { text: " the object do well?" },
        ],
        [
          { text: "What problem or " },
          { text: "frustration", underline: true },
          { text: " might a user have?" },
        ],
        [{ text: prompts[2] }],
      ],
    },
    ...(withVisual
      ? {
          visualUrl,
        }
      : {}),
  };
  return {
    activityId,
    activity,
    state: {
      activeClassId: "reading-capacity-class",
      classes: [{
        id: "reading-capacity-class",
        name: "Design",
        grade: "5",
        subject: "Design",
        color: "#A855F7",
        defaultDuration: 5,
        defaultDeviceMode: "off",
        arrivalRoutine: null,
      }],
      units: [],
      chips: [],
      instructionalContexts: [],
      activities: [activity],
    },
  };
}

export async function installReadingCapacityFixture(
  page: Page,
  withVisual: boolean,
  themeId: "charcoal-v2" | "paper-v2" = "charcoal-v2",
) {
  const fixture = await createReadingCapacityFixture(withVisual, themeId);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!["GET", "HEAD"].includes(route.request().method())) return route.abort();
    const json = path.endsWith("/app-state")
      ? fixture.state
      : path.endsWith("/auth/status")
        ? { authenticated: true, authEnabled: false }
        : { items: [], categories: [] };
    return route.fulfill({ json });
  });
  return fixture;
}