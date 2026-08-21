import React from "react";
import { Link, useLocation } from "wouter";
import { History, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand-mark";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [location] = useLocation();
  const isHistory = location === "/history";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold text-foreground tracking-tight flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
            <BrandMark />
            Boardwork
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              data-testid="nav-workspace"
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                !isHistory ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Workspace</span>
            </Link>
            <Link
              href="/history"
              data-testid="nav-history"
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                isHistory ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}