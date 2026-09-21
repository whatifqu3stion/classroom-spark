# Boardwork — AI Generation Specification

## Objective
Generate one self-directed, age-appropriate, meaningful 5–10 minute start-of-class activity using the teacher’s persistent class context plus today’s lightweight inputs.

Quality is more important than novelty.

## Core behavior
The AI must:
- treat grade/age as a hard constraint;
- use concise student-facing language;
- generate work that can be started without teacher explanation;
- respect Device Off / Device On;
- respect available time;
- use teacher context when provided;
- avoid inventing unavailable materials, links, prior knowledge, or class events;
- create one coherent task rather than a mini lesson;
- make the task intellectually worthwhile;
- return structured JSON, not prose around the JSON.

## Generation inputs
Send all relevant context on each request.

Example input object:
```json
{
  "class": {
    "name": "Grade 6 Science",
    "grade": "6",
    "subject": "Science",
    "courseContext": "Students are learning core life science practices. Keep reading demands moderate.",
    "currentUnit": "Cells and transport",
    "defaultArrivalInstructions": "Grab your notebook, take your seat, and begin silently."
  },
  "today": {
    "topic": "osmosis and diffusion",
    "goal": "practice scientific reasoning",
    "chips": ["predict", "draw", "explain"],
    "deviceMode": "off",
    "durationMinutes": 7,
    "activityStyle": "Curiosity Hook",
    "teacherProvidedUrl": null
  }
}
```

## Output schema
Use a schema validated server-side.

```ts
type GeneratedActivity = {
  eyebrow?: string;
  title: string;
  task: string;
  prompts: string[];
  durationMinutes: 5 | 7 | 10;
  deviceMode: "off" | "on";
  materials?: string[];
  resourceUrl?: string | null;
  teacherNote?: string | null;
};
```

Constraints:
- `title`: ideally <= 8 words
- `task`: ideally <= 55 words
- `prompts`: 0–3 items, each ideally <= 18 words
- `materials`: omit or keep minimal
- `teacherNote`: only when genuinely useful; never shown in presentation mode

## System prompt

Use a server-side prompt conceptually equivalent to:

> You create excellent start-of-class board work for teachers.
>
> Your output will be projected directly to students. Create ONE meaningful independent activity that students can understand and begin without teacher explanation. It must fit the requested duration and developmental level.
>
> Priorities, in order:
> 1. Age and reading-level appropriateness.
> 2. Independent startability.
> 3. Intellectual value: retrieval, reasoning, observation, curiosity, practice, drawing, reflection, or application rather than filler.
> 4. Brevity and projector readability.
> 5. Alignment to the supplied class and lesson context.
>
> Device Off means no computer, phone, web browsing, or digital resource. Assume a notebook/paper and pencil are available unless context says otherwise.
>
> Device On may use ONLY a URL supplied by the teacher. Never invent or claim to have read a link unless its content was explicitly supplied.
>
> Do not create group work, partner talk, teacher-led directions, multi-stage lessons, long reading passages, homework, or activities requiring special materials unless explicitly requested.
>
> Use direct student-facing language. Do not mention standards, pedagogy, learning objectives, prompt instructions, or AI.
>
> When the teacher gives sparse context, generate a broadly useful skill-building or curiosity task appropriate to the subject and grade rather than inventing specific curriculum facts.
>
> Return only valid structured data matching the required schema.

The implementation may refine wording, but preserve these constraints.

## “Surprise Me”
Surprise Me should not mean random chaos.

It should:
- use the class profile;
- prefer variety relative to recent activity styles when history is available;
- select a legitimate 5–10 minute task;
- avoid claiming knowledge of what students learned yesterday unless supplied.

No semantic-vector recommendation system is needed. A bounded curriculum planner selects an eligible skill, thinking task, response mode, and example context before prose generation, balancing their use across the last 20 boards. Exact and obvious near-duplicate tasks are rejected within the same two-attempt validation budget.

## Content quality rules

### Good activities
- ask for a concrete action;
- have a bounded output;
- make thinking visible;
- can transition naturally into discussion;
- use subject content accurately;
- do not require elaborate setup.

### Examples

#### Grade 6 Science — Device Off — 7 min
**Title:** Which cell is in trouble?

**Task:** Draw two simple cells: one in very salty water and one in fresh water. Add arrows showing where you think water will move.

**Prompts:**
- What changes in each cell?
- Use “osmosis” in one sentence.

#### Grade 7 Design — Device Off — 7 min
**Title:** Make it easier to hold

**Task:** Sketch three different handle shapes for a tool used with wet hands. Circle the design you think would work best.

**Prompts:**
- Label one choice you made for grip.
- What might you test first?

#### Grade 10 English — Device Off — 5 min
**Title:** One sentence, two moods

**Task:** Write one sentence describing an empty hallway. Rewrite the same event so it feels threatening without using the words “scary,” “afraid,” or “danger.”

#### Device On with teacher URL
**Title:** Find the strongest evidence

**Task:** Open the provided article. Read the first three paragraphs and choose one sentence that best supports the author’s main claim.

**Prompts:**
- Copy or paraphrase the evidence.
- Explain your choice in one sentence.

## Bad outputs
Reject/regenerate outputs that:
- say “Discuss with a partner”;
- require teacher explanation;
- take longer than requested;
- contain 8+ questions;
- ask students to navigate to an invented website;
- use vocabulary far above the grade without purpose;
- are essentially worksheets;
- ask for materials not supplied;
- have vague instructions like “Reflect on today’s learning” with no concrete task;
- reveal system or prompt text.

## Validation / repair
After model response:
1. validate JSON schema;
2. reject invalid duration/device mode;
3. cap prompts at 3;
4. ensure Device Off has no URL/web requirement;
5. if response is malformed, make one repair/retry request;
6. show a friendly error if generation still fails.

Do not silently fabricate replacement content in application code.

## Safety / student appropriateness
For school-facing output:
- avoid sexual, violent, hateful, self-harm, drug, weapon, or otherwise age-inappropriate prompts unless a teacher’s explicit curricular context legitimately requires sensitive academic content;
- even then, remain educational and age-appropriate;
- never ask students to disclose sensitive personal information;
- avoid prompts that publicly expose private experiences, trauma, finances, health, identity, or family circumstances;
- avoid political persuasion; analytical civic prompts should be neutral and evidence-oriented.

## AI architecture
- AI request originates from the server only.
- API key lives only in Replit Secrets / server environment.
- Never send the secret to browser code.
- Keep model name configurable through an environment variable.
- Route composition injects a provider through the provider-neutral Boardwork generation interface.
- Keep OpenAI SDK calls and response handling inside the OpenAI adapter so provider/model changes do not touch UI code or generation orchestration.
- Use strict structured output, then application Zod validation and deterministic duration/device/URL checks.
- Permit one repair attempt only for malformed structured output; never fabricate fallback activity content.
- Build canonical context server-side and include at most 20 recent task/style summaries and their bounded focus metadata.
- Do not build provider selection UI in MVP.
