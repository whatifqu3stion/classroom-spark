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
  heading: {
    family: string;
    weight: number;
  };
  body: {
    family: string;
    weight: number;
  };
  headingLetterSpacing: string;
  headingScale: number;
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
  accentId?: string;
  typographyId?: string;
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

export type PresentationSurfaceTheme = {
  id: string;
  name: string;
  description: string;
  mode: PresentationThemeMode;
  defaultAccentId: string;
  colors: Omit<PresentationThemeColors, "accent" | "accentSoft">;
};

export type PresentationAccentTheme = {
  id: string;
  name: string;
  lightName: string;
  darkName: string;
  description: string;
  displayNames: {
    light: string;
    dark: string;
  };
  displayDescriptions: {
    light: string;
    dark: string;
  };
  colors: {
    light: string;
    dark: string;
  };
};

const SCRIPT_FONT_FALLBACK =
  "'Noto Sans Arabic', 'Noto Sans Hebrew', 'Noto Sans Devanagari', 'Noto Sans JP', 'Noto Sans Symbols 2', 'Noto Sans', 'Noto Color Emoji', 'Segoe UI Symbol', 'Apple Color Emoji'";
const SANS_SYSTEM_FALLBACK =
  "'Segoe UI', 'Helvetica Neue', Arial, system-ui, sans-serif";
const sansFamily = (family: string) =>
  `${family}, ${SCRIPT_FONT_FALLBACK}, ${SANS_SYSTEM_FALLBACK}`;

// Background surfaces are intentionally restrained. Accent colors are a
// secondary semantic system: they mark links, progress, controls, and small
// moments of emphasis rather than becoming full-page backgrounds.
export const presentationAccentThemes = [
  {
    id: "terracotta",
    name: "Terracotta",
    lightName: "Terracotta",
    darkName: "Coral",
    description: "A grounded, warm signal for emphasis and progress.",
    displayNames: { light: "Terracotta", dark: "Coral" },
    displayDescriptions: {
      light: "A grounded, warm signal for emphasis and progress on a light surface.",
      dark: "A soft coral signal that stays clear against a dark surface.",
    },
    colors: { light: "#A94632", dark: "#E28A70" },
  },
  {
    id: "blue",
    name: "Dark blue",
    lightName: "Dark blue",
    darkName: "Sky blue",
    description: "Boardwork's steady default signal for links and navigation.",
    displayNames: { light: "Dark blue", dark: "Sky blue" },
    displayDescriptions: {
      light: "Boardwork's steady dark blue signal for links and navigation.",
      dark: "A clear sky blue signal for links and navigation on a dark surface.",
    },
    colors: { light: "#334155", dark: "#70B7DF" },
  },
  {
    id: "sage",
    name: "Sage",
    lightName: "Sage",
    darkName: "Mint",
    description: "A quiet natural signal for calm emphasis.",
    displayNames: { light: "Sage", dark: "Mint" },
    displayDescriptions: {
      light: "A quiet natural sage signal for calm emphasis on a light surface.",
      dark: "A soft mint signal for calm emphasis on a dark surface.",
    },
    colors: { light: "#47745A", dark: "#7BC49A" },
  },
  {
    id: "plum",
    name: "Plum",
    lightName: "Plum",
    darkName: "Lilac",
    description: "A thoughtful muted signal for gentle distinction.",
    displayNames: { light: "Plum", dark: "Lilac" },
    displayDescriptions: {
      light: "A thoughtful muted plum signal for gentle distinction on a light surface.",
      dark: "A gentle lilac signal for distinction on a dark surface.",
    },
    colors: { light: "#7B526F", dark: "#C18AC0" },
  },
] as const satisfies readonly PresentationAccentTheme[];

export const presentationSurfaceThemes = [
  {
    id: "boardwork",
    name: "Boardwork",
    description: "Soft white with Boardwork's dark blue default.",
    mode: "light",
    defaultAccentId: "blue",
    colors: {
      background: "#FDFCF8",
      surface: "#FFFFFF",
      primaryText: "#334155",
      secondaryText: "#52606D",
    },
  },
  {
    id: "paper-v2",
    name: "Paper",
    description: "A warmer paper surface for a softer classroom feel.",
    mode: "light",
    defaultAccentId: "terracotta",
    colors: {
      background: "#F3EEE4",
      surface: "#FFFCF5",
      primaryText: "#241F1A",
      secondaryText: "#5D554C",
    },
  },
  {
    id: "charcoal-v2",
    name: "Charcoal",
    description: "A softer warm dark surface with low-glare stone contrast.",
    mode: "dark",
    defaultAccentId: "terracotta",
    colors: {
      background: "#232323",
      surface: "#303030",
      primaryText: "#FBF8F1",
      secondaryText: "#D8D2C6",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "A deeper cool dark surface with crisp contrast.",
    mode: "dark",
    defaultAccentId: "blue",
    colors: {
      background: "#0F172A",
      surface: "#1E293B",
      primaryText: "#F8FAFC",
      secondaryText: "#CBD5E1",
    },
  },
] as const satisfies readonly PresentationSurfaceTheme[];

export const presentationTypographySystems = [
  // This is the original Boardwork presentation treatment. Keep the
  // heading/body pairing fixed so preview, Present, and PNG export agree.
  {
    id: "boardwork",
    heading: { family: sansFamily("'Inter'"), weight: 700 },
    body: { family: sansFamily("'Inter'"), weight: 500 },
    headingLetterSpacing: "-0.045em",
    headingScale: 1,
  },
] as const satisfies readonly PresentationTypography[];

const appearancePresetDefinitions = [
  { surfaceId: "boardwork", typographyId: "boardwork" },
  { surfaceId: "paper-v2", typographyId: "boardwork" },
  { surfaceId: "charcoal-v2", typographyId: "boardwork" },
  { surfaceId: "midnight", typographyId: "boardwork" },
] as const;

const surfaceThemeById = new Map<string, PresentationSurfaceTheme>(
  presentationSurfaceThemes.map((theme) => [theme.id, theme]),
);
const accentThemeById = new Map<string, PresentationAccentTheme>(
  presentationAccentThemes.map((theme) => [theme.id, theme]),
);
const typographyById = new Map<string, PresentationTypography>(
  presentationTypographySystems.map((system) => [system.id, system]),
);

function getAccentColor(accentId: string, mode: PresentationThemeMode): string {
  const accent = accentThemeById.get(accentId) ?? presentationAccentThemes[0];
  return accent.colors[mode];
}

export function getPresentationAccentName(
  accentId: string | null | undefined,
  mode: PresentationThemeMode,
): string {
  const accent = accentThemeById.get(accentId ?? "") ?? presentationAccentThemes[0];
  return accent.displayNames[mode];
}

export function getPresentationAccentDescription(
  accentId: string | null | undefined,
  mode: PresentationThemeMode,
): string {
  const accent = accentThemeById.get(accentId ?? "") ?? presentationAccentThemes[0];
  return accent.displayDescriptions[mode];
}
function composeSurfaceColors(
  surface: PresentationSurfaceTheme,
  accentId = surface.defaultAccentId,
): PresentationThemeColors {
  const accent = getAccentColor(accentId, surface.mode);
  return {
    ...surface.colors,
    accent,
    accentSoft: mixOklab(accent, surface.colors.background, 0.16),
  };
}

export const presentationColorThemes = presentationSurfaceThemes.map((surface) => ({
  ...surface,
  colors: composeSurfaceColors(surface),
})) as readonly (PresentationSurfaceTheme & {
  colors: PresentationThemeColors;
})[];

const composeCuratedTheme = (
  surface: PresentationSurfaceTheme,
  typographyId: string,
  accentId = surface.defaultAccentId,
): CuratedPresentationTheme => {
  const typography = typographyById.get(typographyId);
  if (!typography) {
    throw new Error(`Appearance preset ${surface.id} is missing a typography system`);
  }
  return {
    id: surface.id,
    name: surface.name,
    description: surface.description,
    mode: surface.mode,
    colors: composeSurfaceColors(surface, accentId),
    typography,
  };
};

export const curatedPresentationThemes = appearancePresetDefinitions.map(
  ({ surfaceId, typographyId }) => {
    const surface = surfaceThemeById.get(surfaceId);
    if (!surface) {
      throw new Error(`Appearance preset ${surfaceId} is missing a surface`);
    }
    return composeCuratedTheme(surface, typographyId);
  },
) as readonly CuratedPresentationTheme[];

export const appearancePresets = curatedPresentationThemes;

const boardworkTypography = typographyById.get("boardwork")!;
const legacyPresentationThemes = [
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
export const RECOMMENDED_PRESENTATION_THEME_IDS = presentationSurfaceThemes.map(
  (theme) => theme.id,
) as readonly string[];

export function getCuratedPresentationTheme(
  themeId: string | null | undefined,
  accentId?: string | null,
): CuratedPresentationTheme {
  const resolvedThemeId = themeId
    ? LEGACY_THEME_ALIASES[themeId] ?? themeId
    : DEFAULT_PRESENTATION_THEME_ID;
  const surface = surfaceThemeById.get(resolvedThemeId);
  if (surface) {
    const definition = appearancePresetDefinitions.find(
      ({ surfaceId }) => surfaceId === surface.id,
    );
    return composeCuratedTheme(
      surface,
      definition?.typographyId ?? "boardwork",
      accentId ?? undefined,
    );
  }
  const legacyTheme = legacyPresentationThemes.find(
    (theme) => theme.id === themeId,
  );
  return (
    (legacyTheme
      ? {
          ...legacyTheme,
          typography: boardworkTypography,
        }
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
  // typographyId remains accepted in saved/API data for compatibility, but
  // experimental choices no longer alter any presentation surface.
  return boardworkTypography;
}

export function getPresentationThemeAccentId(
  selection: PresentationThemeChoice | null | undefined,
): string | null {
  if (selection?.kind !== "curated") return null;
  const resolvedThemeId = selection.themeId
    ? LEGACY_THEME_ALIASES[selection.themeId] ?? selection.themeId
    : DEFAULT_PRESENTATION_THEME_ID;
  const surface = surfaceThemeById.get(resolvedThemeId);
  if (!surface) return null;
  return accentThemeById.has(selection.accentId ?? "")
    ? selection.accentId!
    : surface.defaultAccentId;
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
    selection?.kind === "curated" ? selection.accentId : undefined,
  ).colors;
}

export function getPresentationThemeSelection(
  themeId: string,
): PresentationThemeChoice {
  return { kind: "curated", themeId: getCuratedPresentationTheme(themeId).id };
}
