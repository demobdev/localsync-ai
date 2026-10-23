import { notFound } from "next/navigation";
import { StaffFulfillmentQueue } from "@/components/listings/staff-fulfillment-queue";
import { isStaffFulfillmentEnabled, requireLocalMapStaff } from "@/lib/auth/localmap-staff.server";
import { listStaffFulfillmentCases } from "@/lib/listings/staff-fulfillment.server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Internal publisher handoffs", robots: { index: false, follow: false } };

export default async function InternalPublisherFulfillmentPage() {
  if (!isStaffFulfillmentEnabled()) notFound();
  let staff: { userId: string };
  try { staff = await requireLocalMapStaff(); }
  catch { notFound(); }
  const cases = await listStaffFulfillmentCases();
  return <StaffFulfillmentQueue cases={cases} staffUserId={staff.userId} />;
}
