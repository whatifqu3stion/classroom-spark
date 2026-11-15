import React from "react";
import { Link, useLocation } from "wouter";
import { History, LayoutDashboard, PanelsTopLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand-mark";
import { AISettings } from "@/components/ai-settings";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [location] = useLocation();
  const isHistory = location === "/history";
  const isHomebase = location === "/homebase";

  return (
    <div className="workspace-shell min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
      <header className="workspace-header sticky top-0 z-40 border-b">
        <div className="container mx-auto px-3 md:px-8 flex flex-wrap items-center justify-between gap-y-1 py-2 sm:h-14 sm:flex-nowrap sm:py-0">
          <Link
            href="/app"
            className="workspace-brand font-semibold text-foreground tracking-tight flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            <BrandMark />
            Boardwork
          </Link>
          <div className="ml-auto sm:order-3 sm:ml-2"><AISettings /></div>
          <nav aria-label="Main navigation" className="workspace-navigation order-3 flex w-full items-center justify-between gap-1 sm:order-2 sm:ml-auto sm:w-auto sm:gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/homebase"
                  aria-label="Homebase"
                  data-testid="nav-homebase"
                  aria-current={isHomebase ? "page" : undefined}
                  className={cn(
                    "workspace-nav-item flex min-w-0 flex-1 flex-col sm:flex-row sm:flex-none items-center gap-1 sm:gap-2 px-1 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors",
                    isHomebase
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <PanelsTopLeft className="w-4 h-4" aria-hidden="true" />
                  <span className="min-w-0">Homebase</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                Your saved classroom tools and routines.
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/app"
                  aria-label="Workspace"
                  data-testid="nav-workspace"
                  aria-current={!isHistory && !isHomebase ? "page" : undefined}
                  className={cn(
                    "workspace-nav-item flex min-w-0 flex-1 flex-col sm:flex-row sm:flex-none items-center gap-1 sm:gap-2 px-1 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors",
                    !isHistory && !isHomebase
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                  <span className="min-w-0">Workspace</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Create and edit today’s board.</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/history"
                  aria-label="History"
                  data-testid="nav-history"
                  aria-current={isHistory ? "page" : undefined}
                  className={cn(
                    "workspace-nav-item flex min-w-0 flex-1 flex-col sm:flex-row sm:flex-none items-center gap-1 sm:gap-2 px-1 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors",
                    isHistory
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <History className="w-4 h-4" aria-hidden="true" />
                  <span className="min-w-0">History</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                Reopen, remix, or present saved boards.
              </TooltipContent>
            </Tooltip>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
