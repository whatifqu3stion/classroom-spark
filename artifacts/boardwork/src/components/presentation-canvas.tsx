import type { ReactNode, Ref } from "react";
import { ExternalLink } from "lucide-react";
import type { ActivityDraft } from "@/store/boardwork-context";
import { getSafeResourceUrl } from "@/lib/resource-url";
import { cn } from "@/lib/utils";

interface PresentationCanvasProps {
  activity: ActivityDraft;
  controls?: ReactNode;
  exportLayout?: boolean;
  surfaceRef?: Ref<HTMLDivElement>;
}

const testId = (enabled: boolean, value: string) =>
  enabled ? { "data-testid": value } : {};

export function PresentationCanvas({
  activity,
  controls,
  exportLayout = false,
  surfaceRef,
}: PresentationCanvasProps) {
  const arrivalInstruction = activity.arrivalInstructions?.trim();
  const safeResourceUrl = getSafeResourceUrl(activity.resourceUrl);
  const includeTestIds = !exportLayout;

  return (
    <div
      ref={surfaceRef}
      className={cn(
        "presentation-surface",
        exportLayout && "presentation-surface--export",
      )}
      {...testId(includeTestIds, "presentation-surface")}
    >
      <header className="presentation-header">
        {activity.eyebrow ? (
          <div
            className="presentation-eyebrow"
            {...testId(includeTestIds, "present-eyebrow")}
          >
            {activity.eyebrow}
          </div>
        ) : (
          <div aria-hidden="true" />
        )}
        <div
          className="presentation-time"
          {...testId(includeTestIds, "present-time")}
        >
          {activity.durationMinutes} MIN
        </div>
      </header>

      <main className="presentation-main">
        <div className="presentation-content">
          {activity.title && (
            <h1
              className="presentation-title"
              {...testId(includeTestIds, "present-title")}
            >
              {activity.title}
            </h1>
          )}

          {activity.task && (
            <p
              className="presentation-task"
              {...testId(includeTestIds, "present-task")}
            >
              {activity.task}
            </p>
          )}

          {activity.prompts.length > 0 && (
            <ul className="presentation-prompts">
              {activity.prompts.map((prompt, index) => (
                <li key={index} className="presentation-prompt">
                  <span className="presentation-prompt-marker" aria-hidden="true">
                    •
                  </span>
                  <span>{prompt}</span>
                </li>
              ))}
            </ul>
          )}

          {activity.materials && activity.materials.length > 0 && (
            <p
              className="presentation-materials"
              {...testId(includeTestIds, "present-materials")}
            >
              Materials: {activity.materials.join(", ")}
            </p>
          )}

          {safeResourceUrl && (
            <div
              className="presentation-resource"
              {...testId(includeTestIds, "present-resource")}
            >
              <a
                href={safeResourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={exportLayout ? -1 : undefined}
                className="presentation-resource-link"
                {...testId(includeTestIds, "present-resource-link")}
              >
                Open resource
                <ExternalLink className="h-[1em] w-[1em]" aria-hidden="true" />
              </a>
              {activity.resourceNote && (
                <p className="presentation-resource-note">
                  {activity.resourceNote}
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="presentation-footer">
        {arrivalInstruction ? (
          <div
            className="presentation-arrival"
            {...testId(includeTestIds, "present-arrival")}
          >
            {arrivalInstruction}
          </div>
        ) : (
          <div aria-hidden="true" />
        )}
        {controls ?? <div aria-hidden="true" />}
      </footer>
    </div>
  );
}