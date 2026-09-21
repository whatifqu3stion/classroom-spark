import React, { useState } from "react";
import { ChevronDown, BookOpen, Link as LinkIcon, FileText, Globe } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { CurriculumSnapshot } from "@workspace/api-zod";
import { getGetCurriculumPdfUrl } from "@workspace/api-client-react";

export function CurriculumSnapshotDetails({ snapshot, classId }: { snapshot?: CurriculumSnapshot | null; classId: string }) {
  const [open, setOpen] = useState(false);

  if (!snapshot || !snapshot.sources || snapshot.sources.length === 0) {
    return null;
  }

  const { focus, sources } = snapshot;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-8 border rounded-lg bg-card overflow-hidden" data-testid="curriculum-snapshot-collapsible">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          Based on curriculum
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t px-4 py-4 space-y-4">
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Curriculum Focus</h4>
          <p className="text-sm font-medium text-foreground">{focus.objective}</p>
        </div>
        
        {sources.map((source, idx) => (
          <div key={idx} className="space-y-2 pt-2 border-t border-border/40">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</h4>
            <div className="bg-muted/30 rounded-md p-3 text-sm">
              <div className="flex items-start gap-2 mb-1">
                {source.kind === 'web' ? <Globe className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /> :
                 source.kind === 'pdf' ? <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /> :
                 <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
                <div className="min-w-0">
                  <p className="font-medium text-foreground break-words">{source.title} <span className="font-normal text-muted-foreground ml-1">v{source.version}</span></p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap mt-0.5">
                    {source.publisher && <span>{source.publisher}</span>}
                    {source.publisher && source.subject && <span>•</span>}
                    {source.subject && <span>{source.subject}</span>}
                    {source.programmeYear && <span>• {source.programmeYear}</span>}
                    {source.kind === 'manual' && <span>• Teacher-provided</span>}
                  </p>
                </div>
              </div>
              
              <div className="mt-3 pl-6 border-l-2 border-primary/20">
                <p className="text-xs text-muted-foreground mb-1 italic">"{source.excerpt}"</p>
                {source.locator && (
                  <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1.5">
                    {source.locator}
                  </p>
                )}
                {source.url && (
                  <a href={source.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-primary hover:underline mt-2 w-fit">
                    <LinkIcon className="w-3 h-3" />
                    {new URL(source.url).hostname}
                  </a>
                )}
                 {source.kind === "pdf" && (
                   <div className="mt-2">
                     <a
                       href={`${getGetCurriculumPdfUrl(classId, source.sourceId)}${source.locator.match(/\b(?:page|p\.?)\s*(\d+)/i)?.[1] ? `#page=${source.locator.match(/\b(?:page|p\.?)\s*(\d+)/i)![1]}` : ""}`}
                       target="_blank"
                       rel="noreferrer"
                       className="inline-flex min-h-9 items-center gap-1 text-xs text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                     >
                       <FileText className="size-3" />
                       Open saved PDF
                     </a>
                     <p className="text-xs text-muted-foreground">
                       Available while the source is retained. This quotation remains after deletion.
                     </p>
                   </div>
                 )}
              </div>
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
