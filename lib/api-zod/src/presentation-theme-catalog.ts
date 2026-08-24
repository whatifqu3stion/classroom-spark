export type PresentationThemeMode = "light" | "dark";

export type PresentationThemeColors = {
  background: string;
  surface: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
  accentSoft: string;
};

export type CustomPresentationThemeAnchors = {
  background: string;
  text: string;
  accent: string;
};

// This intentionally mirrors the nullable/optional API shape so older clients
// can send a partially absent theme without making the activity unreadable.
export type PresentationThemeChoice = {
  kind: "curated" | "custom";
  themeId?: string;
  sourceThemeId?: string;
  anchors?: CustomPresentationThemeAnchors;
};

export type CuratedPresentationTheme = {
  id: string;
  name: string;
  description: string;
  mode: PresentationThemeMode;
  colors: PresentationThemeColors;
};

export const curatedPresentationThemes = [
  {
    id: "paper",
    name: "Paper",
    description: "Warm white with a familiar ink-and-clay accent.",
    mode: "light",
    colors: {
      background: "#F7F3EA",
      surface: "#FFFDF8",
      primaryText: "#202326",
      secondaryText: "#4D514F",
      accent: "#A94632",
      accentSoft: "#F0D9D0",
    },
  },
  {
    id: "ink",
    name: "Ink",
    description: "A dark, high-contrast canvas with a quiet cyan signal.",
    mode: "dark",
    colors: {
      background: "#111827",
      surface: "#1E293B",
      primaryText: "#F8FAFC",
      secondaryText: "#CBD5E1",
      accent: "#67E8F9",
      accentSoft: "#164E63",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Pale blue, deep navy, and a clear blue accent.",
    mode: "light",
    colors: {
      background: "#EAF4F7",
      surface: "#F7FCFD",
      primaryText: "#123047",
      secondaryText: "#3A5B6D",
      accent: "#146C94",
      accentSoft: "#CBE5EE",
    },
  },
  {
    id: "clay",
    name: "Clay",
    description: "A soft terracotta palette that keeps text grounded.",
    mode: "light",
    colors: {
      background: "#F6E9DE",
      surface: "#FFF8F2",
      primaryText: "#33231D",
      secondaryText: "#644D42",
      accent: "#A94E2C",
      accentSoft: "#EFD1C2",
    },
  },
  {
    id: "sage",
    name: "Sage",
    description: "Muted green-gray with a natural moss accent.",
    mode: "light",
    colors: {
      background: "#EDF3EA",
      surface: "#FAFCF8",
      primaryText: "#1D3328",
      secondaryText: "#476052",
      accent: "#47745A",
      accentSoft: "#D3E4D5",
    },
  },
  {
    id: "plum",
    name: "Plum",
    description: "A gentle lavender field with deep plum type.",
    mode: "light",
    colors: {
      background: "#F4EDF5",
      surface: "#FCF8FD",
      primaryText: "#302136",
      secondaryText: "#5A4961",
      accent: "#854F8E",
      accentSoft: "#E6D4E8",
    },
  },
  {
    id: "slate",
    name: "Slate",
    description: "Cool neutral tones with a steady blue-gray accent.",
    mode: "light",
    colors: {
      background: "#E9EEF2",
      surface: "#F8FAFC",
      primaryText: "#17232E",
      secondaryText: "#435360",
      accent: "#365A73",
      accentSoft: "#D0DEE7",
    },
  },
  {
    id: "citrus",
    name: "Citrus",
    description: "A warm, sunny background with restrained orange.",
    mode: "light",
    colors: {
      background: "#FFF5D9",
      surface: "#FFFCF0",
      primaryText: "#342A13",
      secondaryText: "#665B3A",
      accent: "#9A5700",
      accentSoft: "#F3D99B",
    },
  },
  {
    id: "indigo",
    name: "Indigo",
    description: "Soft periwinkle with an editorial navy foundation.",
    mode: "light",
    colors: {
      background: "#EDEBFA",
      surface: "#FAF9FF",
      primaryText: "#202044",
      secondaryText: "#504F70",
      accent: "#5147A8",
      accentSoft: "#DAD7F2",
    },
  },
  {
    id: "moss",
    name: "Moss",
    description: "Earthy green tones with a low-key olive accent.",
    mode: "light",
    colors: {
      background: "#E7EFE5",
      surface: "#F8FBF7",
      primaryText: "#243126",
      secondaryText: "#4E604F",
      accent: "#52743D",
      accentSoft: "#D1E0CA",
    },
  },
  {
    id: "rose",
    name: "Rose",
    description: "Dusty rose with charcoal-plum lettering.",
    mode: "light",
    colors: {
      background: "#F8EBEE",
      surface: "#FFF9FA",
      primaryText: "#351F27",
      secondaryText: "#624950",
      accent: "#98445C",
      accentSoft: "#EED1D9",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep navy with soft white text and a focused blue accent.",
    mode: "dark",
    colors: {
      background: "#0F172A",
      surface: "#1E293B",
      primaryText: "#F8FAFC",
      secondaryText: "#CBD5E1",
      accent: "#38BDF8",
      accentSoft: "#164E63",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Dark green-gray with a soft mint signal.",
    mode: "dark",
    colors: {
      background: "#12211D",
      surface: "#1D332B",
      primaryText: "#F4FAF6",
      secondaryText: "#C4D8CC",
      accent: "#77C69A",
      accentSoft: "#24513D",
    },
  },
  {
    id: "charcoal",
    name: "Charcoal",
    description: "Near-monochrome dark gray with a warm stone accent.",
    mode: "dark",
    colors: {
      background: "#232323",
      surface: "#303030",
      primaryText: "#FBF8F1",
      secondaryText: "#D8D2C6",
      accent: "#D0A36C",
      accentSoft: "#594632",
    },
  },
] as const satisfies readonly CuratedPresentationTheme[];

export const DEFAULT_PRESENTATION_THEME_ID = "paper";
export const RECOMMENDED_PRESENTATION_THEME_IDS = [
  "paper",
  "ink",
  "ocean",
  "clay",
  "sage",
  "midnight",
] as const;

export function getCuratedPresentationTheme(
  themeId: string | null | undefined,
): CuratedPresentationTheme {
  return (
    curatedPresentationThemes.find((theme) => theme.id === themeId) ??
    curatedPresentationThemes.find(
      (theme) => theme.id === DEFAULT_PRESENTATION_THEME_ID,
    )!
  );
}

function parseHex(value: string): [number, number, number] | null {
  const normalized = value.trim().replace(/^#/, "");
  if (!/^[\da-f]{6}$/i.test(normalized)) return null;
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

export function isHexColor(value: string): boolean {
  return parseHex(value) !== null;
}

export function normalizeHexColor(value: string): string | null {
  const rgb = parseHex(value);
  return rgb
    ? `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase()
    : null;
}

function relativeLuminance(value: string): number {
  const rgb = parseHex(value) ?? [0, 0, 0];
  const channels = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(first: string, second: string): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

type Oklab = [lightness: number, a: number, b: number];

function srgbToLinear(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value: number): number {
  const normalized = Math.max(0, Math.min(1, value));
  return normalized <= 0.0031308
    ? normalized * 12.92
    : 1.055 * normalized ** (1 / 2.4) - 0.055;
}

// OKLab keeps lightness changes perceptually steadier than mixing RGB channels.
function hexToOklab(value: string): Oklab {
  const [red, green, blue] = parseHex(value) ?? [0, 0, 0];
  const r = srgbToLinear(red);
  const g = srgbToLinear(green);
  const b = srgbToLinear(blue);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);
  return [
    0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
  ];
}

function oklabToHex([lightness, a, b]: Oklab): string {
  const lRoot = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;
  const red = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const green = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const blue = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return `#${[red, green, blue]
    .map((channel) =>
      Math.round(linearToSrgb(channel) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
}

function mixOklab(first: string, second: string, firstWeight: number): string {
  const firstLab = hexToOklab(first);
  const secondLab = hexToOklab(second);
  return oklabToHex(
    firstLab.map(
      (channel, index) =>
        channel * firstWeight + secondLab[index] * (1 - firstWeight),
    ) as Oklab,
  );
}

function ensureReadableTextColor(candidate: string, background: string): string {
  return ensureReadableTextColorOnSurfaces(candidate, [background]);
}

function ensureReadableTextColorOnSurfaces(
  candidate: string,
  backgrounds: string[],
): string {
  if (backgrounds.every((background) => contrastRatio(candidate, background) >= 4.5)) {
    return candidate;
  }

  const backgroundIsLight =
    backgrounds.reduce((total, background) => total + relativeLuminance(background), 0) /
      backgrounds.length >
    0.5;
  const [lightness, a, b] = hexToOklab(candidate);
  const direction = backgroundIsLight ? -1 : 1;

  for (let step = 1; step <= 100; step += 1) {
    const adjusted = oklabToHex([
      Math.max(0, Math.min(1, lightness + direction * step * 0.01)),
      a,
      b,
    ]);
    if (backgrounds.every((background) => contrastRatio(adjusted, background) >= 4.5)) {
      return adjusted;
    }
  }

  return backgroundIsLight ? "#000000" : "#FFFFFF";
}

export function getPresentationThemeAccentForeground(accent: string): string {
  return contrastRatio(accent, "#FFFFFF") >= 4.5 ? "#FFFFFF" : "#171717";
}

export function isPresentationThemeReadable(
  anchors: CustomPresentationThemeAnchors,
): boolean {
  const colors = derivePresentationThemeColors(anchors);
  return (
    contrastRatio(anchors.background, colors.primaryText) >= 4.5 &&
    contrastRatio(anchors.background, colors.secondaryText) >= 4.5 &&
    contrastRatio(colors.surface, colors.secondaryText) >= 4.5 &&
    contrastRatio(colors.accent, getPresentationThemeAccentForeground(colors.accent)) >= 4.5
  );
}

export function derivePresentationThemeColors(
  anchors: CustomPresentationThemeAnchors,
): PresentationThemeColors {
  const backgroundIsLight =
    relativeLuminance(anchors.background) > 0.5;
  const surface = mixOklab(
    anchors.background,
    backgroundIsLight ? "#FFFFFF" : "#000000",
    0.9,
  );
  const secondaryText = ensureReadableTextColor(
    mixOklab(anchors.text, anchors.background, 0.78),
    anchors.background,
  );
  return {
    background: anchors.background,
    surface,
    primaryText: anchors.text,
    secondaryText: ensureReadableTextColorOnSurfaces(
      secondaryText,
      [anchors.background, surface],
    ),
    accent: anchors.accent,
    accentSoft: mixOklab(anchors.accent, anchors.background, 0.16),
  };
}

export function getPresentationThemeColors(
  selection: PresentationThemeChoice | null | undefined,
): PresentationThemeColors {
  if (selection?.kind === "custom" && selection.anchors) {
    return derivePresentationThemeColors(selection.anchors);
  }
  return getCuratedPresentationTheme(
    selection?.kind === "curated" ? selection.themeId : DEFAULT_PRESENTATION_THEME_ID,
  ).colors;
}

export function getPresentationThemeSelection(
  themeId: string,
): PresentationThemeChoice {
  return { kind: "curated", themeId: getCuratedPresentationTheme(themeId).id };
}
