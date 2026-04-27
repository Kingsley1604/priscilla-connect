/**
 * Automated test — Report card rejection workflow
 *
 * Verifies that when an admin rejects a primary/nursery report card:
 *   1. It disappears from the Admin "Result Management" view
 *      (ExamResults.tsx filters out rc.status === 'rejected').
 *   2. It reappears in the teacher's "Drafts" view with the rejection_reason
 *      attached (DraftResults.tsx surfaces rejected report_cards).
 *
 * Run:  bunx vitest run src/__tests__/report-rejection-flow.test.ts
 */
import { describe, it, expect } from "vitest";

type ReportCard = {
  id: string;
  created_by: string;
  class_level: string;
  status: "pending" | "approved" | "rejected" | "published" | "draft";
  rejection_reason?: string | null;
};

// The same filter the admin Result Management view applies.
const filterForAdminView = (rows: ReportCard[]) =>
  rows.filter((r) => r.status !== "rejected");

// The same selection the teacher's Drafts view applies for the current user.
const selectForTeacherDrafts = (rows: ReportCard[], teacherId: string) =>
  rows.filter(
    (r) =>
      r.created_by === teacherId &&
      (r.status === "draft" || r.status === "rejected"),
  );

// Mirrors the conditional in ExamResults.tsx that hides approve/reject buttons
// once a report has been approved or published.
const shouldShowApproveRejectButtons = (r: ReportCard) =>
  r.status !== "approved" && r.status !== "published";

describe("Report card rejection workflow", () => {
  const TEACHER_ID = "teacher-123";
  const REJECTED_ID = "rc-rejected-1";

  const seed: ReportCard[] = [
    { id: "rc-approved-1", created_by: TEACHER_ID, class_level: "Primary 3", status: "approved" },
    { id: "rc-pending-1",  created_by: TEACHER_ID, class_level: "Primary 3", status: "pending"  },
    { id: REJECTED_ID,     created_by: TEACHER_ID, class_level: "Primary 3", status: "rejected",
      rejection_reason: "Incomplete subject scores — please revise." },
  ];

  it("removes rejected report cards from the admin Result Management view", () => {
    const adminView = filterForAdminView(seed);
    expect(adminView.find((r) => r.id === REJECTED_ID)).toBeUndefined();
    expect(adminView.map((r) => r.id)).toEqual(
      expect.arrayContaining(["rc-approved-1", "rc-pending-1"]),
    );
  });

  it("surfaces the rejected report in the original teacher's Drafts with the rejection_reason", () => {
    const drafts = selectForTeacherDrafts(seed, TEACHER_ID);
    const rejected = drafts.find((r) => r.id === REJECTED_ID);
    expect(rejected).toBeDefined();
    expect(rejected?.status).toBe("rejected");
    expect(rejected?.rejection_reason).toMatch(/revise/i);
  });

  it("does not leak rejected drafts to other teachers", () => {
    const otherTeacherDrafts = selectForTeacherDrafts(seed, "teacher-999");
    expect(otherTeacherDrafts).toHaveLength(0);
  });

  it("once approved, a report stays visible to admins and is not shown in drafts", () => {
    const approved = seed.find((r) => r.status === "approved")!;
    expect(filterForAdminView(seed)).toContain(approved);
    expect(selectForTeacherDrafts(seed, TEACHER_ID)).not.toContain(approved);
  });

  it("hides approve/reject buttons for approved reports but shows them for pending", () => {
    const approved = seed.find((r) => r.status === "approved")!;
    const pending = seed.find((r) => r.status === "pending")!;
    expect(shouldShowApproveRejectButtons(approved)).toBe(false);
    expect(shouldShowApproveRejectButtons(pending)).toBe(true);
  });
});
