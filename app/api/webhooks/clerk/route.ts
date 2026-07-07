import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

import {
  deleteOrganization,
  upsertOrganization,
} from "@/lib/auth/organizations";
import {
  sendCanceledEmail,
  sendPaymentFailedEmail,
  sendTrialEndingEmail,
} from "@/lib/billing/lifecycle-emails";
import {
  updateBillingSubscriptionByOrgPlan,
  upsertBillingSubscription,
} from "@/lib/billing/subscriptions";

/** Clerk billing payloads (typed loosely until billing APIs stabilize). */
type BillingPayer = {
  user_id?: string;
  organization_id?: string;
  organization_name?: string;
  email?: string;
};

type BillingSubscriptionData = {
  id: string;
  status?: string;
  payer?: BillingPayer;
  items?: Array<{
    status?: string;
    plan?: { slug?: string; name?: string };
    period_start?: number;
    period_end?: number | null;
    canceled_at?: number;
    past_due_at?: number;
  }>;
};

type BillingSubscriptionItemData = {
  id: string;
  status?: string;
  payer?: BillingPayer;
  plan?: { slug?: string; name?: string };
  canceled_at?: number;
  past_due_at?: number;
};

function webhookSigningSecret(): string | undefined {
  return (
    process.env.CLERK_WEBHOOK_SIGNING_SECRET?.trim() ||
    process.env.CLERK_WEBHOOK_SECRET?.trim()
  );
}

async function syncSubscription(data: BillingSubscriptionData) {
  const organizationId = data.payer?.organization_id;
  const planSlug = data.items?.[0]?.plan?.slug;

  if (!organizationId || !planSlug) {
    // B2C (user) subscriptions and malformed payloads are out of scope —
    // LocalSync bills at the organization level.
    return;
  }

  // Billing events can arrive before organization.* webhooks — ensure the
  // org row exists so the subscription FK doesn't fail.
  await upsertOrganization({
    id: organizationId,
    name: data.payer?.organization_name ?? "Workspace",
  });

  const item = data.items?.[0];

  await upsertBillingSubscription({
    subscriptionId: data.id,
    organizationId,
    planSlug,
    status: data.status ?? "incomplete",
    payerEmail: data.payer?.email ?? null,
    periodStart: item?.period_start ?? null,
    periodEnd: item?.period_end ?? null,
    canceledAt: item?.canceled_at ?? null,
    pastDueAt: item?.past_due_at ?? null,
  });
}

export async function POST(req: NextRequest) {
  const signingSecret = webhookSigningSecret();
  if (!signingSecret) {
    console.error(
      "[clerk-webhook] missing CLERK_WEBHOOK_SIGNING_SECRET (or CLERK_WEBHOOK_SECRET)",
    );
    return new Response("Webhook signing secret not configured", { status: 500 });
  }

  let event;

  try {
    event = await verifyWebhook(req, { signingSecret });
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
      case "subscription.created":
      case "subscription.updated":
      case "subscription.active":
      case "subscription.pastDue": {
        await syncSubscription(event.data as unknown as BillingSubscriptionData);
        break;
      }
      case "subscriptionItem.canceled": {
        const item = event.data as unknown as BillingSubscriptionItemData;
        const organizationId = item.payer?.organization_id;
        const planSlug = item.plan?.slug;

        if (organizationId && planSlug) {
          await updateBillingSubscriptionByOrgPlan({
            organizationId,
            planSlug,
            status: "canceled",
            canceledAt: item.canceled_at ?? Date.now(),
          });

          if (item.payer?.email) {
            await sendCanceledEmail({
              to: item.payer.email,
              planName: item.plan?.name ?? planSlug,
            });
          }
        }
        break;
      }
      case "subscriptionItem.pastDue": {
        const item = event.data as unknown as BillingSubscriptionItemData;
        const organizationId = item.payer?.organization_id;
        const planSlug = item.plan?.slug;

        if (organizationId && planSlug) {
          await updateBillingSubscriptionByOrgPlan({
            organizationId,
            planSlug,
            status: "past_due",
            pastDueAt: item.past_due_at ?? Date.now(),
          });

          if (item.payer?.email) {
            await sendPaymentFailedEmail({
              to: item.payer.email,
              planName: item.plan?.name ?? planSlug,
            });
          }
        }
        break;
      }
      case "subscriptionItem.ended": {
        const item = event.data as unknown as BillingSubscriptionItemData;
        const organizationId = item.payer?.organization_id;
        const planSlug = item.plan?.slug;

        if (organizationId && planSlug) {
          await updateBillingSubscriptionByOrgPlan({
            organizationId,
            planSlug,
            status: "ended",
          });
        }
        break;
      }
      case "subscriptionItem.freeTrialEnding": {
        const item = event.data as unknown as BillingSubscriptionItemData;

        if (item.payer?.email && item.plan) {
          await sendTrialEndingEmail({
            to: item.payer.email,
            planName: item.plan.name ?? item.plan.slug ?? "your plan",
          });
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
