"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  CheckoutButton,
  usePlans,
} from "@clerk/nextjs/experimental";
import { CheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LISTING_PLANS, type PlanTier } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

type BillingPlanCardsProps = {
  currentTier: PlanTier;
  checkoutEnabled?: boolean;
};

function formatPlanPrice(
  priceMonthly: number,
  annualMonthlyCents: number | null | undefined,
  annual: boolean,
): number {
  if (annual && annualMonthlyCents != null) {
    return Math.round(annualMonthlyCents / 100);
  }
  return priceMonthly;
}

export function BillingPlanCards({
  currentTier,
  checkoutEnabled = true,
}: BillingPlanCardsProps) {
  const router = useRouter();
  const { session } = useClerk();
  const [annual, setAnnual] = useState(true);
  const { data: clerkPlans, isLoading } = usePlans({ for: "organization" });

  const clerkPlanBySlug = useMemo(() => {
    const map = new Map<
      string,
      NonNullable<typeof clerkPlans>[number]
    >();
    for (const plan of clerkPlans ?? []) {
      if (plan.slug) {
        map.set(plan.slug, plan);
      }
    }
    return map;
  }, [clerkPlans]);

  async function handleSubscriptionComplete() {
    await session?.reload();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {checkoutEnabled ? (
        <div className="flex items-center justify-end gap-2 text-sm">
          <button
            type="button"
            className={cn(
              "rounded-md px-2 py-1 transition-colors",
              !annual && "font-medium text-foreground",
              annual && "text-muted-foreground",
            )}
            onClick={() => setAnnual(false)}
          >
            Monthly
          </button>
          <span className="text-muted-foreground">·</span>
          <button
            type="button"
            className={cn(
              "rounded-md px-2 py-1 transition-colors",
              annual && "font-medium text-foreground",
              !annual && "text-muted-foreground",
            )}
            onClick={() => setAnnual(true)}
          >
            Billed annually
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 pt-1 md:grid-cols-3">
        {LISTING_PLANS.map((plan) => {
          const clerkPlan = clerkPlanBySlug.get(plan.slug);
          const isCurrent = plan.tier === currentTier;
          const displayPrice = formatPlanPrice(
            plan.priceMonthly,
            clerkPlan?.annualMonthlyFee?.amount,
            annual,
          );

          return (
            <Card
              key={plan.slug}
              className={cn(
                "localmap-card-glow relative flex flex-col overflow-visible",
                plan.tier === "premium" && "border-primary/40 bg-primary/5",
              )}
            >
              {plan.tier === "premium" ? (
                <Badge className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 shadow-sm">
                  Most popular
                </Badge>
              ) : null}
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {isCurrent ? (
                    <Badge variant="secondary">Current</Badge>
                  ) : null}
                </div>
                <CardDescription>{plan.tagline}</CardDescription>
                <p className="pt-1">
                  <span className="text-3xl font-bold">${displayPrice}</span>
                  <span className="text-sm text-muted-foreground">
                    /location/mo
                  </span>
                </p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  {plan.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              {checkoutEnabled ? (
                <CardFooter>
                  {isCurrent ? (
                    <Button className="w-full" disabled variant="secondary">
                      Active
                    </Button>
                  ) : clerkPlan?.id && !isLoading ? (
                    <CheckoutButton
                      planId={clerkPlan.id}
                      planPeriod={annual ? "annual" : "month"}
                      for="organization"
                      newSubscriptionRedirectUrl="/dashboard/billing"
                      onSubscriptionComplete={handleSubscriptionComplete}
                      checkoutProps={{
                        appearance: {
                          elements: {
                            drawerRoot: "z-[100]",
                          },
                        },
                      }}
                    >
                      <Button className="w-full" variant={plan.tier === "premium" ? "default" : "outline"}>
                        Switch to this plan
                      </Button>
                    </CheckoutButton>
                  ) : (
                    <Button className="w-full" disabled variant="outline">
                      {isLoading ? "Loading plans…" : "Plan unavailable"}
                    </Button>
                  )}
                </CardFooter>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
