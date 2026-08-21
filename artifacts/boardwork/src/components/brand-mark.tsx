import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-primary/70 p-[2px]",
        className,
      )}
    >
      <span className="relative inline-flex h-full w-full items-center justify-center overflow-hidden rounded-[5px] bg-primary text-primary-foreground">
        <svg
          aria-hidden="true"
          className="h-full w-full"
          viewBox="0 0 24 24"
          focusable="false"
        >
          <path
            fill="currentColor"
            d="m12-1.25 3.18 10.07 10.07 3.18-10.07 3.18L12 25.25 8.82 15.18-1.25 12l10.07-3.18L12-1.25Z"
          />
        </svg>
      </span>
    </span>
  );
}