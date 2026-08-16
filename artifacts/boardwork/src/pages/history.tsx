import { useState } from "react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { MoreHorizontal, MonitorSmartphone, MonitorOff, Star, Trash2, Copy, Play, FileText } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { useBoardwork } from "@/store/boardwork-context";
import { useDeleteActivity, useDuplicateActivity, useSetActivityFavorite, getGetAppStateQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { ClassColorDot } from "@/components/class-color-dot";

export default function History() {
  const { appState } = useBoardwork();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteActivity();
  const duplicateMutation = useDuplicateActivity();
  const favoriteMutation = useSetActivityFavorite();

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activities = appState?.activities || [];
  const classes = appState?.classes || [];

  const sortedActivities = [...activities].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleDuplicate = (id: string) => {
    duplicateMutation.mutate({ activityId: id }, {
      onSuccess: (newActivity) => {
        queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
        setLocation(`/activity/${newActivity.id}`);
      }
    });
  };

  const handleFavorite = (id: string, favorite: boolean) => {
    favoriteMutation.mutate({ activityId: id, data: { favorite } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate({ activityId: deleteId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
        setDeleteId(null);
      }
    });
  };

  return (
    <Shell>
      <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl min-h-[calc(100dvh-3.5rem)]">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">History</h1>
        </div>

        {sortedActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/10">
            <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No activities yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Activities you generate or create will appear here.
            </p>
            <Button asChild variant="outline">
              <Link href="/" data-testid="link-history-empty-workspace">Back to Workspace</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {sortedActivities.map((activity) => {
              const cls = classes.find(c => c.id === activity.classId);
              return (
                <div key={activity.id} className="group flex items-center justify-between p-4 rounded-xl border bg-card hover:border-foreground/20 transition-colors shadow-sm" data-testid={`history-item-${activity.id}`}>
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <button 
                      onClick={() => handleFavorite(activity.id, !activity.favorite)}
                      className={`shrink-0 p-1 rounded-md transition-colors ${activity.favorite ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground/30 hover:text-muted-foreground"}`}
                      title={activity.favorite ? "Unfavorite" : "Favorite"}
                      data-testid={`button-favorite-${activity.id}`}
                    >
                      <Star className={`w-5 h-5 ${activity.favorite ? "fill-current" : ""}`} />
                    </button>
                    
                    <Link href={`/activity/${activity.id}`} className="flex-1 min-w-0 block" data-testid={`link-open-${activity.id}`}>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-foreground truncate block">
                          {activity.title || "Untitled Activity"}
                        </span>
                        {activity.eyebrow && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 px-1.5 py-0.5 rounded-sm bg-muted/50">
                            {activity.eyebrow}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="shrink-0">{format(new Date(activity.updatedAt), "MMM d, yyyy")}</span>
                        <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                        {cls && (
                          <span className="flex items-center gap-1.5 shrink-0">
                            <ClassColorDot color={cls.color || undefined} />
                            {cls.name}
                          </span>
                        )}
                        <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                        <span className="flex items-center gap-1 shrink-0">
                          {activity.deviceMode === "on" ? <MonitorSmartphone className="w-3.5 h-3.5" /> : <MonitorOff className="w-3.5 h-3.5" />}
                          {activity.durationMinutes}m
                        </span>
                        {activity.style && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                            <span className="shrink-0">{activity.style}</span>
                          </>
                        )}
                      </div>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 pl-4 shrink-0">
                    <Button asChild variant="ghost" size="sm" className="hidden sm:flex h-8 gap-1.5 text-muted-foreground hover:text-foreground">
                      <Link href={`/present/${activity.id}`} data-testid={`button-present-${activity.id}`}>
                        <Play className="w-4 h-4" />
                        Present
                      </Link>
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" data-testid={`button-menu-${activity.id}`}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem asChild>
                          <Link href={`/activity/${activity.id}`} className="flex items-center cursor-pointer" data-testid={`menu-open-${activity.id}`}>
                            <FileText className="w-4 h-4 mr-2" />
                            Open
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/present/${activity.id}`} className="flex items-center cursor-pointer" data-testid={`menu-present-${activity.id}`}>
                            <Play className="w-4 h-4 mr-2" />
                            Present
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDuplicate(activity.id)} className="cursor-pointer" data-testid={`menu-duplicate-${activity.id}`}>
                          <Copy className="w-4 h-4 mr-2" />
                          Remix / Copy
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteId(activity.id)} className="text-destructive focus:text-destructive cursor-pointer" data-testid={`menu-delete-${activity.id}`}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this activity? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}