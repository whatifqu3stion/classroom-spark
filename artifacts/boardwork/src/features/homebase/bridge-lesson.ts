import bridgePhoto from "@/assets/paper-bridges.jpg?inline";
import { makeWidget } from "./catalog";
import type { HomebaseContent } from "@workspace/api-zod";

export const bridgeLesson = {
  name: "Paper bridge warm-up",
  question: "Which bridge will hold more coins?",
  prompt:
    "Both bridges use one sheet of paper. Sketch your prediction and label the feature that makes you think so.",
  photo: bridgePhoto,
  alt: "A flat paper deck and an accordion-folded paper deck each span two wooden blocks.",
  stages: [
    { label: "Sketch your prediction", minutes: 2 },
    { label: "Compare reasons with a partner", minutes: 2 },
    { label: "Share one testable idea", minutes: 1 },
  ],
};

export function bridgeBoard(): HomebaseContent {
  return {
    name: bridgeLesson.name,
    tone: "paper",
    widgets: [
      {
        ...makeWidget("task"),
        title: "Make a prediction",
        text: bridgeLesson.question,
        items: [bridgeLesson.prompt],
        w: 6,
        h: 4,
        tone: "butter",
      },
      {
        ...makeWidget("image"),
        title: "Compare the decks",
        text: bridgeLesson.alt,
        photo: bridgePhoto,
        x: 6,
        w: 6,
        h: 8,
      },
      {
        ...makeWidget("agenda"),
        title: "Five-minute routine",
        items: bridgeLesson.stages.map((s) => s.label),
        mode: "timed",
        stages: bridgeLesson.stages,
        y: 4,
        w: 6,
        h: 4,
        tone: "sage",
      },
    ],
  };
}
