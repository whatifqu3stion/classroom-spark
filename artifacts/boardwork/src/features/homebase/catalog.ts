import {
  HomebaseWidget,
  type HomebaseContent,
  type WidgetKind,
} from "@workspace/api-zod";
import type { ActivityDraft } from "@/store/boardwork-context";

export const tools: {
  kind: WidgetKind;
  title: string;
  description: string;
  group: string;
  w: number;
  h: number;
}[] = [
  {
    kind: "task",
    title: "Boardwork activity",
    description: "Bring a saved activity onto your board.",
    group: "Teach",
    w: 8,
    h: 5,
  },
  {
    kind: "note",
    title: "Sticky note",
    description: "Instructions, reminders, or a question.",
    group: "Teach",
    w: 4,
    h: 3,
  },
  {
    kind: "agenda",
    title: "Agenda",
    description: "A short checklist for the lesson.",
    group: "Teach",
    w: 4,
    h: 4,
  },
  {
    kind: "draw",
    title: "Draw",
    description: "Sketch, annotate, or model a thought.",
    group: "Teach",
    w: 8,
    h: 5,
  },
  {
    kind: "timer",
    title: "Timer",
    description: "A visual countdown with optional calm sound.",
    group: "Time",
    w: 4,
    h: 4,
  },
  {
    kind: "stopwatch",
    title: "Stopwatch",
    description: "Count up for a challenge or experiment.",
    group: "Time",
    w: 4,
    h: 3,
  },
  {
    kind: "clock",
    title: "Clock",
    description: "The current time, clear across the room.",
    group: "Time",
    w: 4,
    h: 2,
  },
  {
    kind: "calendar",
    title: "Date",
    description: "Today's date and a monthly calendar.",
    group: "Time",
    w: 4,
    h: 4,
  },
  {
    kind: "countdown",
    title: "Event countdown",
    description: "Count the days to a class event.",
    group: "Time",
    w: 4,
    h: 3,
  },
  {
    kind: "randomizer",
    title: "Name picker",
    description: "Pick without repeats until everyone has a turn.",
    group: "Participate",
    w: 4,
    h: 4,
  },
  {
    kind: "groups",
    title: "Group maker",
    description: "Shuffle names into groups of a chosen size.",
    group: "Participate",
    w: 6,
    h: 5,
  },
  {
    kind: "dice",
    title: "Dice",
    description: "Roll one or more dice for a quick prompt.",
    group: "Participate",
    w: 4,
    h: 3,
  },
  {
    kind: "scoreboard",
    title: "Scoreboard",
    description: "Keep team scores in view.",
    group: "Participate",
    w: 6,
    h: 4,
  },
  {
    kind: "poll",
    title: "Class vote",
    description: "Record a show-of-hands vote on the board.",
    group: "Participate",
    w: 6,
    h: 4,
  },
  {
    kind: "traffic",
    title: "Traffic light",
    description: "Make a classroom signal visible.",
    group: "Routines",
    w: 4,
    h: 3,
  },
  {
    kind: "work",
    title: "Work mode",
    description: "Show solo, partner, group, or discussion time.",
    group: "Routines",
    w: 4,
    h: 3,
  },
  {
    kind: "link",
    title: "Resource link",
    description: "Keep a lesson resource one click away.",
    group: "Resources",
    w: 4,
    h: 3,
  },
  {
    kind: "image",
    title: "Image",
    description: "Show a teacher-selected image from an HTTPS link.",
    group: "Resources",
    w: 6,
    h: 5,
  },
  {
    kind: "video",
    title: "Video",
    description: "Play a YouTube video when you're ready.",
    group: "Resources",
    w: 8,
    h: 5,
  },
  {
    kind: "pdf",
    title: "PDF",
    description: "Display a PDF from a direct HTTPS link.",
    group: "Resources",
    w: 8,
    h: 6,
  },
  {
    kind: "embed",
    title: "Embed",
    description:
      "Show a published Google document, slides, sheet, or Spotify player.",
    group: "Resources",
    w: 8,
    h: 6,
  },
];
export function makeWidget(
  kind: WidgetKind,
  widgets: HomebaseWidget[] = [],
): HomebaseWidget {
  const tool = tools.find((item) => item.kind === kind)!;
  return HomebaseWidget.parse({
    id: crypto.randomUUID(),
    kind,
    title: tool.title,
    x: 0,
    y: widgets.reduce((end, widget) => Math.max(end, widget.y + widget.h), 0),
    w: tool.w,
    h: tool.h,
    tone: kind === "timer" ? "lavender" : kind === "note" ? "butter" : "paper",
    minutes: 5,
    number: kind === "dice" ? 1 : 3,
    items:
      kind === "scoreboard"
        ? ["Team 1", "Team 2"]
        : kind === "poll"
          ? ["Option A", "Option B"]
          : [],
    mode: kind === "traffic" ? "ready" : kind === "work" ? "solo" : "",
  });
}
export function template(kind: "arrival" | "focus" | "blank"): HomebaseContent {
  if (kind === "blank")
    return { name: "Untitled homebase", tone: "paper", widgets: [] };
  const timer = { ...makeWidget("timer"), x: 8, y: 0, h: 4 };
  if (kind === "focus")
    return {
      name: "Focus time",
      tone: "sage",
      widgets: [
        { ...timer, x: 0, w: 8, h: 5 },
        { ...makeWidget("work"), x: 8, h: 5 },
      ],
    };
  return {
    name: "Class homebase",
    tone: "paper",
    widgets: [
      {
        ...makeWidget("note"),
        title: "Welcome. Start here.",
        text: "Add the first thing students should do when they arrive.",
        x: 0,
        y: 0,
        w: 8,
        h: 4,
      },
      timer,
      {
        ...makeWidget("agenda"),
        title: "Today's plan",
        x: 0,
        y: 4,
        w: 8,
        h: 3,
      },
      { ...makeWidget("clock"), x: 8, y: 4, h: 3 },
    ],
  };
}
export function activityWidget(
  activity: ActivityDraft,
  widgets: HomebaseWidget[],
): HomebaseWidget {
  return {
    ...makeWidget("task", widgets),
    title: activity.title.slice(0, 100),
    text: activity.task,
    items: activity.prompts,
    minutes: activity.durationMinutes,
    url: activity.resourceUrl?.startsWith("https://")
      ? activity.resourceUrl
      : "",
  };
}
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function formatSeconds(value: number) {
  const seconds = Math.max(0, Math.floor(value));
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
// Only player/document URLs are embedded. A normal web link is still useful as a link.
export function embedUrl(kind: WidgetKind, value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (kind === "video") {
      const id =
        url.hostname === "youtu.be"
          ? url.pathname.slice(1)
          : ["www.youtube.com", "youtube.com"].includes(url.hostname)
            ? url.searchParams.get("v") ||
              url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1]
            : null;
      return id && /^[\w-]{11}$/.test(id)
        ? `https://www.youtube-nocookie.com/embed/${id}`
        : null;
    }
    if (kind === "pdf" && /\.pdf$/i.test(url.pathname)) return url.href;
    if (kind === "embed") {
      if (
        url.hostname === "docs.google.com" &&
        /^\/(?:document|presentation|spreadsheets)\/d\/(?:e\/)?[\w-]+\/(?:pub|pubhtml|embed)$/.test(
          url.pathname,
        )
      )
        return url.href;
      if (
        url.hostname === "open.spotify.com" &&
        /^\/embed\/(?:playlist|album|track|episode)\/[a-zA-Z0-9]+\/?$/.test(
          url.pathname,
        )
      )
        return url.href;
    }
  } catch {
    /* The editor explains how to fix the link. */
  }
  return null;
}
