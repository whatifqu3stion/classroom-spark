import { deploymentAccessProtected } from "./deployment-access";
/** Keep historical private excerpts durable in storage, not in ungated responses. */
export function redactCurriculumSnapshot<T extends { curriculumSnapshot?: unknown }>(activity: T): T {
  return deploymentAccessProtected() ? activity : { ...activity, curriculumSnapshot: null };
}