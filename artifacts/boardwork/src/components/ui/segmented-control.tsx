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
        "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full",
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
              "inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              isSelected && "bg-background text-foreground shadow-sm"
            )}
            data-testid={`segment-${String(option.value)}`}
          >
            {option.icon && <span className="mr-1.5">{option.icon}</span>}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
