import { deploymentAccessProtected } from "./deployment-access";
import { createHash } from "node:crypto";
import { and, eq, isNull, or } from "drizzle-orm";
import { db, classesTable, curriculumSourcesTable, type CurriculumObjective, type CurriculumSource } from "@workspace/db";

export const normalizeApplicability = (value: string | null | undefined) =>
  (value ?? "").normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
export const normalizeProgrammeYear = (value: string | null | undefined) =>
  normalizeApplicability(value).replace(/^(?:myp\s+)?year\s+/, "").replace(/^myp\s+/, "");

export async function readApprovedCurriculumSources(classId: string, unitId?: string | null) {
  // A disabled private-source boundary must never quietly use private content.
  if (!deploymentAccessProtected()) return [];
  const [profile] = await db.select().from(classesTable).where(eq(classesTable.id, classId));
  if (!profile) return [];
  const rows = await db.select().from(curriculumSourcesTable).where(and(
    eq(curriculumSourcesTable.classId, classId),
    eq(curriculumSourcesTable.status, "approved"),
    unitId ? or(isNull(curriculumSourcesTable.unitId), eq(curriculumSourcesTable.unitId, unitId)) : isNull(curriculumSourcesTable.unitId),
  ));
  return rows.filter(row =>
    normalizeApplicability(row.subject) === normalizeApplicability(profile.subject) &&
    (!row.framework || normalizeApplicability(row.framework) === normalizeApplicability(profile.curriculumFramework)) &&
    (!row.programmeYear || normalizeProgrammeYear(row.programmeYear) === normalizeProgrammeYear(profile.programmeYear)) &&
    row.objectives.some(objective => objective.selected),
  ).sort((a, b) => Number(Boolean(b.unitId)) - Number(Boolean(a.unitId)));
}

export function sourceHash(kind: string, unitId: string | null, content: string | Buffer) {
  return createHash("sha256").update(`${kind}:${unitId ?? "class"}:`).update(content).digest("hex");
}

export function manualObjectives(text: string): CurriculumObjective[] {
  const parts = text.split(/\n+/).map(part => part.trim()).filter(Boolean);
  // Preserve every paragraph rather than silently truncate larger teacher text.
  if (parts.length > 60 || parts.some(part => part.length > 2000)) {
    throw new Error("Use up to 60 paragraphs, each no longer than 2,000 characters.");
  }
  return parts.map((excerpt, index) => ({
    id: `manual-${index + 1}`, label: excerpt.slice(0, 500),
    excerpt, locator: `Paragraph ${index + 1}`, selected: true,
  }));
}

export function validateObjectiveEdits(original: CurriculumObjective[], edited: CurriculumObjective[]) {
  if (edited.length !== original.length || new Set(edited.map(item => item.id)).size !== edited.length) return false;
  return edited.every(item => {
    const truth = original.find(old => old.id === item.id);
    return truth && truth.excerpt === item.excerpt && truth.locator === item.locator;
  });
}

export function publicSource(row: CurriculumSource) {
  const { pages: _pages, objectKey: _key, contentHash: _hash, ...safe } = row;
  return {
    ...safe,
    retrievedAt: row.retrievedAt?.toISOString() ?? null,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}