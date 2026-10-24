import { notFound } from "next/navigation";
import { seedSyntheticFulfillmentFixturesAction } from "@/app/actions/qa-fulfillment-fixtures";
import { StaffFulfillmentQueue } from "@/components/listings/staff-fulfillment-queue";
import { isStaffFulfillmentEnabled, requireLocalMapStaff } from "@/lib/auth/localmap-staff.server";
import { canSeedSyntheticFulfillmentFixtures } from "@/lib/listings/qa-fulfillment-fixtures.server";
import { listStaffFulfillmentCases } from "@/lib/listings/staff-fulfillment.server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Internal publisher handoffs", robots: { index: false, follow: false } };

export default async function InternalPublisherFulfillmentPage() {
  if (!isStaffFulfillmentEnabled()) notFound();
  let staff: { userId: string };
  try { staff = await requireLocalMapStaff(); }
  catch { notFound(); }
  const cases = await listStaffFulfillmentCases();
  return <>
    {canSeedSyntheticFulfillmentFixtures() && <section className="mx-auto mt-6 flex max-w-6xl flex-wrap items-center justify-between gap-4 border border-sky-300 bg-sky-50 px-4 py-3 text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
      <div><h2 className="text-sm font-semibold">Isolated QA fixtures</h2><p className="mt-1 text-sm">Adds two synthetic manual cases. No owner contact or publisher submission occurs.</p></div>
      <form action={seedSyntheticFulfillmentFixturesAction}>
        <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-md border border-current px-3 text-sm font-medium hover:bg-sky-100 focus-visible:outline-2 focus-visible:outline-ring dark:hover:bg-sky-900">Seed two QA cases</button>
      </form>
    </section>}
    <StaffFulfillmentQueue cases={cases} staffUserId={staff.userId} />
  </>;
}
