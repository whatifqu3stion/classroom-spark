import React, { useState } from "react";
import { useListCurriculumSources } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Search, Plus, AlertCircle, BookOpen } from "lucide-react";
import { CurriculumSourceDialog } from "./curriculum-source-dialog";
import { CurriculumAddDialog } from "./curriculum-add-dialog";
import { useBoardwork } from "@/store/boardwork-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CurriculumManager({ classId }: { classId: string }) {
  const { data: listResponse, isLoading, isError, refetch } = useListCurriculumSources(classId);
  const { appState } = useBoardwork();
  const units = appState?.units || [];

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("class");

  if (isLoading) {
    return <div className="py-4 flex justify-center"><Loader2 className="animate-spin w-5 h-5 text-muted-foreground" /></div>;
  }

  if (isError || !listResponse) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-destructive mb-2">Could not load curriculum sources.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  if (!listResponse.ready) {
    return (
      <div className="rounded-md border border-border/40 p-4 bg-muted/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Curriculum setup required</h4>
            <p className="text-xs text-muted-foreground">
              Your workspace needs an app password to fetch official sources, extract PDFs, or save manual text. 
              Existing class context and Saved Context chips remain fully usable.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const items = listResponse.items;
  const visibleItems = items.filter(s => filter === "class" ? !s.unitId : s.unitId === filter);
  const activeUnitId = filter === "class" ? null : filter;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Curriculum Sources</span>
          {units.length > 0 && (
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-7 text-xs w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="class">Class-wide</SelectItem>
                {units.map(u => (
                  <SelectItem key={u.id} value={u.id}>Unit: {u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setAddDialogOpen(true)} className="h-8 gap-1 px-2" data-testid="button-add-curriculum">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>
      
      {visibleItems.length === 0 ? (
        <div className="text-center py-6 border border-dashed rounded-lg">
          <BookOpen className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-20" />
          <p className="text-sm font-medium text-foreground">No sources added</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[250px] mx-auto">
            {filter === "class" ? "Add class-wide curriculum text, PDFs, or discover official frameworks." : "Add curriculum specific to this unit."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visibleItems.map(source => (
            <li key={source.id} className="flex items-center justify-between p-3 border rounded-md hover:border-primary/50 transition-colors bg-card cursor-pointer group" onClick={() => setSelectedSourceId(source.id)} data-testid={`curriculum-source-${source.id}`}>
              <div className="flex items-start gap-3 min-w-0">
                {source.kind === 'pdf' ? <FileText className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /> :
                 source.kind === 'web' ? <Search className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" /> :
                 <BookOpen className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate boardwork-user-content">{source.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1.5 py-0.5 bg-muted rounded-sm">
                      {source.status}
                    </span>
                    {source.subject && (
                      <span className="text-xs text-muted-foreground truncate">{source.subject}</span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CurriculumAddDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        classId={classId}
        unitId={activeUnitId}
        isApiReady={listResponse.ready}
      />

      {selectedSourceId && (
        <CurriculumSourceDialog
          open={!!selectedSourceId}
          onOpenChange={(open) => !open && setSelectedSourceId(null)}
          classId={classId}
          sourceId={selectedSourceId}
        />
      )}
    </div>
  );
}
