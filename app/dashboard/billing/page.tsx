import { auth } from "@clerk/nextjs/server";
import { AlertTriangleIcon, CheckIcon, CreditCardIcon } from "lucide-react";

import { getWorkspacePlan, LISTING_PLANS } from "@/lib/billing/plans";
import { getOrgSubscription } from "@/lib/billing/subscriptions";
import { ClerkPricingTable } from "@/components/billing/clerk-pricing-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const VERTICAL_ADDONS = [
  { name: "Healthcare", price: 15, note: "Healthgrades, WebMD, Zocdoc-class" },
  { name: "Legal", price: 15, note: "Avvo, FindLaw, Justia-class" },
  { name: "Home Services", price: 15, note: "Angi, HomeAdvisor, Thumbtack-class" },
  { name: "Restaurant", price: 15, note: "Menus, reservations, delivery links" },
  { name: "Financial Services", price: 15, note: "Advisor & branch directories" },
];

const PRO_LAYERS = [
  {
    name: "Reputation",
    note: "Review inbox, AI reply drafts, approve-before-publish workflows",
  },
  {
    name: "AI Citation Network",
    note: "Public visibility pages, schema.org, llms.txt, IndexNow pings",
  },
];

export default async function BillingPage() {
  const [workspace, session] = await Promise.all([getWorkspacePlan(), auth()]);
  const billingEnabled = process.env.NEXT_PUBLIC_CLERK_BILLING_ENABLED === "true";
  const subscription = session.orgId
    ? await getOrgSubscription(session.orgId)
    : null;
  const needsAttention =
    subscription?.status === "past_due" || subscription?.status === "canceled";

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <CreditCardIcon className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Plans & packages
            </h1>
            <p className="text-muted-foreground">
              Everything works manually on Basic. Upgrade a location when you
              want it automated.
            </p>
          </div>
        </div>
      </div>

      {needsAttention ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">
              {subscription?.status === "past_due"
                ? "Payment issue — automation pauses soon"
                : "Subscription canceled"}
            </p>
            <p className="text-muted-foreground">
              {subscription?.status === "past_due"
                ? "Your last payment failed. Update your payment method below to keep automated sync and AI drafts running."
                : "Automated features end at the close of this billing period. Resubscribe below to keep them — manual workflows stay free."}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 px-4 py-3 text-sm">
        <span className="text-muted-foreground">Current workspace plan:</span>
        <Badge variant={workspace.isPaid ? "default" : "secondary"}>
          {workspace.plan.name}
        </Badge>
        {!billingEnabled ? (
          <span className="text-xs text-muted-foreground">
            (Checkout launches soon — pricing below is live for reference.)
          </span>
        ) : null}
      </div>

      {billingEnabled ? (
        <ClerkPricingTable />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {LISTING_PLANS.map((plan) => {
            const isCurrent = plan.tier === workspace.tier;
            return (
              <Card
                key={plan.slug}
                className={
                  plan.tier === "premium"
                    ? "localmap-card-glow border-primary/40 bg-primary/5"
                    : "localmap-card-glow"
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.tier === "premium" ? (
                      <Badge>Most popular</Badge>
                    ) : isCurrent ? (
                      <Badge variant="secondary">Current</Badge>
                    ) : null}
                  </div>
                  <CardDescription>{plan.tagline}</CardDescription>
                  <p className="pt-1">
                    <span className="text-3xl font-bold">${plan.priceMonthly}</span>
                    <span className="text-sm text-muted-foreground">
                      /location/mo
                    </span>
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {plan.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-start gap-2">
                        <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="localmap-card-glow">
          <CardHeader>
            <CardTitle className="text-base">Vertical add-ons</CardTitle>
            <CardDescription>
              Pay only for the publisher network your category needs — Yext
              bundles these into $999/yr tiers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {VERTICAL_ADDONS.map((addon) => (
              <div
                key={addon.name}
                className="flex items-center justify-between gap-3 rounded-xl border bg-background/60 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{addon.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {addon.note}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  +${addon.price}/mo
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="localmap-card-glow">
          <CardHeader>
            <CardTitle className="text-base">Included with Pro</CardTitle>
            <CardDescription>
              Reputation and AI discovery come built into the Pro tier.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {PRO_LAYERS.map((layer) => (
              <div
                key={layer.name}
                className="flex items-center justify-between gap-3 rounded-xl border bg-background/60 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{layer.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {layer.note}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  Pro
                </Badge>
              </div>
            ))}
            <p className="pt-2 text-xs text-muted-foreground">
              Agencies: volume discounts at 10 / 50 / 100+ locations — contact
              us for wholesale rates.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
