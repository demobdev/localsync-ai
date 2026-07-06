import { notFound } from "next/navigation";

import { getPublishedVisibilityContextAction } from "@/app/actions/visibility";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locationId: string }> },
) {
  const { locationId } = await params;
  const context = await getPublishedVisibilityContextAction(locationId);

  if (!context?.page.htmlContent) {
    notFound();
  }

  return new Response(context.page.htmlContent, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
