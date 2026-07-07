"use client";

import { PricingTable } from "@clerk/nextjs";

/**
 * Clerk's org-level pricing table with in-app checkout, styled to the
 * LocalMap design system. Global ClerkProvider appearance handles tokens
 * (colors, radius, font); these element overrides finish the card look.
 * Requires Billing enabled in Clerk (org plans live via billing.json).
 */
export function ClerkPricingTable() {
  return (
    <PricingTable
      for="organization"
      appearance={{
        elements: {
          pricingTable: "gap-4",
          pricingTableCard:
            "localmap-card-glow rounded-2xl border border-border bg-card shadow-none transition-colors hover:border-primary/40",
          pricingTableCardHeader: "bg-transparent",
          pricingTableCardTitle: "text-foreground font-semibold",
          pricingTableCardDescription: "text-muted-foreground",
          pricingTableCardFee: "text-foreground",
          pricingTableCardFeePeriod: "text-muted-foreground",
          pricingTableCardBody: "bg-transparent",
          pricingTableCardFeatures: "bg-transparent border-border",
          pricingTableCardFeaturesList: "text-sm",
          pricingTableCardFeaturesListItem: "text-foreground",
          pricingTableCardFooter: "border-border bg-transparent",
          pricingTableCardFooterButton:
            "bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm",
        },
      }}
    />
  );
}
