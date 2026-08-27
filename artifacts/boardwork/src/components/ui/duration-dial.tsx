import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export const DURATION_DIAL_MIN = 1;
export const DURATION_DIAL_MAX = 60;
export const DURATION_DIAL_ANCHOR = 10;
export const DURATION_QUICK_OPTIONS = [3, 5, 7] as const;

interface DurationDialProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  quickOptions?: readonly number[];
  compatibilityMessage?: string | null;
  errorMessage?: string | null;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function DurationDial({
  value,
  onChange,
  min = DURATION_DIAL_MIN,
  max = DURATION_DIAL_MAX,
  quickOptions = DURATION_QUICK_OPTIONS,
  compatibilityMessage,
  errorMessage,
}: DurationDialProps) {
  const isWholeMinute = Number.isInteger(value);
  const isWithinDialRange = isWholeMinute && value >= min && value <= max;
  const dialValue = isWithinDialRange ? value : clamp(value, min, max);
  const isQuickSelection = quickOptions.includes(value);
  const isDialSelection = !isQuickSelection || value === DURATION_DIAL_ANCHOR;
  const rollerValue = isDialSelection ? value : DURATION_DIAL_ANCHOR;
  const visibleQuickOptions = quickOptions.filter(
    (option) => option !== DURATION_DIAL_ANCHOR,
  );
  const previousValues =
    isWithinDialRange && rollerValue > min
      ? [rollerValue - 2, rollerValue - 1].filter((item) => item >= min)
      : [];
  const nextValues =
    isWithinDialRange && rollerValue < max
      ? [rollerValue + 1, rollerValue + 2].filter((item) => item <= max)
      : [];

  const setDialValue = (nextValue: number) => {
    if (!Number.isInteger(nextValue)) return;
    onChange(clamp(nextValue, min, max));
  };

  const adjust = (amount: number) => {
    const startingValue = isWithinDialRange ? value : max;
    setDialValue(startingValue + amount);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    let nextValue: number | null = null;
    if (event.key === "ArrowUp" || event.key === "PageUp" || event.key === "+") {
      nextValue = dialValue + (event.key === "PageUp" ? 5 : 1);
    } else if (
      event.key === "ArrowDown" ||
      event.key === "PageDown" ||
      event.key === "-"
    ) {
      nextValue = dialValue - (event.key === "PageDown" ? 5 : 1);
    } else if (event.key === "Home") {
      nextValue = min;
    } else if (event.key === "End") {
      nextValue = max;
    }

    if (nextValue === null) return;
    event.preventDefault();
    setDialValue(nextValue);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.deltaY === 0) return;
    adjust(event.deltaY < 0 ? 1 : -1);
  };

  return (
    <div className="space-y-2" data-testid="duration-dial">
      <div
        className={cn(
          "grid min-h-[148px] min-w-0 grid-cols-4 gap-1 overflow-hidden overscroll-contain rounded-lg border bg-background p-1",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 sm:gap-1.5 sm:p-1.5",
          errorMessage && "border-destructive",
        )}
        onWheel={isDialSelection ? handleWheel : undefined}
        data-testid="duration-dial-viewport"
      >
        {visibleQuickOptions.map((option) => {
          const isSelected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "min-w-0 rounded-md border px-1 py-2 text-sm font-medium transition-colors",
                "flex min-h-10 flex-col items-center justify-center gap-0.5 leading-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "hover:bg-muted/60 motion-reduce:transition-none",
                isSelected && "border-primary bg-primary/10 text-primary",
              )}
              aria-pressed={isSelected}
              aria-label={`${option} minutes`}
              data-testid={`duration-quick-${option}`}
            >
              <span className="text-xl font-semibold leading-none tracking-tight">{option}</span>
              <span className="text-[0.65rem] font-medium leading-none text-muted-foreground">
                min
              </span>
            </button>
          );
        })}

        {isDialSelection ? (
          <div
            className="relative flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-md border border-primary bg-primary/5 px-1 py-2 text-center text-primary ring-1 ring-primary/25 transition-colors hover:border-foreground/25"
            role="group"
            aria-label="10 minute adjustable duration"
            data-selected="true"
            onClick={() => setDialValue(DURATION_DIAL_ANCHOR)}
            data-testid="duration-quick-10"
          >
            <div
              id="duration-dial-value"
              className="flex min-w-0 cursor-ns-resize flex-1 flex-col items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              role={isWithinDialRange ? "spinbutton" : "group"}
              tabIndex={0}
              aria-label="Duration (min)"
              aria-valuemin={isWithinDialRange ? min : undefined}
              aria-valuemax={isWithinDialRange ? max : undefined}
              aria-valuenow={isWithinDialRange ? value : undefined}
              aria-valuetext={`${value} minutes`}
              aria-invalid={Boolean(errorMessage)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setDialValue(DURATION_DIAL_ANCHOR);
                  return;
                }
                handleKeyDown(event);
              }}
              data-testid="duration-dial-value"
            >
              {previousValues.map((neighbor) => {
                const distance = rollerValue - neighbor;
                return (
                  <span
                    key={`previous-${neighbor}`}
                    className="duration-dial-neighbor whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium leading-none text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
                    style={{ opacity: 0.28 + (3 - distance) * 0.2 }}
                    aria-hidden="true"
                    data-testid={`duration-dial-neighbor-${neighbor}`}
                  >
                    {neighbor}
                  </span>
                );
              })}
              <span
                className="relative z-10 my-0.5 flex cursor-pointer flex-col items-center gap-0.5 rounded-full bg-foreground px-2 py-1.5 leading-none text-background transition-colors hover:bg-foreground/80 motion-safe:transition-all motion-reduce:transition-none"
                data-testid="duration-dial-current"
                onClick={() => setDialValue(DURATION_DIAL_ANCHOR)}
              >
                <span className="text-xl font-semibold tracking-tight">
                  {isWholeMinute ? rollerValue : value}
                </span>
                <span className="text-[0.6rem] font-medium">min</span>
              </span>
              {nextValues.map((neighbor, index) => {
                const distance = index + 1;
                return (
                  <span
                    key={`next-${neighbor}`}
                    className="duration-dial-neighbor whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium leading-none text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
                    style={{ opacity: 0.28 + (3 - distance) * 0.2 }}
                    aria-hidden="true"
                    data-testid={`duration-dial-neighbor-${neighbor}`}
                  >
                    {neighbor}
                  </span>
                );
              })}
              <span className="sr-only">
                Use the up and down arrow keys or mouse wheel to change the duration.
                Range {min} to {max} minutes.
              </span>
            </div>

            <div className="absolute right-0.5 top-1/2 flex -translate-y-1/2 flex-col gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground"
                onClick={(event) => {
                  event.stopPropagation();
                  adjust(1);
                }}
                disabled={isWithinDialRange && value >= max}
                aria-label="Increase duration"
                data-testid="button-increase-duration"
              >
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground"
                onClick={(event) => {
                  event.stopPropagation();
                  adjust(-1);
                }}
                disabled={isWithinDialRange && value <= min}
                aria-label="Decrease duration"
                data-testid="button-decrease-duration"
              >
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
            <span className="sr-only">Starts adjustable scrolling at 10 minutes.</span>
          </div>
        ) : (
          <button
            type="button"
            className="relative flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-md border border-border bg-background px-1 py-2 text-center transition-colors hover:border-foreground/25 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
            aria-pressed="false"
            aria-label="10 minutes, adjustable after selection"
            data-selected="false"
            onClick={() => setDialValue(DURATION_DIAL_ANCHOR)}
            data-testid="duration-quick-10"
          >
            <span className="text-xl font-semibold leading-none tracking-tight">10</span>
            <span className="text-[0.65rem] font-medium leading-none text-muted-foreground">min</span>
            <span className="sr-only">
              Select 10 minutes to start adjusting one minute at a time.
            </span>
          </button>
        )}
      </div>

      {compatibilityMessage && (
        <p className="text-xs text-muted-foreground" data-testid="duration-compatibility">
          {compatibilityMessage}
        </p>
      )}
      {errorMessage && (
        <p className="text-xs text-destructive" role="alert" data-testid="duration-dial-error">
          {errorMessage}
        </p>
      )}
    </div>
  );
}