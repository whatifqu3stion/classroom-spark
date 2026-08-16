import React, { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { useBoardwork, DeviceMode, Duration, ClassProfile } from "@/store/boardwork-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChipGroup } from "@/components/chip-group";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { BoardEditor } from "@/components/board-editor";
import { ClassFormDialog } from "@/components/class-form-dialog";
import { Settings, Plus, Play, Shuffle, FilePlus, MonitorOff, MonitorSmartphone, GraduationCap, Loader2 } from "lucide-react";

export default function Home() {
  const {
    classes,
    chips,
    activeClassId,
    activeDraft,
    selectedChipIds,
    setActiveClass,
    addChip,
    updateChip,
    deleteChip,
    toggleChipSelection,
    clearChipSelection,
    generateActivity,
    startBlank,
    updateDraft,
    addClass,
    updateClass,
    deleteClass
  } = useBoardwork();

  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("off");
  const [duration, setDuration] = useState<Duration>(7);
  const [resourceUrl, setResourceUrl] = useState("");

  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  const activeClass = classes.find((c) => c.id === activeClassId);
  const activeChips = chips.filter((c) => c.classId === activeClassId);

  // Initialize generator state when class changes
  React.useEffect(() => {
    if (activeClass) {
      setDeviceMode(activeClass.defaultDeviceMode);
      setDuration(activeClass.defaultDuration);
    }
  }, [activeClassId, activeClass]);

  const handleGenerate = async (surprise: boolean = false) => {
    if (isGenerating || !activeClassId) return;
    setIsGenerating(true);
    try {
      await generateActivity({
        topic,
        goal,
        deviceMode,
        durationMinutes: duration,
        resourceUrl: deviceMode === "on" ? resourceUrl : undefined,
        surprise,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const openEditClass = () => {
    setEditingClassId(activeClassId);
    setClassDialogOpen(true);
  };

  const openAddClass = () => {
    setEditingClassId(null);
    setClassDialogOpen(true);
  };

  const handleClassSubmit = (data: Omit<ClassProfile, "id" | "chips">) => {
    if (editingClassId) {
      updateClass(editingClassId, data);
    } else {
      addClass(data);
    }
  };

  const handleDeleteClass = () => {
    if (editingClassId) {
      deleteClass(editingClassId);
      setClassDialogOpen(false);
    }
  };

  if (classes.length === 0) {
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center mt-20">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Welcome to Boardwork</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            Create a class profile to start generating high-quality independent activities for your students in seconds.
          </p>
          <Button onClick={openAddClass} size="lg" className="gap-2" data-testid="button-create-first-class">
            <Plus className="w-5 h-5" />
            Create Your First Class
          </Button>
          <ClassFormDialog
            open={classDialogOpen}
            onOpenChange={setClassDialogOpen}
            onSubmit={handleClassSubmit}
            onDelete={handleDeleteClass}
          />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="container mx-auto px-4 md:px-8 py-6 min-h-[calc(100dvh-3.5rem)] lg:h-[calc(100dvh-3.5rem)] flex flex-col">
        
        {/* Top Class Selector */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Select value={activeClassId || ""} onValueChange={setActiveClass}>
              <SelectTrigger className="w-[280px] font-semibold text-lg h-auto py-2 border-transparent hover:border-border transition-colors bg-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 px-2 -ml-2" data-testid="select-class">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} <span className="text-muted-foreground font-normal ml-2">{c.subject}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeClass && (
              <Button variant="ghost" size="icon" onClick={openEditClass} className="text-muted-foreground hover:text-foreground -ml-2" title="Edit Class Settings" data-testid="button-edit-class">
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={openAddClass} className="gap-2" data-testid="button-new-class">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Class</span>
          </Button>
        </div>

        {/* Main Workspace */}
        <div className="flex flex-col lg:flex-1 lg:flex-row gap-6 lg:gap-8 lg:min-h-0">
          
          {/* Left Column: Generator Controls */}
          <div className="w-full lg:w-[400px] xl:w-[460px] flex flex-col gap-6 lg:overflow-y-auto lg:pr-2 pb-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">What are students working on?</Label>
                <Input
                  id="topic"
                  placeholder="e.g. osmosis and diffusion"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  data-testid="input-topic"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">What should this practice?</Label>
                <Input
                  id="goal"
                  placeholder="e.g. scientific reasoning"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  data-testid="input-goal"
                />
              </div>
            </div>

            <ChipGroup
              chips={activeChips}
              selectedChipIds={selectedChipIds}
              onToggleSelection={toggleChipSelection}
              onAddChip={(label) => addChip(activeClassId!, label)}
              onUpdateChip={updateChip}
              onDeleteChip={deleteChip}
              onClearSelection={clearChipSelection}
            />

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Device Mode</Label>
                  <SegmentedControl<DeviceMode>
                    options={[
                      { label: "Off", value: "off", icon: <MonitorOff className="w-4 h-4" /> },
                      { label: "On", value: "on", icon: <MonitorSmartphone className="w-4 h-4" /> },
                    ]}
                    value={deviceMode}
                    onChange={setDeviceMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <SegmentedControl<Duration>
                    options={[
                      { label: "5", value: 5 },
                      { label: "7", value: 7 },
                      { label: "10", value: 10 },
                    ]}
                    value={duration}
                    onChange={setDuration}
                  />
                </div>
              </div>

              {deviceMode === "on" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="resourceUrl">Resource URL (Required for Device On)</Label>
                  <Input
                    id="resourceUrl"
                    placeholder="https://..."
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                    data-testid="input-resource-url"
                  />
                  <p className="text-xs text-muted-foreground">
                    Boardwork will not invent URLs. Provide the exact link students need.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-4 mt-auto">
              <Button
                size="lg"
                className="w-full text-base font-semibold shadow-sm gap-2"
                onClick={() => handleGenerate(false)}
                disabled={isGenerating}
                data-testid="button-generate"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
                {isGenerating ? "Creating board..." : "Generate"}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="w-full gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => handleGenerate(true)}
                  disabled={isGenerating}
                  data-testid="button-surprise"
                >
                  <Shuffle className="w-4 h-4" />
                  Surprise Me
                </Button>
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-muted-foreground hover:text-foreground border border-transparent hover:bg-muted"
                  onClick={startBlank}
                  disabled={isGenerating}
                  data-testid="button-blank"
                >
                  <FilePlus className="w-4 h-4" />
                  Start Blank
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Editor */}
          <div className="flex-1 min-h-[500px] lg:min-h-0 pb-6 lg:pb-0">
            {activeDraft ? (
              <BoardEditor
                draft={activeDraft}
                onChange={updateDraft}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/20 text-muted-foreground p-8 text-center">
                <FilePlus className="w-12 h-12 mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-foreground mb-2">No activity created yet</h3>
                <p className="max-w-sm mb-6">
                  Set your topic and preferences on the left, then click Generate to create a new board.
                </p>
                <Button variant="outline" onClick={startBlank} className="gap-2">
                  <FilePlus className="w-4 h-4" />
                  Start from a blank board
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>
      
      <ClassFormDialog
        open={classDialogOpen}
        onOpenChange={setClassDialogOpen}
        onSubmit={handleClassSubmit}
        onDelete={handleDeleteClass}
        initialData={editingClassId ? activeClass : null}
      />
    </Shell>
  );
}
