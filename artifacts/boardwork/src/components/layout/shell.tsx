import React from "react";
import { Link } from "wouter";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold text-foreground tracking-tight flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <div className="w-2 h-2 bg-primary-foreground rounded-full" />
            </div>
            Boardwork
          </Link>
          <div className="text-sm font-medium text-muted-foreground">
            Stage 1 MVP
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
