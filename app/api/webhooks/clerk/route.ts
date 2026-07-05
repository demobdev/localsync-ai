import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

import {
  deleteOrganization,
  upsertOrganization,
} from "@/lib/auth/organizations";

export async function POST(req: NextRequest) {
  let event;

  try {
    event = await verifyWebhook(req);
  } catch (error) {
    console.error("[clerk-webhook] verification failed", error);
    return new Response("Webhook verification failed", { status: 400 });
  }

  try {
    switch (event.type) {
      case "organization.created":
      case "organization.updated": {
        await upsertOrganization({
          id: event.data.id,
          name: event.data.name,
          slug: event.data.slug,
          imageUrl: event.data.image_url,
        });
        break;
      }
      case "organization.deleted": {
        if (event.data.id) {
          await deleteOrganization(event.data.id);
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("[clerk-webhook] handler failed", event.type, error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
