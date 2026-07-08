import { GlobeIcon, MapPinIcon, StoreIcon, TruckIcon } from "lucide-react";

import type { GraderAuditTier, GraderOperatingModel } from "@/lib/grader/types";
import { cn } from "@/lib/utils";

const MODEL_LABEL: Record<GraderOperatingModel, string> = {
  storefront: "Storefront or office",
  mobile: "Mobile, truck, or pop-up",
  service_area: "Home-based / service area",
  online: "Mostly online, local customers",
};

export function AuditScopeBanner({
  operatingModel = "storefront",
  auditTier = "full_local",
  gbpLinked,
  className,
}: {
  operatingModel?: GraderOperatingModel;
  auditTier?: GraderAuditTier;
  gbpLinked: boolean;
  className?: string;
}) {
  const isLimited = auditTier === "website_local" || !gbpLinked;
  const ModelIcon =
    operatingModel === "mobile"
      ? TruckIcon
      : operatingModel === "online"
        ? GlobeIcon
        : operatingModel === "service_area"
          ? MapPinIcon
          : StoreIcon;

  if (!isLimited && operatingModel === "storefront") {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 sm:px-5",
        isLimited
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-emerald-200 bg-emerald-50 text-emerald-950",
        className,
      )}
    >
      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        <ModelIcon className="size-4 shrink-0" />
        {MODEL_LABEL[operatingModel]}
        <span className="font-normal text-zinc-500">·</span>
        {isLimited ? (
          <span className="text-amber-900">Website & local presence audit</span>
        ) : (
          <span className="text-emerald-800">Full local visibility audit</span>
        )}
      </p>
      <p className="mt-1 text-sm leading-relaxed opacity-90">
        {isLimited ? (
          <>
            No verified Google Business Profile — scores focus on your website,
            search keywords, and competitors in your area. Map pack and listing
            checks are limited until you claim a Google profile.
          </>
        ) : (
          <>
            Google listing verified — this report includes map pack rankings,
            reviews, photos, and Business Profile checks.
          </>
        )}
      </p>
    </div>
  );
}
