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
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "grid min-h-9 min-w-0 w-full items-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
                "flex min-w-0 min-h-9 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-center text-sm font-medium leading-tight ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                "max-[360px]:flex-col max-[360px]:gap-0.5 max-[360px]:px-1 max-[360px]:py-1 max-[360px]:text-xs",
              isSelected && "bg-background text-foreground shadow-sm"
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
