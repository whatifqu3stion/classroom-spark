import { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { MoreHorizontal, MonitorSmartphone, MonitorOff, Star, Trash2, Copy, Play, FileText } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { useBoardwork } from "@/store/boardwork-context";
import {
  useClearNonFavoriteActivities,
  useDeleteActivity,
  useDuplicateActivity,
  useSetActivityFavorite,
  getGetAppStateQueryKey,
} from "@workspace/api-client-react";
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
  const clearMutation = useClearNonFavoriteActivities();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [historyView, setHistoryView] = useState<"all" | "favorites">("all");
  const [clearOpen, setClearOpen] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);
  const duplicateInFlightRef = useRef(false);

  const activities = appState?.activities || [];
  const classes = appState?.classes || [];

  const sortedActivities = [...activities].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const favoriteActivities = sortedActivities.filter((activity) => activity.favorite);
  const nonFavoriteCount = sortedActivities.length - favoriteActivities.length;
  const visibleActivities = historyView === "favorites" ? favoriteActivities : sortedActivities;

  const handleDuplicate = (id: string) => {
    if (duplicateInFlightRef.current) return;
    duplicateInFlightRef.current = true;
    duplicateMutation.mutate({ activityId: id }, {
      onSuccess: (newActivity) => {
        queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
        setLocation(`/activity/${newActivity.id}`);
      },
      onSettled: () => {
        duplicateInFlightRef.current = false;
      },
    });
  };

  const handleFavorite = (id: string, favorite: boolean) => {
    if (favoriteMutation.isPending) return;
    favoriteMutation.mutate({ activityId: id, data: { favorite } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId || deleteMutation.isPending) return;
    deleteMutation.mutate({ activityId: deleteId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
        setDeleteId(null);
      }
    });
  };

  const handleClear = () => {
    if (clearMutation.isPending || nonFavoriteCount === 0) return;

    setClearError(null);
    clearMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
        setClearOpen(false);
      },
      onError: () => {
        setClearError("Couldn’t clear history. Your activities were not changed.");
      },
    });
  };

  return (
    <Shell>
      <div className="container mx-auto px-4 md:px-8 py-8 max-w-5xl min-h-[calc(100dvh-3.5rem)]">
        <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">History</h1>
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="tablist"
              aria-label="History view"
              className="inline-flex items-center rounded-md border bg-muted/30 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={historyView === "all"}
                onClick={() => setHistoryView("all")}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  historyView === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="history-view-all"
              >
                All <span className="text-xs text-muted-foreground">({sortedActivities.length})</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={historyView === "favorites"}
                onClick={() => setHistoryView("favorites")}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  historyView === "favorites"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="history-view-favorites"
              >
                Favorites <span className="text-xs text-muted-foreground">({favoriteActivities.length})</span>
              </button>
            </div>
            {nonFavoriteCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/40"
                onClick={() => {
                  setClearError(null);
                  setClearOpen(true);
                }}
                data-testid="button-clear-history"
              >
                <Trash2 className="w-4 h-4" />
                Clear history
              </Button>
            )}
          </div>
        </div>

        {visibleActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/10">
            <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
            {historyView === "favorites" && sortedActivities.length > 0 ? (
              <>
                <h3 className="text-lg font-medium text-foreground mb-2">No favorites yet</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Star an activity to keep it easy to find here.
                </p>
                <Button variant="outline" onClick={() => setHistoryView("all")} data-testid="button-show-all-history">
                  Show all activities
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-foreground mb-2">No activities yet</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Activities you generate or create will appear here.
                </p>
                <Button asChild variant="outline">
                  <Link href="/" data-testid="link-history-empty-workspace">Back to Workspace</Link>
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {visibleActivities.map((activity) => {
              const cls = classes.find(c => c.id === activity.classId);
              return (
                <div key={activity.id} className="group flex items-center justify-between p-4 rounded-xl border bg-card hover:border-foreground/20 transition-colors shadow-sm" data-testid={`history-item-${activity.id}`}>
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <button 
                      onClick={() => handleFavorite(activity.id, !activity.favorite)}
                      className={`shrink-0 p-1 rounded-md transition-colors ${activity.favorite ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground/30 hover:text-muted-foreground"}`}
                      title={activity.favorite ? "Unfavorite" : "Favorite"}
                      aria-label={`${activity.favorite ? "Unfavorite" : "Favorite"} ${activity.title || "Untitled Activity"}`}
                      disabled={favoriteMutation.isPending}
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            aria-label={`Actions for ${activity.title || "Untitled Activity"}`}
                            data-testid={`button-menu-${activity.id}`}
                          >
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
                        <DropdownMenuItem
                          onClick={() => handleDuplicate(activity.id)}
                          disabled={duplicateMutation.isPending}
                          className="cursor-pointer"
                          data-testid={`menu-duplicate-${activity.id}`}
                        >
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
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={clearOpen}
        onOpenChange={(open) => {
          setClearOpen(open);
          if (!open) setClearError(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear non-favorited history?</AlertDialogTitle>
            <AlertDialogDescription>
              {nonFavoriteCount > 0
                ? `This will permanently remove ${nonFavoriteCount} non-favorited ${nonFavoriteCount === 1 ? "activity" : "activities"}. Your favorited activities will remain.`
                : "There are no non-favorited activities to remove. Your favorited activities will remain."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {clearError && <p className="text-sm text-destructive">{clearError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClear}
              disabled={clearMutation.isPending || nonFavoriteCount === 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {clearMutation.isPending ? "Clearing…" : "Clear history"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}