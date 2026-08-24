import { useMemo, type CSSProperties } from "react";
import { Check, ChevronDown, Moon, Sparkles, Sun } from "lucide-react";
import {
  curatedPresentationThemes,
  RECOMMENDED_PRESENTATION_THEME_IDS,
  type PresentationThemeSelection,
} from "@workspace/api-zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  getThemeColors,
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

const featuredThemes = RECOMMENDED_PRESENTATION_THEME_IDS.map((id) =>
  curatedPresentationThemes.find((theme) => theme.id === id),
).filter(
  (theme): theme is (typeof curatedPresentationThemes)[number] =>
    Boolean(theme),
);

const moreThemes = curatedPresentationThemes.filter(
  (theme) => !RECOMMENDED_PRESENTATION_THEME_IDS.includes(theme.id as never),
);

function ThemePreview({
  theme,
  compact = false,
}: {
  theme: (typeof curatedPresentationThemes)[number];
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

function ThemeSwatch({
  theme,
  selected,
  compact = false,
  onSelect,
}: {
  theme: (typeof curatedPresentationThemes)[number];
  selected: boolean;
  compact?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Use ${theme.name} appearance preset`}
      aria-pressed={selected}
      title={theme.description}
      onClick={onSelect}
      className={cn(
        "group text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact
          ? "flex min-w-[4.7rem] flex-col items-center gap-1 rounded-lg border px-1.5 py-1.5"
          : "flex w-full items-center gap-2 rounded-lg border p-2.5",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border hover:bg-muted/50",
      )}
      data-testid={`theme-option-${theme.id === "paper-v2" ? "paper" : theme.id}`}
    >
      <ThemePreview theme={theme} compact={compact} />
      {!compact && (
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            {theme.name}
            {theme.mode === "dark" ? (
              <Moon className="h-3 w-3 text-muted-foreground" aria-label="Dark" />
            ) : (
              <Sun className="h-3 w-3 text-muted-foreground" aria-label="Light" />
            )}
          </span>
          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
            {theme.description}
          </span>
        </span>
      )}
      {compact && (
        <span className="max-w-[4.7rem] truncate text-[11px] font-medium text-foreground">
          {theme.name}
        </span>
      )}
      {selected && (
        <Check
          className={cn(
            "shrink-0 text-primary",
            compact ? "absolute mt-[-2.2rem] ml-[3.6rem] h-3.5 w-3.5 rounded-full bg-background" : "h-4 w-4",
          )}
          aria-hidden="true"
        />
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
  const currentColors = getThemeColors(value);
  const currentTypography = getThemeTypography(value);
  const selectionLabel = useMemo(() => getThemeLabel(value), [value]);

  const selectTheme = (selection: PresentationThemeSelection) => {
    rememberPresentationTheme(selection);
    onChange(selection);
  };

  return (
    <div className="space-y-3" data-testid="presentation-theme-picker">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Appearance preset
          </div>
          <p className="mt-1 max-w-xl text-xs text-muted-foreground">
            One safe choice for the student view, Present mode, and PNG exports.
          </p>
        </div>
        <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">
          {selectionLabel}
        </span>
      </div>

      <div className="flex flex-wrap items-start gap-2">
        {featuredThemes.map((theme) => (
          <ThemeSwatch
            key={theme.id}
            theme={theme}
            compact
            selected={value?.kind !== "custom" && resolvedId === theme.id}
            onSelect={() => selectTheme({ kind: "curated", themeId: theme.id })}
          />
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-10 items-center gap-1 rounded-lg border px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="More appearance presets"
              data-testid="button-more-themes"
            >
              More
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="top"
            className="max-h-[min(76vh,34rem)] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto p-3"
          >
            <div className="mb-3">
              <p className="text-sm font-semibold text-foreground">
                More appearance presets
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Coordinated color and type systems stay readable without manual design controls.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {moreThemes.map((theme) => (
                <ThemeSwatch
                  key={theme.id}
                  theme={theme}
                  selected={value?.kind === "curated" && resolvedId === theme.id}
                  onSelect={() => selectTheme({ kind: "curated", themeId: theme.id })}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

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