import { useMemo, type CSSProperties } from "react";
import { Check, Moon, Sparkles, Sun } from "lucide-react";
import {
  getCuratedPresentationTheme,
  presentationAccentThemes,
  presentationSurfaceThemes,
  type CuratedPresentationTheme,
  type PresentationThemeSelection,
} from "@workspace/api-zod";
import {
  getThemeColors,
  getThemeAccentId,
  getThemeId,
  getThemeLabel,
  getThemeTypography,
  rememberPresentationTheme,
  type BoardworkPresentationTheme,
} from "@/lib/presentation-theme";
import { cn } from "@/lib/utils";
import { FormulaText } from "@/components/formula-text";

interface PresentationThemePickerProps {
  value?: BoardworkPresentationTheme | null;
  onChange: (value: PresentationThemeSelection) => void;
  preview?: {
    title: string;
    task: string;
    prompt?: string;
  };
}

function ThemePreview({
  theme,
  compact = false,
}: {
  theme: CuratedPresentationTheme;
  compact?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-md border border-black/10 shadow-sm",
        compact ? "h-10 w-[4.5rem]" : "h-12 w-[4.75rem]",
      )}
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.primaryText,
        fontFamily: theme.typography.bodyFamily,
      }}
    >
      <strong
        className="absolute left-1.5 top-1 text-base leading-none"
        style={{
          color: theme.colors.primaryText,
          fontFamily: theme.typography.headingFamily,
          fontWeight: theme.typography.headingWeight,
          letterSpacing: theme.typography.headingLetterSpacing,
        }}
      >
        Aa
      </strong>
      <span
        className="absolute bottom-2 left-1.5 right-1.5 h-1 rounded-full"
        style={{ backgroundColor: theme.colors.accent }}
      />
      <span
        className="absolute bottom-1 left-1.5 h-1 w-6 rounded-full opacity-60"
        style={{ backgroundColor: theme.colors.primaryText }}
      />
      <span
        className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
        style={{ backgroundColor: theme.colors.accent }}
      />
    </span>
  );
}

function SurfaceSwatch({
  surface,
  theme,
  selected,
  onSelect,
}: {
  surface: (typeof presentationSurfaceThemes)[number];
  theme: CuratedPresentationTheme;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Use ${surface.name} background`}
      aria-pressed={selected}
      title={surface.description}
      onClick={onSelect}
      className={cn(
        "group relative flex min-w-[7rem] flex-1 flex-col items-center gap-1.5 rounded-lg border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-0",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border hover:bg-muted/50",
      )}
      data-testid={`theme-option-${surface.id === "paper-v2" ? "paper" : surface.id.replace("-v2", "")}`}
    >
      <ThemePreview theme={theme} compact />
      <span className="flex items-center gap-1 text-xs font-medium text-foreground">
        {surface.name}
        {surface.mode === "dark" ? (
          <Moon className="h-3 w-3 text-muted-foreground" aria-label="Dark" />
        ) : (
          <Sun className="h-3 w-3 text-muted-foreground" aria-label="Light" />
        )}
      </span>
      {selected && (
        <Check
          className="absolute mt-[-2.2rem] ml-[5.8rem] h-3.5 w-3.5 rounded-full bg-background text-primary"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

function AccentSwatch({
  accent,
  color,
  selected,
  onSelect,
}: {
  accent: (typeof presentationAccentThemes)[number];
  color: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Use ${accent.name} accent`}
      aria-pressed={selected}
      title={accent.description}
      onClick={onSelect}
      className={cn(
        "relative flex min-w-[5.5rem] flex-1 items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-0",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border hover:bg-muted/50",
      )}
      data-testid={`accent-option-${accent.id}`}
    >
      <span
        className="h-4 w-4 shrink-0 rounded-full border border-black/10"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="truncate text-xs font-medium text-foreground">
        {accent.name}
      </span>
      {selected && (
        <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
      )}
    </button>
  );
}

function getPreviewStyle(
  colors: ReturnType<typeof getThemeColors>,
  typography: ReturnType<typeof getThemeTypography>,
): CSSProperties {
  return {
    "--presentation-bg": colors.background,
    "--presentation-surface": colors.surface,
    "--presentation-primary-text": colors.primaryText,
    "--presentation-secondary-text": colors.secondaryText,
    "--presentation-accent": colors.accent,
    "--presentation-accent-soft": colors.accentSoft,
    "--presentation-font-heading": typography.headingFamily,
    "--presentation-font-body": typography.bodyFamily,
  } as CSSProperties;
}

export function PresentationThemePicker({
  value,
  onChange,
  preview,
}: PresentationThemePickerProps) {
  const resolvedId = getThemeId(value);
  const selectedSurfaceId =
    value?.kind !== "custom" &&
    presentationSurfaceThemes.some((surface) => surface.id === resolvedId)
    ? resolvedId
    : null;
  const selectedSurface = presentationSurfaceThemes.find(
    (surface) => surface.id === selectedSurfaceId,
  );
  const selectedAccentId =
    getThemeAccentId(value) ?? selectedSurface?.defaultAccentId ?? null;
  const currentColors = getThemeColors(value);
  const currentTypography = getThemeTypography(value);
  const selectionLabel = useMemo(() => getThemeLabel(value), [value]);

  const selectSelection = (selection: PresentationThemeSelection) => {
    rememberPresentationTheme(selection);
    onChange(selection);
  };

  return (
    <div className="space-y-3" data-testid="presentation-theme-picker">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Presentation colors
          </div>
          <p className="mt-1 max-w-xl text-xs text-muted-foreground">
            Choose a calm background first. Accents add small signals without competing with the lesson.
          </p>
        </div>
        <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">
          {selectionLabel}
        </span>
      </div>

      <div className="space-y-2" data-testid="presentation-surfaces">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Background
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {presentationSurfaceThemes.map((surface) => {
            const previewTheme = getCuratedPresentationTheme(
              surface.id,
              surface.id === selectedSurfaceId
                ? selectedAccentId
                : surface.defaultAccentId,
            );
            return (
              <SurfaceSwatch
                key={surface.id}
                surface={surface}
                theme={previewTheme}
                selected={value?.kind !== "custom" && selectedSurfaceId === surface.id}
                onSelect={() =>
                  selectSelection({
                    kind: "curated",
                    themeId: surface.id,
                    accentId: surface.defaultAccentId,
                  })
                }
              />
            );
          })}
        </div>
      </div>

      {selectedSurface ? (
        <div className="space-y-2" data-testid="presentation-accents">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Accent
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              A small signal for links, progress, and emphasis.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {presentationAccentThemes.map((accent) => (
              <AccentSwatch
                key={accent.id}
                accent={accent}
                color={getCuratedPresentationTheme(
                  selectedSurface.id,
                  accent.id,
                ).colors.accent}
                selected={selectedAccentId === accent.id}
                onSelect={() =>
                  selectSelection({
                    kind: "curated",
                    themeId: selectedSurface.id,
                    accentId: accent.id,
                  })
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground" data-testid="legacy-theme-note">
          This activity uses a saved appearance. Choose a new background to move it to the calmer color system.
        </p>
      )}

      {preview && (
        <div
          className="overflow-hidden rounded-lg border shadow-sm"
          style={{
            ...getPreviewStyle(currentColors, currentTypography),
            backgroundColor: currentColors.background,
            color: currentColors.primaryText,
            fontFamily: currentTypography.bodyFamily,
          }}
          data-testid="presentation-theme-preview"
        >
          <div
            className="flex items-center justify-between border-b px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{
              borderColor: `${currentColors.primaryText}25`,
              color: currentColors.secondaryText,
            }}
          >
            <span>Student view preview</span>
            <span>{selectionLabel}</span>
          </div>
          <div className="grid gap-1.5 px-3 py-3">
            <strong
              className="text-base leading-tight"
              style={{
                color: currentColors.primaryText,
                fontFamily: currentTypography.headingFamily,
                fontWeight: currentTypography.headingWeight,
                letterSpacing: currentTypography.headingLetterSpacing,
              }}
            >
              <FormulaText>{preview.title || "Your activity title"}</FormulaText>
            </strong>
            <span
              className="text-sm leading-snug"
              style={{ color: currentColors.primaryText }}
            >
              <FormulaText>
                {preview.task || "The student outcome will appear here."}
              </FormulaText>
            </span>
            {preview.prompt && (
              <span
                className="flex gap-1.5 text-xs"
                style={{ color: currentColors.secondaryText }}
              >
                <span style={{ color: currentColors.accent }} aria-hidden="true">
                  •
                </span>
                <FormulaText>{preview.prompt}</FormulaText>
              </span>
            )}
            <span
              className="mt-1 h-1 w-16 rounded-full"
              style={{ backgroundColor: currentColors.accent }}
              aria-hidden="true"
            />
          </div>
        </div>
      )}
    </div>
  );
}