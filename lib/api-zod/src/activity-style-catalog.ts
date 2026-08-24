export const activityStyleCatalog = [
  {
    value: "Auto",
    label: "Auto",
    category: "auto",
    categoryLabel: "Let Boardwork choose",
    description: "Let Boardwork choose a fitting way to start.",
    generationGuidance:
      "Choose the activity approach that best fits the class and today's request.",
  },
  {
    value: "Curiosity Hook",
    label: "Curiosity Hook",
    category: "think",
    categoryLabel: "Get students thinking",
    description: "Start with an intriguing question or puzzle.",
    generationGuidance:
      "Open with a specific, inviting question or small puzzle that makes students want to investigate.",
  },
  {
    value: "Retrieval Practice",
    label: "Retrieval Practice",
    category: "think",
    categoryLabel: "Get students thinking",
    description: "Bring back something students already learned.",
    generationGuidance:
      "Ask students to recall and use relevant prior knowledge without providing the answer first.",
  },
  {
    value: "Explain / Reason",
    label: "Explain / Reason",
    category: "think",
    categoryLabel: "Get students thinking",
    description: "Explain an idea and support it with reasoning.",
    generationGuidance:
      "Ask for a concise explanation that connects a claim to evidence, observations, or logical steps.",
  },
  {
    value: "Observe & Notice",
    label: "Observe & Notice",
    category: "notice",
    categoryLabel: "Look closely",
    description: "Look closely and record what stands out.",
    generationGuidance:
      "Use a provided subject, image, text, or phenomenon and ask students to notice specific details before interpreting them.",
  },
  {
    value: "Draw / Sketch",
    label: "Draw / Sketch",
    category: "make",
    categoryLabel: "Make something",
    description: "Show thinking with a quick labeled sketch.",
    generationGuidance:
      "Make a concise sketch or visual model central to the task, with labels or arrows when they clarify thinking.",
  },
  {
    value: "Predict",
    label: "Predict",
    category: "think",
    categoryLabel: "Get students thinking",
    description: "Make a claim about what might happen next.",
    generationGuidance:
      "Ask students to make a plausible prediction and briefly explain what led them to it.",
  },
  {
    value: "Compare / Contrast",
    label: "Compare / Contrast",
    category: "think",
    categoryLabel: "Get students thinking",
    description: "Spot meaningful similarities and differences.",
    generationGuidance:
      "Ask students to compare two relevant examples, ideas, or representations and identify meaningful similarities and differences.",
  },
  {
    value: "Evaluate / Critique",
    label: "Evaluate / Critique",
    category: "think",
    categoryLabel: "Get students thinking",
    description: "Judge an idea using clear evidence or criteria.",
    generationGuidance:
      "Ask students to assess an idea, response, or example using explicit evidence or a simple criterion.",
  },
  {
    value: "Quick Write",
    label: "Quick Write",
    category: "make",
    categoryLabel: "Make something",
    description: "Put an initial idea into a short written response.",
    generationGuidance:
      "Ask for a focused, short written response that helps students put their thinking into words.",
  },
  {
    value: "Apply",
    label: "Apply",
    category: "make",
    categoryLabel: "Make something",
    description: "Use the idea in a new example or situation.",
    generationGuidance:
      "Ask students to use the target idea or skill in a fresh but approachable example or situation.",
  },
  {
    value: "Reflect",
    label: "Reflect",
    category: "think",
    categoryLabel: "Get students thinking",
    description: "Consider what you understand and what remains unclear.",
    generationGuidance:
      "Ask students to briefly identify a takeaway, a change in thinking, or a remaining question.",
  },
] as const;

export type ActivityStyleValue = (typeof activityStyleCatalog)[number]["value"];
export type GeneratedActivityStyle = Exclude<ActivityStyleValue, "Auto">;

// Keep Auto as a UI-only choice. Generated output stores the concrete approach
// selected by the model, preserving the existing null request behavior.
export const generatedActivityStyleValues = activityStyleCatalog
  .filter((style) => style.value !== "Auto")
  .map((style) => style.value) as [
  GeneratedActivityStyle,
  ...GeneratedActivityStyle[],
];

export function getActivityStyleGuidance(
  style: GeneratedActivityStyle | null | undefined,
): string | null {
  if (!style) return null;
  return (
    activityStyleCatalog.find((entry) => entry.value === style)
      ?.generationGuidance ?? null
  );
}