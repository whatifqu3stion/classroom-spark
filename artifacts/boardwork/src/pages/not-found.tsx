import { Link } from "wouter";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center"><BrandMark /></div>
        <h1 className="boardwork-dialog-title">This page isn’t here</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          The link may have changed. Return to Boardwork to find your workspace and classroom tools.
        </p>
        <Button asChild className="mt-6"><Link href="/">Back to Boardwork</Link></Button>
      </div>
    </main>
  );
}
