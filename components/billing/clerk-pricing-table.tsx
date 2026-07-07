"use client";

import { PricingTable } from "@clerk/nextjs";

/**
 * Renders Clerk's org-level pricing table with in-app checkout.
 * Only mount when NEXT_PUBLIC_CLERK_BILLING_ENABLED=true — Clerk throws
 * cannot_render_billing_disabled if Billing isn't enabled in the Dashboard.
 */
export function ClerkPricingTable() {
  return <PricingTable for="organization" />;
}
