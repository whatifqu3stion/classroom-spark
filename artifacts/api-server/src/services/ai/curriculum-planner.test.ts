import { describe, expect, it } from "vitest";
import { applicablePlanningSources, isRepeatedActivity, planCurriculumActivity, type PlanningSource } from "./curriculum-planner";
import { generateWithRepair } from "./generation-service";
import type { BoardworkGenerationContext, GeneratedActivity } from "./types";

const source: PlanningSource = {
  id: "source", unitId: null, version: 1, status: "approved", kind: "manual",
  title: "Teacher-provided MYP Design notes", subject: "Design", framework: "MYP",
  programmeYear: "2", publisher: null, url: null, retrievedAt: null,
  objectives: [
    ["needs", "Identify user needs", "Identify and explain the needs of a user."],
    ["criteria", "Define measurable success criteria", "Develop success criteria for a design."],
    ["alternatives", "Compare alternative solutions", "Compare a range of feasible design ideas."],
    ["test", "Plan a fair test", "Describe testing methods for a chosen solution."],
    ["improve", "Improve a solution using feedback", "Explain improvements based on user feedback."],
  ].map(([id, label, excerpt]) => ({ id, label, excerpt, locator: "Teacher text, section 1", selected: true })),
};

function setup(): BoardworkGenerationContext {
  return {
    classProfile: { name: "Design", grade: "7", subject: "Design", curriculumFramework: "MYP",
      curriculumDetails: null, programmeYear: "2", generalContext: null, arrivalRoutine: null },
    instructionalContext: { unitOrProject: "", conceptsTopics: "", skills: "", standardsObjectives: "" },
    today: { topic: null, goal: null, focusChips: [], deviceMode: "off", durationMinutes: 5,
      activityStyle: null, teacherProvidedUrl: null, teacherProvidedResourceNote: null, surprise: false },
    recentActivities: [],
  };
}

describe("curriculum planning", () => {
  it("uses at least five supported skill/context combinations across ten blank requests without immediate skill repetition", () => {
    const context = setup();
    const combinations = new Set<string>();
    const skills = new Set<string>();
    let previous = "";
    for (let index = 0; index < 10; index++) {
      const plan = planCurriculumActivity(context, [source]);
      expect(plan.focus.objective).not.toBe(previous);
      expect(source.objectives.some(item => item.label === plan.focus.objective)).toBe(true);
      expect(plan.sources[0].excerpt).toBe(source.objectives.find(item => item.label === plan.focus.objective)?.excerpt);
      previous = plan.focus.objective;
      combinations.add(plan.focus.combinationKey);
      skills.add(plan.focus.objective);
      context.recentActivities.unshift({ task: `Fixture board ${index}`, activityStyle: null, curriculumSnapshot: plan });
    }
    expect(combinations.size).toBeGreaterThanOrEqual(5);
    expect(skills.size).toBe(5);
  });

  it("excludes draft, inactive, wrong-subject/year/framework and other-unit sources without inferring programme year from grade", () => {
    const profile = setup().classProfile;
    const badSources: PlanningSource[] = [
      { ...source, status: "draft" }, { ...source, status: "inactive" },
      { ...source, subject: "Science" }, { ...source, programmeYear: "3" },
      { ...source, framework: "Other" }, { ...source, unitId: "other-unit" },
      { ...source, objectives: source.objectives.map(item => ({ ...item, selected: false })) },
    ];
    expect(applicablePlanningSources(badSources, profile, "selected-unit")).toEqual([]);
    expect(applicablePlanningSources([source], { ...profile, programmeYear: null, grade: "2" })).toEqual([]);
  });

  it("prefers selected-unit sources and preserves direct narrow requests without forcing unrelated curriculum", () => {
    const context = setup();
    context.today.unitId = "unit";
    const unit = { ...source, id: "unit-source", unitId: "unit" };
    expect(planCurriculumActivity(context, [source, unit]).sources[0].sourceId).toBe("unit-source");
    context.today.topic = "Practice adding fractions";
    const direct = planCurriculumActivity(context, [source, unit]);
    expect(direct.sources).toEqual([]);
    expect(direct.focus.objective).toBe("Practice adding fractions");
    context.today.topic = "Identify user needs for accessible packaging";
    expect(planCurriculumActivity(context, [source]).focus.objective).toBe("Identify user needs");
    context.recentActivities = [{ task: "Earlier user-needs work", activityStyle: null,
      curriculumSnapshot: planCurriculumActivity(context, [source]) }];
    expect(planCurriculumActivity(context, [source]).focus.objective).toBe("Identify user needs");
  });

  it("retains manual no-source context without claiming official alignment", () => {
    const context = setup();
    context.instructionalContext.standardsObjectives = "Explain a material choice";
    const plan = planCurriculumActivity(context, []);
    expect(plan.sources).toEqual([]);
    expect(plan.focus.objective).toBe("Explain a material choice");
  });

  it("recognizes noun-swap near duplicates but allows different reasoning with shared terminology", () => {
    const task = "Sketch a chair for a library and label three features that meet user needs. Explain your most important choice.";
    expect(isRepeatedActivity(task.replace("chair", "desk"), [{ task }])).toBe(true);
    expect(isRepeatedActivity("Rank three user needs for a library and justify which need should guide the first prototype.", [{ task }])).toBe(false);
  });

  it("shares a two-call budget between validation and repetition, with no misleading save", async () => {
    const context = setup();
    const activity: GeneratedActivity = { eyebrow: null, task: "Compare two bag handles and explain which is easier to grip.", prompts: [],
      durationMinutes: 5, deviceMode: "off", materials: [], resourceUrl: null, teacherNote: null, activityStyle: "Explain / Reason" };
    context.recentActivities = [{ task: activity.task, activityStyle: null }];
    let calls = 0;
    await expect(generateWithRepair({ async generate() { calls++; return activity; } }, context)).rejects.toThrow(/too similar/);
    expect(calls).toBe(2);
    calls = 0;
    await expect(generateWithRepair({ async generate() {
      calls++;
      return calls === 1 ? { ...activity, durationMinutes: 999 } : activity;
    } }, context)).rejects.toThrow(/too similar/);
    expect(calls).toBe(2);
  });
});