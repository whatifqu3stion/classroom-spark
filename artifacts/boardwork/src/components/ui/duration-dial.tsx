import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export const DURATION_DIAL_MIN = 1;
export const DURATION_DIAL_MAX = 60;
export const DURATION_QUICK_OPTIONS = [5, 7, 10] as const;

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
  const previousValue = isWithinDialRange && dialValue > min ? dialValue - 1 : null;
  const nextValue = isWithinDialRange && dialValue < max ? dialValue + 1 : null;

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
          "relative flex min-h-[148px] items-stretch overflow-hidden overscroll-contain rounded-lg border bg-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          errorMessage && "border-destructive",
        )}
        onWheel={handleWheel}
        data-testid="duration-dial-viewport"
      >
        <div className="flex w-12 shrink-0 flex-col items-center justify-center gap-1 border-r bg-muted/20 p-1 sm:w-14">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => adjust(1)}
            disabled={isWithinDialRange && value >= max}
            aria-label="Increase duration"
            data-testid="button-increase-duration"
          >
            <ChevronUp className="h-5 w-5" aria-hidden="true" />
          </Button>
          <div className="h-px w-6 bg-border" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => adjust(-1)}
            disabled={isWithinDialRange && value <= min}
            aria-label="Decrease duration"
            data-testid="button-decrease-duration"
          >
            <ChevronDown className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        <div
          id="duration-dial-value"
          className="flex min-w-0 flex-1 cursor-ns-resize flex-col items-center justify-center py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          role={isWithinDialRange ? "spinbutton" : "group"}
          tabIndex={0}
          aria-label="Duration (min)"
          aria-valuemin={isWithinDialRange ? min : undefined}
          aria-valuemax={isWithinDialRange ? max : undefined}
          aria-valuenow={isWithinDialRange ? value : undefined}
          aria-valuetext={`${value} minutes`}
          aria-invalid={Boolean(errorMessage)}
          onKeyDown={handleKeyDown}
          data-testid="duration-dial-value"
        >
          <span
            className="h-6 text-sm font-medium text-muted-foreground/60 motion-reduce:transition-none"
            aria-hidden="true"
          >
            {previousValue ?? "—"}
          </span>
          <span className="flex items-baseline gap-1 leading-none text-4xl font-semibold tracking-tight text-foreground motion-safe:transition-all motion-reduce:transition-none">
            {value}
            <span className="text-sm font-medium text-muted-foreground">min</span>
          </span>
          <span
            className="h-6 text-sm font-medium text-muted-foreground/60 motion-reduce:transition-none"
            aria-hidden="true"
          >
            {nextValue ?? "—"}
          </span>
          <span className="sr-only">
            Use the up and down arrow keys or mouse wheel to change the duration.
            Range {min} to {max} minutes.
          </span>
        </div>

        <div className="flex w-12 shrink-0 items-center justify-center border-l bg-muted/20 p-1 sm:w-14">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground [writing-mode:vertical-rl]">
            Scroll
          </span>
        </div>
      </div>

      <div
        className="grid grid-cols-3 gap-2"
        role="group"
        aria-label="Quick duration choices"
      >
        {quickOptions.map((option) => {
          const isSelected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "min-h-10 rounded-md border px-3 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "hover:bg-muted/60 motion-reduce:transition-none",
                isSelected && "border-primary bg-primary/10 text-primary",
              )}
              aria-pressed={isSelected}
              aria-label={
                option === 10 ? "Set duration dial to 10 minutes" : `${option} minutes`
              }
              data-testid={`duration-quick-${option}`}
            >
              {option} min
            </button>
          );
        })}
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