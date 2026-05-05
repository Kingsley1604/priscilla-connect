// Centralized eligibility check for the Exam Prep feature.
// Senior secondary students only (SS1, SS2, SS3) — accepts a wide range
// of role/grade synonyms so legacy data does not lock users out.

const SENIOR_GRADE_TOKENS = [
  "ss1", "ss2", "ss3",
  "sss1", "sss2", "sss3",
  "seniorsecondary1", "seniorsecondary2", "seniorsecondary3",
  "senior1", "senior2", "senior3",
];

const SENIOR_SECTOR_TOKENS = [
  "secondary",
  "senior",
  "seniorsecondary",
  "sss",
  "senior_secondary",
];

export function normalizeToken(value?: string | null): string {
  return String(value || "").toLowerCase().replace(/[\s_\-./]+/g, "");
}

export function isSeniorSecondaryGrade(grade?: string | null): boolean {
  const n = normalizeToken(grade);
  if (!n) return false;
  if (SENIOR_GRADE_TOKENS.includes(n)) return true;
  // Match patterns like "ss1a", "sss2b", "senior1b", "ss-1"
  return /^(sss?|seniorsecondary|senior)[123]\b?/.test(n);
}

export function isSeniorSector(sector?: string | null): boolean {
  const n = normalizeToken(sector);
  if (!n) return false;
  return SENIOR_SECTOR_TOKENS.some((t) => n === t || n.startsWith(t));
}

export function isExamPrepEligible(
  role?: string | null,
  sector?: string | null,
  grade?: string | null,
  isSuperAdmin?: boolean,
): boolean {
  if (isSuperAdmin) return true;
  if (role !== "student") return false;
  // Senior grade alone is sufficient (sector data may be missing/inconsistent).
  if (isSeniorSecondaryGrade(grade)) return true;
  // Or explicit senior sector marker.
  if (isSeniorSector(sector) && isSeniorSecondaryGrade(grade)) return true;
  return false;
}