import { redirect } from "next/navigation";

export default async function ListingsCommandCenterRoute({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  redirect(`/dashboard/locations/${encodeURIComponent(locationId)}/listings`);
}
