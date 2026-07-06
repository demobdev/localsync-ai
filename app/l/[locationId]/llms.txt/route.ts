import { notFound } from "next/navigation";

import { getPublishedVisibilityContextAction } from "@/app/actions/visibility";
import { buildLlmsTxt } from "@/lib/visibility/llms-txt";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locationId: string }> },
) {
  const { locationId } = await params;
  const context = await getPublishedVisibilityContextAction(locationId);

  if (!context) {
    notFound();
  }

  const body = buildLlmsTxt({
    profile: context.location.profile,
    pageUrl: context.pageUrl,
    serviceNames: context.taxonomy.serviceNames,
    categoryName: context.taxonomy.categoryName,
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
