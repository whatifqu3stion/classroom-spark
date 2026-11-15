import { z } from "zod/v4";

import type { InlineTextRun } from "./generated/types";
import { InlineTextRunSchema } from "./inline-formatting";

export const widgetKinds = [
  "task",
  "note",
  "agenda",
  "timer",
  "stopwatch",
  "clock",
  "calendar",
  "countdown",
  "randomizer",
  "groups",
  "dice",
  "scoreboard",
  "traffic",
  "work",
  "draw",
  "image",
  "link",
  "qr",
  "embed",
  "video",
  "pdf",
  "poll",
] as const;
export type WidgetKind = (typeof widgetKinds)[number];
export const HomebaseTone = z.enum(["paper", "lavender", "sage", "butter"]);
export const HomebaseUrl = z
  .string()
  .max(2000)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  }, "Use a full https:// link without a username or password.");
// Forty photos at this size fit inside the API's 16 MiB JSON body limit.
export const HOMEBASE_PHOTO_DATA_LIMIT = 256 * 1024;
const HomebasePhoto = z.string().max(HOMEBASE_PHOTO_DATA_LIMIT)
  .regex(/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/, "Choose a photo from your device.");

const Point = z.object({
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(600),
});
export const HomebaseWidget = z
  .object({
    id: z.uuid(),
    kind: z.enum(widgetKinds),
    x: z.int().min(0).max(11),
    y: z.int().min(0).max(200),
    w: z.int().min(2).max(12),
    h: z.int().min(2).max(16),
    title: z.string().max(100),
    tone: HomebaseTone,
    text: z.string().max(8000).default(""),
    font: z.enum(["sans", "serif", "mono"]).optional(),
    textRuns: z.array(z.custom<InlineTextRun>(run => InlineTextRunSchema.safeParse(run).success)).max(8000).optional(),
    url: HomebaseUrl.default(""),
    photo: HomebasePhoto.optional(),
    stages: z.array(z.object({
      label: z.string().trim().min(1).max(200),
      minutes: z.number().int().min(1).max(120),
    })).min(1).max(100).optional(),
    items: z.array(z.string().max(200)).max(100).default([]),
    values: z.array(z.int().min(-999).max(9999)).max(100).default([]),
    minutes: z.number().min(0.05).max(1440).default(5),
    target: z
      .string()
      .max(40)
      .refine(
        (value) =>
          !value ||
          (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
            Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
            new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) ===
              value),
        "Choose a valid calendar date.",
      )
      .default(""),
    number: z.int().min(1).max(100).default(3),
    mode: z.string().max(40).default(""),
    strokes: z
      .array(
        z.object({
          color: z.enum(["#20302f", "#654fa3", "#a33c35", "#27684f"]),
          points: z.array(Point).min(1).max(1200),
        }),
      )
      .max(100)
      .default([]),
  })
  .refine(widget => !widget.photo || (widget.kind === "image" && !widget.url),
    "Choose either a photo or an image link.")
  .refine(widget => !widget.textRuns || widget.textRuns.map(run => run.text).join("") === widget.text,
    "Formatting must match the text.")
  .refine(widget => widget.kind !== "qr" || new TextEncoder().encode(widget.url).length <= 2000,
    "Use a shorter link for this QR code.")
  .refine(
    (widget) => widget.kind !== "dice" || widget.number <= 6,
    "Choose between one and six dice.",
  )
  .refine(
    (widget) => widget.x + widget.w <= 12,
    "The tool must fit inside the board.",
  );
export type HomebaseWidget = z.infer<typeof HomebaseWidget>;
export const HomebaseContent = z.object({
  name: z.string().trim().min(1).max(100),
  tone: HomebaseTone,
  widgets: z
    .array(HomebaseWidget)
    .max(40)
    .refine(
      (widgets) => new Set(widgets.map((w) => w.id)).size === widgets.length,
      "Tool IDs must be unique.",
    ),
});
export type HomebaseContent = z.infer<typeof HomebaseContent>;
export const CreateHomebase = HomebaseContent.extend({
  classId: z.uuid().nullable(),
});
export const UpdateHomebase = HomebaseContent.extend({
  revision: z.int().min(1),
});
export const HomebaseRecord = HomebaseContent.extend({
  id: z.uuid(),
  classId: z.uuid().nullable(),
  revision: z.int().min(1),
  updatedAt: z.string(),
});
export type HomebaseRecord = z.infer<typeof HomebaseRecord>;
