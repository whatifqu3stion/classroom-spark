/** Keep historical private excerpts durable in storage, not in ungated responses. */
export function redactCurriculumSnapshot<T extends { curriculumSnapshot?: unknown }>(activity: T): T {
  return process.env.APP_PASSWORD ? activity : { ...activity, curriculumSnapshot: null };
}