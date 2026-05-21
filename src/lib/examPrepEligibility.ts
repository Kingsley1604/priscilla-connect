// Centralized eligibility check for the Exam Prep feature.
// Secondary students only. Signup stores this mostly as `sector = secondary`,
// while older assigned students may only have a class-grade marker.

const SECONDARY_GRADE_TOKENS = [
  "jss1", "jss2", "jss3",
  "juniorsecondary1", "juniorsecondary2", "juniorsecondary3",
  "junior1", "junior2", "junior3",
  "ss1", "ss2", "ss3",
  "sss1", "sss2", "sss3",
  "seniorsecondary1", "seniorsecondary2", "seniorsecondary3",
  "senior1", "senior2", "senior3",
  "secondary",
  "juniorsecondary",
  "seniorsecondary",
];

const SECONDARY_SECTOR_TOKENS = [
  "secondary",
  "junior",
  "juniorsecondary",
  "jss",
  "senior",
  "seniorsecondary",
  "sss",
  "senior_secondary",
];

export function normalizeToken(value?: string | null): string {
  return String(value || "").toLowerCase().replace(/[\s_\-./]+/g, "");
}

export function isSecondaryGrade(grade?: string | null): boolean {
  const n = normalizeToken(grade);
  if (!n) return false;
  if (SECONDARY_GRADE_TOKENS.includes(n)) return true;
  // Match patterns like "JSS 1A", "SS 1A", "SSS 2B", or "Senior 1B".
  return /^(jss|juniorsecondary|junior|sss?|seniorsecondary|senior)[123]/.test(n);
}

export function isSecondarySector(sector?: string | null): boolean {
  const n = normalizeToken(sector);
  if (!n) return false;
  return SECONDARY_SECTOR_TOKENS.some((t) => n === t || n.startsWith(t));
}

export function isExamPrepEligible(
  role?: string | null,
  sector?: string | null,
  grade?: string | null,
  isSuperAdmin?: boolean,
): boolean {
  if (isSuperAdmin) return true;
  if (role !== "student") return false;
  // New secondary signups may not have a class assigned yet, so sector alone is enough.
  return isSecondarySector(sector) || isSecondaryGrade(grade);
}
