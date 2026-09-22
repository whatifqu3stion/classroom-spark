import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";

export const thinkingPromptTask =
  "Choose one object you can see in the classroom. Record three specific details about its shape, materials, or use. Then infer one user need or problem the object suggests.";

export const thinkingPrompts = [
  "What do you notice exactly?",
  "What might the user need or find difficult?",
  "What evidence supports your idea?",
];

type FixtureOptions = {
  marked?: boolean;
  noPrompts?: boolean;
  wrapped?: boolean;
  visual?: boolean;
};

export async function createThinkingPromptSpacingFixture({
  marked = true,
  noPrompts = false,
  wrapped = false,
  visual = true,
}: FixtureOptions = {}) {
  const svg = await readFile(
    new URL("./thinking-prompt-square.svg", import.meta.url),
    "utf8",
  );
  const prompts = noPrompts
    ? []
    : wrapped
      ? [
          thinkingPrompts[0],
          thinkingPrompts[1],
          `${thinkingPrompts[2]} Cite the object's shape, materials, and classroom use so another observer can follow your reasoning.`,
        ]
      : thinkingPrompts;
  const activity = {
    id: "task-223-thinking-prompt-spacing",
    classId: "synthetic-class",
    title: "Observe & Notice",
    eyebrow: "Observe & Notice",
    task: thinkingPromptTask,
    prompts,
    durationMinutes: 5,
    deviceMode: "off",
    technologyMode: "no_computer",
    materials: [],
    favorite: false,
    presentationTheme: {
      kind: "curated" as const,
      themeId: "charcoal-v2" as const,
      accentId: "plum",
    },
    ...(visual
      ? {
          visualUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
        }
      : {}),
    ...(marked
      ? {
          contentFormatting: {
            version: 1 as const,
            task: [
              { text: "Choose one " },
              { text: "object", highlight: true },
              { text: thinkingPromptTask.slice("Choose one object".length) },
            ],
            prompts: prompts.map((prompt, index) =>
              index === 0
                ? [
                    { text: "What", bold: true },
                    { text: " " },
                    { text: "do you", highlight: true },
                    { text: prompt.slice("What do you".length) },
                  ]
                : [{ text: prompt }],
            ),
          },
        }
      : {}),
  };

  return {
    activity,
    state: {
      activeClassId: "synthetic-class",
      classes: [{
        id: "synthetic-class",
        name: "Synthetic geometry",
        grade: "5",
        subject: "Design",
        color: "#73506d",
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

export async function installThinkingPromptSpacingFixture(
  page: Page,
  options?: FixtureOptions,
) {
  const fixture = await createThinkingPromptSpacingFixture(options);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/**", (route) => {
    if (!["GET", "HEAD"].includes(route.request().method())) {
      return route.abort();
    }
    const path = new URL(route.request().url()).pathname;
    const json = path.endsWith("/app-state")
      ? fixture.state
      : path.endsWith("/auth/status")
        ? { authenticated: true, authEnabled: false }
        : { items: [], categories: [] };
    return route.fulfill({ json });
  });
  return fixture;
}