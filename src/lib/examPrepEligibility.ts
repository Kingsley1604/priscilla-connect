// Centralized eligibility check for the Exam Prep feature.
// Exam Prep is restricted to senior secondary students: SS1, SS2, and SS3.

const SENIOR_GRADE_TOKENS = [
  "ss1", "ss2", "ss3",
  "sss1", "sss2", "sss3",
  "seniorsecondary1", "seniorsecondary2", "seniorsecondary3",
  "senior1", "senior2", "senior3",
];

export function normalizeToken(value?: string | null): string {
  return String(value || "").toLowerCase().replace(/[\s_\-./]+/g, "");
}

export function isSeniorSecondaryGrade(grade?: string | null): boolean {
  const n = normalizeToken(grade);
  if (!n) return false;
  if (SENIOR_GRADE_TOKENS.includes(n)) return true;
  // Match class variants like "SS 1A", "SSS 2B", or "Senior Secondary 3".
  return /^(sss?|seniorsecondary|senior)[123]/.test(n);
}

export function isExamPrepEligible(
  role?: string | null,
  _sector?: string | null,
  grade?: string | null,
  isSuperAdmin?: boolean,
): boolean {
  if (isSuperAdmin) return true;
  if (role !== "student") return false;
  return isSeniorSecondaryGrade(grade);
}
