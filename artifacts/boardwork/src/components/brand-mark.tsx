import { Sparkles } from "lucide-react";
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
      <Sparkles className="relative h-3 w-3" strokeWidth={1.8} />
    </span>
  );
}