import { useMemo } from "react";
import { Check, Moon, Sparkles, Sun } from "lucide-react";
import {
  getCuratedPresentationTheme,
  getPresentationAccentName,
  presentationAccentThemes,
  presentationSurfaceThemes,
  type PresentationThemeSelection,
} from "@workspace/api-zod";
import {
  getThemeAccentId,
  getThemeId,
  getThemeLabel,
  rememberPresentationTheme,
  type BoardworkPresentationTheme,
} from "@/lib/presentation-theme";
import { cn } from "@/lib/utils";

interface PresentationThemePickerProps {
  value?: BoardworkPresentationTheme | null;
  onChange: (value: PresentationThemeSelection) => void;
}

function SurfaceSwatch({
  surface,
  backgroundColor,
  selected,
  onSelect,
}: {
  surface: (typeof presentationSurfaceThemes)[number];
  backgroundColor: string;
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
        "group relative flex min-w-[6rem] flex-1 flex-col items-center gap-1 rounded-lg border p-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-0 sm:max-w-[8.75rem]",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border hover:bg-muted/50",
      )}
      data-testid={`theme-option-${surface.id === "paper-v2" ? "paper" : surface.id.replace("-v2", "")}`}
    >
      <span
        aria-hidden="true"
        className="h-8 w-16 shrink-0 rounded-md border border-black/10 shadow-sm"
        style={{ backgroundColor }}
        data-testid={`theme-swatch-color-${surface.id}`}
      />
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
          className="absolute right-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-background text-primary"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

function AccentSwatch({
  accent,
  name,
  color,
  selected,
  onSelect,
}: {
  accent: (typeof presentationAccentThemes)[number];
  name: string;
  color: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Use ${name} accent`}
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
        {name}
      </span>
      {selected && (
        <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
      )}
    </button>
  );
}

export function PresentationThemePicker({
  value,
  onChange,
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
  const selectionLabel = useMemo(() => {
    if (selectedSurface && selectedAccentId) {
      return `${selectedSurface.name} · ${getPresentationAccentName(selectedAccentId, selectedSurface.mode)}`;
    }
    return getThemeLabel(value);
  }, [selectedAccentId, selectedSurface, value]);

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
            Visual presentation colors
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
                backgroundColor={previewTheme.colors.background}
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
                name={getPresentationAccentName(accent.id, selectedSurface.mode)}
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

    </div>
  );
}
