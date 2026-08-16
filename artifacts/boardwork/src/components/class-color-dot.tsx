interface ClassColorDotProps {
  color?: string;
  className?: string;
}

export function ClassColorDot({ color, className = "" }: ClassColorDotProps) {
  if (!color) return null;

  return (
    <span
      className={`inline-block size-2.5 shrink-0 rounded-full ${className}`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    />
  );
}