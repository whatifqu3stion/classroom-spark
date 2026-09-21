import { createHash } from "node:crypto";
import type { BoardworkGenerationContext } from "./types";
import type { CurriculumSnapshot } from "@workspace/db";

/** Immutable teacher-facing basis; never an assessment-compliance claim. */
export type CurriculumPlan = CurriculumSnapshot;

export interface PlanningSource {
  id: string;
  classId?: string;
  unitId: string | null;
  version: number;
  status: string;
  title: string;
  kind: "manual" | "pdf" | "web";
  subject: string;
  framework?: string | null;
  programmeYear: string | null;
  publisher: string | null;
  url: string | null;
  retrievedAt: string | Date | null;
  objectives: Array<{ id: string; label: string; excerpt: string; locator: string; selected: boolean }>;
}

const approaches = [
  { thinkingTask: "Observe specific details and infer what they suggest", responseMode: "a short observation and explanation" },
  { thinkingTask: "Compare alternatives and justify a choice", responseMode: "a small comparison with a reasoned choice" },
  { thinkingTask: "Represent an idea visually and explain a relationship", responseMode: "a simple annotated sketch" },
  { thinkingTask: "Predict an outcome and explain the reasoning", responseMode: "a prediction with supporting reasons" },
  { thinkingTask: "Critique a possible solution and propose an improvement", responseMode: "a proposed change with a justification" },
  { thinkingTask: "Plan how to test a claim or solution fairly", responseMode: "a brief test plan or checklist" },
] as const;

const contexts = [
  "an everyday situation familiar to this age group",
  "a hypothetical problem in a shared space",
  "a simple example involving a familiar tool or process",
  "a change to an everyday routine",
  "a small decision with two competing needs",
  "a communication or accessibility challenge appropriate to this subject",
] as const;

const normalize = (value: string | null | undefined) =>
  (value ?? "").normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

const words = (value: string) => new Set(normalize(value).split(" ").filter(word => word.length > 3));
function overlap(a: string, b: string): number {
  const left = words(a), right = words(b);
  return [...left].filter(word => right.has(word)).length;
}

export function applicablePlanningSources(
  sources: PlanningSource[],
  profile: BoardworkGenerationContext["classProfile"],
  unitId?: string | null,
): PlanningSource[] {
  const subject = normalize(profile.subject);
  const framework = normalize(profile.curriculumFramework);
  const year = normalize(profile.programmeYear).replace(/^(?:myp )?(?:year )?/, "");
  const eligible = sources.filter(source => {
    if (source.status !== "approved" || (source.unitId && source.unitId !== unitId)) return false;
    const sourceSubject = normalize(source.subject);
    // Exact normalized subject avoids silently treating different courses as interchangeable.
    if (sourceSubject !== subject) return false;
    if (source.framework && normalize(source.framework) !== framework) return false;
    const sourceYear = normalize(source.programmeYear).replace(/^(?:myp )?(?:year )?/, "");
    if (sourceYear && (!year || sourceYear !== year)) return false;
    return source.objectives.some(objective => objective.selected);
  });
  const unitSources = eligible.filter(source => source.unitId === unitId && !!unitId);
  return unitSources.length ? unitSources : eligible.filter(source => !source.unitId);
}

/** Choose a focus before writing prose; approved excerpts remain source evidence, not instructions. */
export function planCurriculumActivity(
  context: BoardworkGenerationContext,
  sources: PlanningSource[],
): CurriculumPlan {
  const recent = context.recentActivities.slice(0, 20);
  const explicitFocus = [context.today.topic, context.today.goal].filter(Boolean).join(" ");
  const savedFocus = context.today.savedContext?.map(item => `${item.label} ${item.details ?? ""}`).join(" ") ?? "";
  const priorityFocus = explicitFocus || savedFocus;
  let candidates = applicablePlanningSources(sources, context.classProfile, context.today.unitId)
    .flatMap(source => source.objectives.filter(objective => objective.selected)
      .map(objective => ({ source, objective })));
  // Conservative matching: don't claim a source basis when a higher-priority request is unrelated.
  if (priorityFocus) {
    candidates = candidates.filter(({ objective }) => overlap(priorityFocus, `${objective.label} ${objective.excerpt}`) > 0);
  }
  candidates.sort((a, b) => {
    if (priorityFocus) {
      const relevance = overlap(priorityFocus, `${b.objective.label} ${b.objective.excerpt}`)
        - overlap(priorityFocus, `${a.objective.label} ${a.objective.excerpt}`);
      if (relevance) return relevance;
    }
    const usage = (label: string) => recent.reduce((score, activity, index) =>
      score + (activity.curriculumSnapshot?.focus.objective === label ? 30 - index : 0), 0);
    return usage(a.objective.label) - usage(b.objective.label) ||
      a.source.id.localeCompare(b.source.id) || a.objective.id.localeCompare(b.objective.id);
  });
  const chosen = candidates[0];
  const objective = chosen?.objective.label || priorityFocus ||
    context.instructionalContext.standardsObjectives ||
    context.instructionalContext.skills ||
    context.instructionalContext.conceptsTopics ||
    `An age-appropriate ${context.classProfile.subject} skill; no verified curriculum source supplied`;
  const combinations = approaches.flatMap((approach, approachIndex) => contexts.map((example, contextIndex) => {
    const key = createHash("sha256")
      .update(`${chosen?.source.id ?? "class-context"}|${objective}|${approachIndex}|${contextIndex}`)
      .digest("hex").slice(0, 24);
    const score = recent.reduce((total, activity, index) => {
      const focus = activity.curriculumSnapshot?.focus;
      if (!focus) return total;
      return total + (focus.combinationKey === key ? 1000 : 0)
        + (focus.thinkingTask === approach.thinkingTask ? 80 - index : 0)
        + (focus.context === example ? 25 - index : 0);
    }, 0);
    return { approach, example, key, score };
  })).sort((a, b) => a.score - b.score);
  const selected = combinations[0];
  return {
    version: 1,
    focus: {
      objective: objective.slice(0, 1200),
      thinkingTask: selected.approach.thinkingTask,
      responseMode: context.today.studentOutput || selected.approach.responseMode,
      context: selected.example,
      combinationKey: selected.key,
    },
    sources: chosen ? [{
      sourceId: chosen.source.id,
      version: chosen.source.version,
      title: chosen.source.title,
      kind: chosen.source.kind,
      subject: chosen.source.subject,
      programmeYear: chosen.source.programmeYear,
      publisher: chosen.source.publisher,
      url: chosen.source.url,
      locator: chosen.objective.locator,
      excerpt: chosen.objective.excerpt,
      objective: chosen.objective.label,
      retrievedAt: chosen.source.retrievedAt instanceof Date
        ? chosen.source.retrievedAt.toISOString() : chosen.source.retrievedAt,
    }] : [],
  };
}

/** Detect exact/near-repeat instructions, not shared curriculum terminology alone. */
export function isRepeatedActivity(task: string, recent: Array<{ task: string }>): boolean {
  const normalized = normalize(task);
  const current = words(task);
  return recent.slice(0, 20).some(previous => {
    if (normalize(previous.task) === normalized) return true;
    const prior = words(previous.task);
    if (current.size < 8 || prior.size < 8) return false;
    const common = [...current].filter(word => prior.has(word)).length;
    const union = new Set([...current, ...prior]).size;
    return common / union >= 0.78;
  });
}