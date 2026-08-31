import { Check, Moon, Sparkles, Sun } from "lucide-react";
import type { CSSProperties } from "react";
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
  rememberPresentationTheme,
  type BoardworkPresentationTheme,
} from "@/lib/presentation-theme";
import { cn } from "@/lib/utils";
import { HelpTooltip } from "@/components/ui/tooltip";

function themeControlStyle(color: string): CSSProperties {
  return { "--theme-control-color": color } as CSSProperties;
}

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
      onClick={onSelect}
      style={themeControlStyle(backgroundColor)}
      className={cn(
        "presentation-theme-option presentation-theme-option--surface relative grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
      data-testid={`theme-option-${surface.id === "paper-v2" ? "paper" : surface.id.replace("-v2", "")}`}
    >
      <span
        aria-hidden="true"
        className="presentation-theme-swatch h-5 w-5 shrink-0 rounded-md border shadow-sm"
        style={{ backgroundColor }}
        data-testid={`theme-swatch-color-${surface.id}`}
      />
      <span className="flex min-w-0 items-center gap-1 text-xs font-medium text-foreground">
        <span className="min-w-0 truncate">{surface.name}</span>
        {surface.mode === "dark" ? (
          <Moon className="presentation-theme-mode h-3 w-3 text-muted-foreground" aria-label="Dark" />
        ) : (
          <Sun className="presentation-theme-mode h-3 w-3 text-muted-foreground" aria-label="Light" />
        )}
      </span>
      {selected && (
        <Check className="presentation-theme-check ml-auto h-3.5 w-3.5 shrink-0" aria-hidden="true" />
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
      onClick={onSelect}
      style={themeControlStyle(color)}
      className={cn(
        "presentation-theme-option presentation-theme-option--accent relative grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
      data-testid={`accent-option-${accent.id}`}
    >
      <span
        className="presentation-theme-swatch h-4 w-4 shrink-0 rounded-full border"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="truncate text-xs font-medium text-foreground">
        {name}
      </span>
      {selected && (
        <Check className="presentation-theme-check ml-auto h-3.5 w-3.5 shrink-0" aria-hidden="true" />
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
  const selectSelection = (selection: PresentationThemeSelection) => {
    rememberPresentationTheme(selection);
    onChange(selection);
  };

  return (
    <div className="space-y-3" data-testid="presentation-theme-picker">
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Visual presentation colors
          <HelpTooltip label="About presentation colors">
            Choose the background first, then use accents for small signals such as links, progress, and emphasis.
          </HelpTooltip>
        </div>
      </div>

      <div className="space-y-2" data-testid="presentation-surfaces">
            <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Background
              <HelpTooltip label="About presentation backgrounds">
                Pick the surface students will see behind the lesson. Light and dark options are labeled for quick comparison.
              </HelpTooltip>
        </div>
        <div className="presentation-theme-grid-container">
          <div className="presentation-theme-grid">
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
      </div>

      {selectedSurface ? (
        <div className="space-y-2" data-testid="presentation-accents">
            <div>
              <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Accent
                <HelpTooltip label="About presentation accents">
                  Accents mark links, progress, and emphasis without changing the background.
                </HelpTooltip>
            </div>
          </div>
          <div className="presentation-theme-grid-container">
            <div className="presentation-theme-grid">
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
        </div>
      ) : (
        <p className="text-xs text-muted-foreground" data-testid="legacy-theme-note">
          This activity uses a saved appearance. Choose a new background to move it to the calmer color system.
        </p>
      )}

    </div>
  );
}
