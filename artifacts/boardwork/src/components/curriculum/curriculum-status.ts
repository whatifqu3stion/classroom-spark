import type { CurriculumSourceStatus } from "@workspace/api-client-react";

export const curriculumStatusLabel: Record<CurriculumSourceStatus, string> = {
  draft: "Awaiting review",
  approved: "Approved",
  inactive: "Inactive",
  delete_failed: "Removal incomplete",
};
