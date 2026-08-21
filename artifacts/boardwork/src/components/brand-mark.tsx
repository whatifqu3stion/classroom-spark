import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary text-primary-foreground",
        className,
      )}
    >
      <span className="absolute inset-[4px] rounded-[3px] border border-current/70" />
      <svg
        aria-hidden="true"
        className="relative h-3.5 w-3.5"
        viewBox="0 0 16 16"
        focusable="false"
      >
        <path
          fill="currentColor"
          d="M8 0.9 9.3 5.7 14.1 7l-4.8 1.3L8 13.1 6.7 8.3 1.9 7l4.8-1.3L8 0.9Z"
        />
      </svg>
    </span>
  );
}