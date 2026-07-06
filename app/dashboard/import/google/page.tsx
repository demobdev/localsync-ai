import { redirect } from "next/navigation";

export default async function GoogleImportRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params.error) {
    query.set("error", params.error);
  }
  if (params.connected) {
    query.set("connected", params.connected);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  redirect(`/dashboard/connect/google${suffix}`);
}
