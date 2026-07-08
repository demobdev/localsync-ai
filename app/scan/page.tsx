import { redirect } from "next/navigation";

/**
 * Legacy /scan URL — the full Local Visibility Grader replaced the lightweight scan.
 * Preserves inbound links; all free-audit funnels now live at /grader.
 */
export default function ScanPage() {
  redirect("/grader");
}
