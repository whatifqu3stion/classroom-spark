import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCreateCurriculumSource, useUpdateCurriculumSource, useDiscoverCurriculumReferences, getListCurriculumSourcesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, FileText, Globe, UploadCloud } from "lucide-react";

function handleReplacementSuccess(
  newSource: any,
  replaceSourceId: string | undefined,
  updateMut: ReturnType<typeof useUpdateCurriculumSource>,
  queryClient: ReturnType<typeof useQueryClient>,
  classId: string,
  onSuccess: () => void,
  toast: ReturnType<typeof useToast>['toast']
) {
  if (replaceSourceId) {
    if (newSource.id === replaceSourceId || newSource.status !== 'draft') {
      toast({ 
        title: "Already saved", 
        description: "This exact content is already your current source. Choose different content or edit the existing source." 
      });
      return;
    }
    // We assume version 1 for simplicity of deactivation in this UI context (or the backend handles it gracefully if status is merely being flipped inactive).
    updateMut.mutate({ classId, sourceId: replaceSourceId, data: { version: 1, status: 'inactive' } }, {
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: getListCurriculumSourcesQueryKey(classId) });
        onSuccess();
      }
    });
  } else {
    queryClient.invalidateQueries({ queryKey: getListCurriculumSourcesQueryKey(classId) });
    onSuccess();
  }
}

export function CurriculumAddDialog({
  open,
  onOpenChange,
  classId,
  unitId,
  isApiReady,
  replaceSourceId,
  initialTitle,
  onReplaced
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  unitId: string | null;
  isApiReady: boolean;
  replaceSourceId?: string;
  initialTitle?: string;
  onReplaced?: () => void;
}) {
  const [tab, setTab] = useState<"manual" | "pdf" | "web">("manual");
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{replaceSourceId ? "Replace Curriculum Source" : "Add Curriculum Source"}</DialogTitle>
          <DialogDescription>
            {replaceSourceId 
              ? "Import a new curriculum document. Once successful, the old source will be deactivated." 
              : "Import curriculum to ground generated activities in your real class framework."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v: any) => setTab(v)} className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">Manual Text</TabsTrigger>
            <TabsTrigger value="pdf" disabled={!isApiReady}>PDF Upload</TabsTrigger>
            <TabsTrigger value="web" disabled={!isApiReady}>Discover</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="mt-4">
            <ManualAddForm classId={classId} unitId={unitId} onSuccess={onReplaced || (() => onOpenChange(false))} replaceSourceId={replaceSourceId} initialTitle={initialTitle} />
          </TabsContent>
          <TabsContent value="pdf" className="mt-4">
            <PdfUploadForm classId={classId} unitId={unitId} onSuccess={onReplaced || (() => onOpenChange(false))} replaceSourceId={replaceSourceId} initialTitle={initialTitle} />
          </TabsContent>
          <TabsContent value="web" className="mt-4">
            <WebDiscoverForm classId={classId} unitId={unitId} onSuccess={onReplaced || (() => onOpenChange(false))} replaceSourceId={replaceSourceId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ManualAddForm({ classId, unitId, replaceSourceId, initialTitle, onSuccess }: { classId: string; unitId: string | null; replaceSourceId?: string; initialTitle?: string; onSuccess: () => void }) {
  const [title, setTitle] = useState(initialTitle || "");
  const [text, setText] = useState("");
  const createMut = useCreateCurriculumSource();
  const updateMut = useUpdateCurriculumSource();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    createMut.mutate({
      classId,
      data: {
        kind: "manual",
        title: title.trim(),
        text: text.trim(),
        unitId,
      }
    }, {
      onSuccess: (newSource) => {
        handleReplacementSuccess(newSource, replaceSourceId, updateMut, queryClient, classId, onSuccess, toast);
      },
      onError: () => {
        toast({ title: "Could not save source", variant: "destructive" });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="manual-title">Source title</Label>
        <Input id="manual-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Unit 2 Learning Outcomes" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="manual-text">Curriculum text</Label>
        <Textarea id="manual-text" value={text} onChange={e => setText(e.target.value)} placeholder="Paste standards, objectives, or syllabus text here..." className="min-h-[200px]" required />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={createMut.isPending || !title.trim() || !text.trim()}>
          {createMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save Draft
        </Button>
      </div>
    </form>
  );
}

function PdfUploadForm({ classId, unitId, replaceSourceId, initialTitle, onSuccess }: { classId: string; unitId: string | null; replaceSourceId?: string; initialTitle?: string; onSuccess: () => void }) {
  const [title, setTitle] = useState(initialTitle || "");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const updateMut = useUpdateCurriculumSource();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) return;
    
    setUploading(true);
    try {
      const url = new URL(`/api/classes/${classId}/curriculum/pdf`, window.location.origin);
      url.searchParams.set("title", title.trim());
      if (unitId) url.searchParams.set("unitId", unitId);
      
      const res = await fetch(url.toString(), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/pdf"
        },
        body: file
      });
      
      if (!res.ok) {
        throw new Error(await res.text());
      }
      
      const newSource = await res.json();
      handleReplacementSuccess(newSource, replaceSourceId, updateMut, queryClient, classId, onSuccess, toast);
    } catch (err) {
      toast({ title: "Upload failed", description: "Scanned or oversized PDFs may not be supported. Try a smaller text-based PDF.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pdf-title">Document title</Label>
        <Input id="pdf-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. IB MYP Design Guide 2024" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pdf-file">PDF File</Label>
        <Input id="pdf-file" type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} required />
        <p className="text-xs text-muted-foreground mt-1">Text-based PDFs only. Scanned images are not supported.</p>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={uploading || !title.trim() || !file}>
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Upload & Extract
        </Button>
      </div>
    </form>
  );
}

function WebDiscoverForm({ classId, unitId, replaceSourceId, onSuccess }: { classId: string; unitId: string | null; replaceSourceId?: string; onSuccess: () => void }) {
  const discoverMut = useDiscoverCurriculumReferences();
  const createMut = useCreateCurriculumSource();
  const updateMut = useUpdateCurriculumSource();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDiscover = () => {
    discoverMut.mutate({ classId }, {
      onError: () => {
        toast({ title: "Discovery failed", description: "Make sure your class profile includes a subject and curriculum framework.", variant: "destructive" });
      }
    });
  };

  const handleImport = (result: any) => {
    createMut.mutate({
      classId,
      data: {
        kind: "web",
        title: result.title,
        url: result.url,
        unitId,
      }
    }, {
      onSuccess: (newSource) => {
        handleReplacementSuccess(newSource, replaceSourceId, updateMut, queryClient, classId, onSuccess, toast);
      },
      onError: () => {
        toast({ title: "Import failed", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Search for official curriculum sources using your class subject, framework, and programme year.
      </p>
      
      {!discoverMut.data ? (
        <div className="flex justify-center py-6">
          <Button onClick={handleDiscover} disabled={discoverMut.isPending}>
            {discoverMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
            Discover Sources
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Found {discoverMut.data.length} sources</h4>
          {discoverMut.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No official sources found. Try adding manual text or a PDF.</p>
          ) : (
            <ul className="space-y-3">
              {discoverMut.data.map((result, idx) => (
                <li key={idx} className="p-3 border rounded-md bg-muted/20">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-sm font-medium">{result.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{result.publisher}</p>
                      <a href={result.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block truncate max-w-[300px]">
                        {result.url}
                      </a>
                    </div>
                    <Button size="sm" onClick={() => handleImport(result)} disabled={createMut.isPending}>
                      Import
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-center mt-4">
            <Button variant="outline" size="sm" onClick={handleDiscover} disabled={discoverMut.isPending}>
              Search Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
