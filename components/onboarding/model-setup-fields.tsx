"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GraderOperatingModel } from "@/lib/grader/types";

/**
 * Extra onboarding fields keyed to operating model.
 * Values are submitted via form `name` attributes.
 */
export function ModelSetupFields({
  operatingModel,
  defaultServiceAreaCities,
}: {
  operatingModel: GraderOperatingModel;
  defaultServiceAreaCities?: string | null;
}) {
  if (operatingModel === "service_area") {
    return (
      <div className="space-y-2">
        <Label htmlFor="serviceAreaCities">Cities you serve</Label>
        <Input
          id="serviceAreaCities"
          name="serviceAreaCities"
          placeholder="e.g. Austin, Round Rock, Cedar Park"
          defaultValue={defaultServiceAreaCities ?? undefined}
        />
        <p className="text-xs text-muted-foreground">
          Service-area businesses rank on trade + city — not a storefront address.
        </p>
      </div>
    );
  }

  if (operatingModel === "mobile") {
    return (
      <div className="space-y-2">
        <Label htmlFor="serviceAreaCities">Where customers find you</Label>
        <Input
          id="serviceAreaCities"
          name="serviceAreaCities"
          placeholder="e.g. Austin metro, farmers markets, Instagram @…"
          defaultValue={defaultServiceAreaCities ?? undefined}
        />
        <p className="text-xs text-muted-foreground">
          Markets, neighborhoods, or your link-in-bio — helps us tailor listings.
        </p>
      </div>
    );
  }

  return null;
}
