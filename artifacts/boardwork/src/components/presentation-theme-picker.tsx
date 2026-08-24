import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import {
  curatedPresentationThemes,
  isHexColor,
  isPresentationThemeReadable,
  normalizeHexColor,
  RECOMMENDED_PRESENTATION_THEME_IDS,
  type CustomPresentationThemeAnchors,
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
  rememberPresentationTheme,
  type BoardworkPresentationTheme,
} from "@/lib/presentation-theme";
import { cn } from "@/lib/utils";

interface PresentationThemePickerProps {
  value?: BoardworkPresentationTheme | null;
  onChange: (value: PresentationThemeSelection) => void;
  preview?: {
    title: string;
    task: string;
    prompt?: string;
  };
}

const recommendedThemes = RECOMMENDED_PRESENTATION_THEME_IDS.map((id) =>
  curatedPresentationThemes.find((theme) => theme.id === id),
).filter((theme): theme is (typeof curatedPresentationThemes)[number] => Boolean(theme));

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
      aria-label={`Use ${theme.name} presentation theme`}
      aria-pressed={selected}
      title={theme.description}
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-2 rounded-lg border text-left transition-colors",
        compact ? "h-9 px-2" : "w-full p-2.5",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border hover:bg-muted/50",
      )}
      data-testid={`theme-option-${theme.id}`}
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-md border border-black/10 shadow-sm",
          compact ? "h-5 w-7" : "h-9 w-12",
        )}
        style={{ backgroundColor: theme.colors.background }}
      >
        <span
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{ backgroundColor: theme.colors.accent }}
        />
        <span
          className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: theme.colors.primaryText }}
        />
      </span>
      {!compact && (
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-foreground">
            {theme.name}
          </span>
          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
            {theme.description}
          </span>
        </span>
      )}
      {selected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
    </button>
  );
}

export function PresentationThemePicker({
  value,
  onChange,
  preview,
}: PresentationThemePickerProps) {
  const [customizing, setCustomizing] = useState(value?.kind === "custom");
  const [open, setOpen] = useState(false);
  const resolvedId = getThemeId(value);
  const currentColors = getThemeColors(value);
  const customAnchors: CustomPresentationThemeAnchors =
    value?.kind === "custom" && value.anchors
      ? value.anchors
      : {
          background: currentColors.background,
          text: currentColors.primaryText,
          accent: currentColors.accent,
        };
  const readable = isPresentationThemeReadable(customAnchors);

  const selectionLabel = useMemo(() => getThemeLabel(value), [value]);

  const selectTheme = (selection: PresentationThemeSelection) => {
    setCustomizing(false);
    rememberPresentationTheme(selection);
    onChange(selection);
  };

  const updateCustomAnchor = (
    key: "background" | "text" | "accent",
    nextValue: string,
  ) => {
    const normalized = normalizeHexColor(nextValue);
    if (!normalized) return;
    const next: PresentationThemeSelection = {
      kind: "custom",
      sourceThemeId:
        value?.kind === "curated"
          ? value.themeId
          : value?.kind === "custom"
            ? value.sourceThemeId
            : undefined,
      anchors: { ...customAnchors, [key]: normalized },
    };
    rememberPresentationTheme(next);
    onChange(next);
  };

  const resetCustom = () => {
    selectTheme({
      kind: "curated",
      themeId: value?.kind === "custom" && value.sourceThemeId
        ? value.sourceThemeId
        : "paper",
    });
  };

  return (
    <div className="space-y-3" data-testid="presentation-theme-picker">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Presentation theme
          </div>
          <p className="mt-1 max-w-xl text-xs text-muted-foreground">
            Changes the activity students see in Present and in PNG exports.
          </p>
        </div>
        <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">
          {selectionLabel}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {recommendedThemes.slice(0, 4).map((theme) => (
          <ThemeSwatch
            key={theme.id}
            theme={theme}
            compact
            selected={value?.kind !== "custom" && resolvedId === theme.id}
            onSelect={() => selectTheme({ kind: "curated", themeId: theme.id })}
          />
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1 rounded-lg border px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="More presentation themes"
              data-testid="button-more-themes"
            >
              More
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="top"
            className="max-h-[min(76vh,34rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto p-3"
          >
            <div className="mb-3">
              <p className="text-sm font-semibold text-foreground">Choose a theme</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Curated palettes keep type, hierarchy, and meaning readable.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {curatedPresentationThemes.map((theme) => (
                <ThemeSwatch
                  key={theme.id}
                  theme={theme}
                  selected={value?.kind === "curated" && resolvedId === theme.id}
                  onSelect={() => {
                    selectTheme({ kind: "curated", themeId: theme.id });
                    setOpen(false);
                  }}
                />
              ))}
            </div>
            <div className="mt-3 border-t pt-3">
              <button
                type="button"
                onClick={() => setCustomizing((current) => !current)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted/50",
                  customizing && "border-primary bg-primary/5",
                )}
                aria-expanded={customizing}
                data-testid="button-customize-theme"
              >
                <span>
                  <span className="block">Customize</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    Set your own background, text, and accent
                  </span>
                </span>
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", customizing && "rotate-180")}
                  aria-hidden="true"
                />
              </button>
              {customizing && (
                <div className="mt-3 space-y-3" data-testid="theme-customize-panel">
                  {(["background", "text", "accent"] as const).map((key) => {
                    const label = key === "text" ? "Text" : key[0].toUpperCase() + key.slice(1);
                    const valueForInput = customAnchors[key];
                    return (
                      <label key={key} className="grid grid-cols-[1fr_auto] items-center gap-2 text-sm">
                        <span className="font-medium text-foreground">{label}</span>
                        <span className="flex items-center gap-2">
                          <input
                            type="color"
                            aria-label={`${label} color`}
                            value={valueForInput}
                            onChange={(event) => updateCustomAnchor(key, event.target.value)}
                            className="h-8 w-9 cursor-pointer rounded border bg-background p-0.5"
                          />
                          <input
                            type="text"
                            aria-label={`${label} HEX`}
                            value={valueForInput}
                            onChange={(event) => {
                              const next = event.target.value;
                              if (isHexColor(next)) updateCustomAnchor(key, next);
                            }}
                            className="h-8 w-[5.5rem] rounded-md border bg-background px-2 font-mono text-xs uppercase outline-none focus:ring-2 focus:ring-ring"
                            inputMode="text"
                            maxLength={7}
                          />
                        </span>
                      </label>
                    );
                  })}
                  {!readable && (
                    <div
                      className="rounded-md border border-amber-500/40 bg-amber-50 px-2.5 py-2 text-xs text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
                      role="alert"
                      data-testid="theme-contrast-warning"
                    >
                      <div className="flex gap-2">
                        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>
                          Text may be hard to read on this background. Try Paper, Ink, or another curated theme.
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-6">
                        <span className="text-[11px] font-medium text-amber-900/70 dark:text-amber-100/70">
                          Safer alternatives:
                        </span>
                        {(["paper", "ink"] as const).map((themeId) => (
                          <button
                            key={themeId}
                            type="button"
                            className="rounded border border-amber-700/30 px-1.5 py-0.5 text-[11px] font-medium text-amber-950 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/50"
                            onClick={() => selectTheme({ kind: "curated", themeId })}
                          >
                            {themeId === "paper" ? "Paper" : "Ink"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                      onClick={resetCustom}
                      data-testid="button-reset-theme"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      Reset
                    </button>
                    <span className="text-[11px] text-muted-foreground">Preview updates instantly</span>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {preview && (
        <div
          className="overflow-hidden rounded-lg border shadow-sm"
          style={{
            backgroundColor: currentColors.background,
            color: currentColors.primaryText,
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
            <strong className="text-base leading-tight">
              {preview.title || "Your activity title"}
            </strong>
            <span className="text-sm leading-snug" style={{ color: currentColors.primaryText }}>
              {preview.task || "The student outcome will appear here."}
            </span>
            {preview.prompt && (
              <span className="flex gap-1.5 text-xs" style={{ color: currentColors.secondaryText }}>
                <span style={{ color: currentColors.accent }} aria-hidden="true">•</span>
                {preview.prompt}
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
