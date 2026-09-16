import React from "react";
import { cn } from "@/lib/utils";

interface Option<T> {
  label: string;
  value: T;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string | number> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role={ariaLabel ? "group" : undefined}
      aria-label={ariaLabel}
      className={cn(
        "grid min-h-10 min-w-0 w-full items-center rounded-lg border border-input bg-muted/50 p-1 text-muted-foreground",
        className
      )}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
                "flex min-w-0 min-h-9 items-center justify-center gap-1 rounded-md border border-transparent px-2 py-1.5 text-center text-sm font-medium leading-tight ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                "max-[360px]:flex-col max-[360px]:gap-0.5 max-[360px]:px-1 max-[360px]:py-1 max-[360px]:text-xs",
              isSelected
                ? "border-foreground/25 bg-foreground/10 text-foreground dark:bg-foreground/15"
                : "text-muted-foreground hover:bg-background hover:text-foreground"
            )}
            data-testid={`segment-${String(option.value)}`}
          >
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
