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
      <svg
        aria-hidden="true"
        className="h-full w-full"
        viewBox="0 0 24 24"
        focusable="false"
      >
        <path
          fill="currentColor"
          d="m12 1.75 2.35 7.9 7.9 2.35-7.9 2.35-2.35 7.9-2.35-7.9-7.9-2.35 7.9-2.35L12 1.75Z"
          stroke="hsl(var(--primary))"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
      </svg>
    </span>
  );
}