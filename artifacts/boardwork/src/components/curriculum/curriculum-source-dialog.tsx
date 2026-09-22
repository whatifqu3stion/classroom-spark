import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useGetCurriculumSource, useUpdateCurriculumSource, useDeleteCurriculumSource, useRefreshCurriculumSource, getListCurriculumSourcesQueryKey, getGetCurriculumSourceQueryKey, getGetCurriculumPdfUrl } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, CheckCircle2, Globe, FileText, AlertCircle, RefreshCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { CurriculumAddDialog } from "./curriculum-add-dialog";

export function CurriculumSourceDialog({
  open,
  onOpenChange,
  classId,
  sourceId
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  sourceId: string;
}) {
  const { data: source, isLoading, refetch } = useGetCurriculumSource(classId, sourceId);
  const updateMut = useUpdateCurriculumSource();
  const deleteMut = useDeleteCurriculumSource();
  const refreshMut = useRefreshCurriculumSource();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [subject, setSubject] = useState("");
  const [framework, setFramework] = useState("");
  const [programmeYear, setProgrammeYear] = useState("");
  const [objectives, setObjectives] = useState<any[]>([]);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const lastInitializedIdentity = React.useRef<string | null>(null);

  useEffect(() => {
    if (source) {
      const identity = `${source.id}-${source.version}`;
      if (lastInitializedIdentity.current !== identity) {
        lastInitializedIdentity.current = identity;
        setTitle(source.title || "");
        setSummary(source.summary || "");
        setSubject(source.subject || "");
        setFramework(source.framework || "");
        setProgrammeYear(source.programmeYear || "");
        setObjectives(source.objectives ? JSON.parse(JSON.stringify(source.objectives)) : []);
      }
    }
  }, [source]);

  if (isLoading || !source) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        </DialogContent>
      </Dialog>
    );
  }

  const isDraft = source.status === 'draft';
  const isApproved = source.status === 'approved';
  
  const handleSave = (newStatus?: 'approved' | 'draft' | 'inactive') => {
    updateMut.mutate({
      classId,
      sourceId,
      data: {
        version: source.version,
        title,
        summary,
        subject,
        framework: framework || null,
        programmeYear: programmeYear || null,
        objectives,
        status: newStatus
      }
    }, {
      onSuccess: (updatedSource) => {
        queryClient.setQueryData(getGetCurriculumSourceQueryKey(classId, sourceId), updatedSource);
        queryClient.invalidateQueries({ queryKey: getListCurriculumSourcesQueryKey(classId) });
        queryClient.invalidateQueries({ queryKey: getGetCurriculumSourceQueryKey(classId, sourceId) });
        
        if (newStatus === 'approved') toast({ title: "Source approved" });
        else if (newStatus === 'inactive') toast({ title: "Source deactivated" });
        else toast({ title: "Draft saved" });
      },
      onError: () => toast({ title: "Save failed", variant: "destructive" })
    });
  };

  const handleDelete = () => {
    deleteMut.mutate({ classId, sourceId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCurriculumSourcesQueryKey(classId) });
        setDeleteAlertOpen(false);
        onOpenChange(false);
      },
      onError: () => toast({ title: "Delete failed", description: "This source may be in use.", variant: "destructive" })
    });
  };

  const handleRefresh = () => {
    refreshMut.mutate({
      classId,
      sourceId,
      data: { version: source.version }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCurriculumSourcesQueryKey(classId) });
        refetch();
        toast({ title: "Source refreshed", description: "A new draft has been created." });
      },
      onError: () => toast({ title: "Refresh failed", variant: "destructive" })
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val && !updateMut.isPending) onOpenChange(val); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-start justify-between pr-4">
            <div>
              <DialogTitle className="text-xl">{source.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-muted rounded-sm text-muted-foreground">
                  {source.status}
                </span>
                {source.kind === 'web' && <span className="text-xs text-muted-foreground flex items-center"><Globe className="w-3 h-3 mr-1" /> Web Discovery</span>}
                {source.kind === 'pdf' && <span className="text-xs text-muted-foreground flex items-center"><FileText className="w-3 h-3 mr-1" /> PDF Upload</span>}
                {source.publisher && <span className="text-xs text-muted-foreground">• {source.publisher}</span>}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {source.status === 'delete_failed' && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Failed to delete this source previously. You can try again.</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="source-title">Title</Label>
                <Input id="source-title" value={title} onChange={e => setTitle(e.target.value)} className="min-w-0" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="source-subject">Subject</Label>
                <Input id="source-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Design" className="min-w-0" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="source-framework">Framework</Label>
                <Input id="source-framework" value={framework} onChange={e => setFramework(e.target.value)} placeholder="e.g. IB MYP" className="min-w-0" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="source-programme-year">Programme Year</Label>
                <Input id="source-programme-year" value={programmeYear} onChange={e => setProgrammeYear(e.target.value)} placeholder="e.g. Year 2" className="min-w-0" />
              </div>
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label htmlFor="source-summary">Extracted Summary / Interpretation</Label>
              <Textarea id="source-summary" value={summary} onChange={e => setSummary(e.target.value)} className="min-h-[100px] min-w-0" />
              <p className="text-[10px] text-muted-foreground">You can correct the AI's interpretation here.</p>
            </div>

            <div className="space-y-3">
              <Label>Objectives & Skills</Label>
              {objectives.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No objectives extracted.</p>
              ) : (
                <div className="space-y-3 border rounded-md p-1 bg-muted/10">
                  {objectives.map((obj, i) => (
                    <div key={obj.id} className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50 transition-colors">
                      <Checkbox 
                        checked={obj.selected} 
                        onCheckedChange={(checked) => {
                          const next = [...objectives];
                          next[i].selected = !!checked;
                          setObjectives(next);
                        }}
                        className="mt-1"
                      />
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <Textarea
                            value={obj.label} 
                            onChange={(e) => {
                              const next = [...objectives];
                              next[i].label = e.target.value;
                              setObjectives(next);
                            }}
                            className="min-h-16 text-sm font-medium border-transparent bg-transparent hover:border-input focus:bg-background -ml-2 resize-y"
                          />
                          {obj.locator && <span className="text-[10px] bg-card border px-1.5 py-0.5 rounded text-muted-foreground shrink-0 mt-1.5">{obj.locator}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground pl-1 border-l-2 border-primary/20 italic">
                          "{obj.excerpt}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Original Source Metadata */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Original Source</h4>
              
              {source.kind === 'pdf' && (
                <div className="text-sm">
                  <a href={getGetCurriculumPdfUrl(classId, source.id)} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1.5 w-fit">
                    <FileText className="w-4 h-4" /> Download original PDF
                  </a>
                </div>
              )}
              
              {source.kind === 'web' && (
                <div className="text-sm space-y-2 text-muted-foreground">
                  <div className="flex flex-col sm:flex-row sm:gap-2 sm:items-start min-w-0">
                    <span className="shrink-0 sm:w-20 font-medium sm:font-normal text-foreground sm:text-muted-foreground">URL</span>
                    <a href={source.url || "#"} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">{source.url}</a>
                  </div>
                  {source.publisher && (
                    <div className="flex flex-col sm:flex-row sm:gap-2 sm:items-start min-w-0">
                      <span className="shrink-0 sm:w-20 font-medium sm:font-normal text-foreground sm:text-muted-foreground">Publisher</span>
                      <span className="text-foreground">{source.publisher}</span>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:gap-2 sm:items-start min-w-0">
                    <span className="shrink-0 sm:w-20 font-medium sm:font-normal text-foreground sm:text-muted-foreground">Edition</span>
                    <span className="text-foreground">{source.edition || "Unknown"}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-2 sm:items-start min-w-0">
                    <span className="shrink-0 sm:w-20 font-medium sm:font-normal text-foreground sm:text-muted-foreground">Retrieved</span>
                    <span className="text-foreground">{source.retrievedAt ? new Date(source.retrievedAt).toLocaleDateString() : "Unknown"}</span>
                  </div>
                </div>
              )}
              
              {source.kind === 'manual' && (
                <div className="text-sm text-muted-foreground">
                  Teacher-provided manual entry.
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 pt-4 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0" onClick={() => setDeleteAlertOpen(true)} title="Delete source">
              <Trash2 className="w-4 h-4" />
            </Button>
            {source.kind === 'web' && (
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshMut.isPending} className="gap-2 shrink-0">
                <RefreshCw className={`w-4 h-4 ${refreshMut.isPending ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
            {(source.kind === 'manual' || source.kind === 'pdf') && (
              <Button variant="outline" size="sm" onClick={() => setReplaceDialogOpen(true)} className="shrink-0">
                Replace
              </Button>
            )}
            {isApproved && (
              <Button variant="outline" size="sm" onClick={() => handleSave('inactive')} disabled={updateMut.isPending} className="shrink-0">
                Deactivate
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto sm:justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="shrink-0">Close</Button>
            <Button variant="secondary" onClick={() => handleSave('draft')} disabled={updateMut.isPending} title={isApproved ? "Saving edits returns this source to draft status" : undefined} className="shrink-0">
              {updateMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" /> : null}
              {isApproved ? "Save Draft" : "Save Draft"}
            </Button>
            <Button onClick={() => handleSave('approved')} disabled={updateMut.isPending} className="shrink-0">
              <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
              {isApproved ? "Reapprove Changes" : "Approve"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this source?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the source document and its extracted metadata. 
              Any activities that were generated using this source will retain their bounded historical snapshot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CurriculumAddDialog
        open={replaceDialogOpen}
        onOpenChange={setReplaceDialogOpen}
        classId={classId}
        unitId={source.unitId}
        isApiReady={true}
        replacement={{ id: sourceId, version: source.version }}
        initialTitle={source.title}
        onReplaced={() => {
          setReplaceDialogOpen(false);
          onOpenChange(false);
        }}
      />
    </Dialog>
  );
}
