export type PresentationThemeMode = "light" | "dark";

export type PresentationThemeColors = {
  background: string;
  surface: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
  accentSoft: string;
};

export type PresentationTypography = {
  id: string;
  headingFamily: string;
  bodyFamily: string;
  headingWeight: number;
  bodyWeight: number;
  headingLetterSpacing: string;
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
  typography: PresentationTypography;
};

export type AppearancePreset = CuratedPresentationTheme;

const SCRIPT_FONT_FALLBACK =
  "'Noto Sans Arabic', 'Noto Sans Hebrew', 'Noto Sans Devanagari', 'Noto Sans JP', 'Noto Sans Symbols 2', 'Noto Sans', 'Noto Color Emoji', 'Segoe UI Symbol', 'Apple Color Emoji'";
const sansFamily = (family: string) =>
  `${family}, ${SCRIPT_FONT_FALLBACK}, system-ui, sans-serif`;
const serifFamily = (family: string) =>
  `${family}, Georgia, 'Noto Serif', ${SCRIPT_FONT_FALLBACK}, serif`;
const monoFamily = (family: string) =>
  `${family}, 'Noto Sans Mono', ${SCRIPT_FONT_FALLBACK}, ui-monospace, monospace`;

// Color and typography are intentionally separate systems. Appearance presets
// compose the two so a future catalog can reuse either system without coupling
// palette decisions to type decisions.
export const presentationColorThemes = [
  {
    id: "boardwork",
    name: "Boardwork",
    description: "The familiar warm-neutral Boardwork canvas.",
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
    id: "paper-v2",
    name: "Paper",
    description: "Warm paper, dark ink, and a grounded terracotta signal.",
    mode: "light",
    colors: {
      background: "#F3EEE4",
      surface: "#FFFCF5",
      primaryText: "#241F1A",
      secondaryText: "#5D554C",
      accent: "#9A4B32",
      accentSoft: "#E8D6C8",
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
    id: "sunlit",
    name: "Sunlit",
    description: "A warm, sunny field with a restrained golden signal.",
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
    id: "teal",
    name: "Teal",
    description: "A clear, calm teal palette with deep readable type.",
    mode: "light",
    colors: {
      background: "#E8F4F1",
      surface: "#F9FCFB",
      primaryText: "#153631",
      secondaryText: "#3D5E58",
      accent: "#0C786D",
      accentSoft: "#C8E4DE",
    },
  },
] as const;

export const presentationTypographySystems = [
  {
    id: "boardwork",
    headingFamily: sansFamily("'Inter'"),
    bodyFamily: sansFamily("'Inter'"),
    headingWeight: 700,
    bodyWeight: 500,
    headingLetterSpacing: "-0.045em",
  },
  {
    id: "paper-v2",
    headingFamily: serifFamily("'DM Serif Display'"),
    bodyFamily: sansFamily("'Atkinson Hyperlegible'"),
    headingWeight: 700,
    bodyWeight: 500,
    headingLetterSpacing: "-0.025em",
  },
  {
    id: "ocean",
    headingFamily: sansFamily("'Space Grotesk'"),
    bodyFamily: sansFamily("'Inter'"),
    headingWeight: 700,
    bodyWeight: 500,
    headingLetterSpacing: "-0.04em",
  },
  {
    id: "ink",
    headingFamily: monoFamily("'IBM Plex Mono'"),
    bodyFamily: sansFamily("'IBM Plex Sans'"),
    headingWeight: 600,
    bodyWeight: 500,
    headingLetterSpacing: "-0.035em",
  },
  {
    id: "sage",
    headingFamily: serifFamily("'Fraunces'"),
    bodyFamily: sansFamily("'Atkinson Hyperlegible'"),
    headingWeight: 700,
    bodyWeight: 500,
    headingLetterSpacing: "-0.03em",
  },
  {
    id: "clay",
    headingFamily: sansFamily("'DM Sans'"),
    bodyFamily: sansFamily("'DM Sans'"),
    headingWeight: 700,
    bodyWeight: 500,
    headingLetterSpacing: "-0.045em",
  },
  {
    id: "plum",
    headingFamily: serifFamily("'Playfair Display'"),
    bodyFamily: sansFamily("'Source Sans 3'"),
    headingWeight: 700,
    bodyWeight: 500,
    headingLetterSpacing: "-0.035em",
  },
  {
    id: "midnight",
    headingFamily: sansFamily("'Space Grotesk'"),
    bodyFamily: sansFamily("'IBM Plex Sans'"),
    headingWeight: 700,
    bodyWeight: 500,
    headingLetterSpacing: "-0.04em",
  },
  {
    id: "sunlit",
    headingFamily: serifFamily("'Lora'"),
    bodyFamily: sansFamily("'Atkinson Hyperlegible'"),
    headingWeight: 700,
    bodyWeight: 500,
    headingLetterSpacing: "-0.025em",
  },
  {
    id: "teal",
    headingFamily: sansFamily("'Plus Jakarta Sans'"),
    bodyFamily: sansFamily("'Plus Jakarta Sans'"),
    headingWeight: 700,
    bodyWeight: 500,
    headingLetterSpacing: "-0.04em",
  },
] as const satisfies readonly PresentationTypography[];

const appearancePresetDefinitions = [
  ["boardwork", "boardwork", "boardwork"],
  ["paper-v2", "paper-v2", "paper-v2"],
  ["ocean", "ocean", "ocean"],
  ["ink", "ink", "ink"],
  ["sage", "sage", "sage"],
  ["clay", "clay", "clay"],
  ["plum", "plum", "plum"],
  ["midnight", "midnight", "midnight"],
  ["sunlit", "sunlit", "sunlit"],
  ["teal", "teal", "teal"],
] as const;

const colorThemeById = new Map(
  presentationColorThemes.map((theme) => [theme.id, theme]),
);
const typographyById = new Map(
  presentationTypographySystems.map((system) => [system.id, system]),
);

export const curatedPresentationThemes = appearancePresetDefinitions.map(
  ([id, colorThemeId, typographyId]) => {
    const colorTheme = colorThemeById.get(colorThemeId);
    const typography = typographyById.get(typographyId);
    if (!colorTheme || !typography) {
      throw new Error(`Appearance preset ${id} is missing a theme system`);
    }
    return { ...colorTheme, typography };
  },
) as readonly CuratedPresentationTheme[];

export const appearancePresets = curatedPresentationThemes;

const boardworkTypography = typographyById.get("boardwork")!;
const legacyPresentationThemes = [
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
] as const;

const LEGACY_THEME_ALIASES: Record<string, string> = {
  // The old Paper palette was the warm-neutral default. Boardwork now carries
  // that palette so existing saved activities keep their appearance.
  paper: "boardwork",
};

export const DEFAULT_PRESENTATION_THEME_ID = "boardwork";
export const RECOMMENDED_PRESENTATION_THEME_IDS = [
  "boardwork",
  "paper-v2",
  "ocean",
  "ink",
  "sage",
] as const;

export function getCuratedPresentationTheme(
  themeId: string | null | undefined,
): CuratedPresentationTheme {
  const resolvedThemeId = themeId
    ? LEGACY_THEME_ALIASES[themeId] ?? themeId
    : DEFAULT_PRESENTATION_THEME_ID;
  const legacyTheme = legacyPresentationThemes.find(
    (theme) => theme.id === themeId,
  );
  return (
    curatedPresentationThemes.find((theme) => theme.id === resolvedThemeId) ??
    (legacyTheme
      ? { ...legacyTheme, typography: boardworkTypography }
      : undefined) ??
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

export function getPresentationThemeTypography(
  selection: PresentationThemeChoice | null | undefined,
): PresentationTypography {
  const sourceThemeId =
    selection?.kind === "custom"
      ? selection.sourceThemeId
      : selection?.kind === "curated"
        ? selection.themeId
        : DEFAULT_PRESENTATION_THEME_ID;
  return getCuratedPresentationTheme(sourceThemeId).typography;
}

export function isPresentationThemeReadable(
  anchors: CustomPresentationThemeAnchors,
): boolean {
  const colors = derivePresentationThemeColors(anchors);
  return (
    contrastRatio(anchors.background, anchors.text) >= 4.5 &&
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
  const primaryText = ensureReadableTextColorOnSurfaces(
    anchors.text,
    [anchors.background, surface],
  );
  const secondaryText = ensureReadableTextColor(
    mixOklab(anchors.text, anchors.background, 0.78),
    anchors.background,
  );
  return {
    background: anchors.background,
    surface,
    primaryText,
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
  if (
    selection?.kind === "custom" &&
    selection.anchors &&
    isHexColor(selection.anchors.background) &&
    isHexColor(selection.anchors.text) &&
    isHexColor(selection.anchors.accent)
  ) {
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
