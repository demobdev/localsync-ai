import { Badge } from "@/components/ui/badge";
import { PublisherIcon } from "@/components/brand/publisher-icon";
import {
  FEATURED_PUBLISHER_SLUGS,
  getPublisherBrand,
} from "@/lib/publishers/brand-icons";
import { cn } from "@/lib/utils";

const RAIL_LABELS: Record<string, { label: string; className: string }> = {
  api: {
    label: "API",
    className: "border-primary/30 bg-primary/10 text-primary",
  },
  guided_import: {
    label: "Guided",
    className: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  },
  manual: {
    label: "Manual",
    className: "border-chart-3/30 bg-chart-3/10 text-chart-3",
  },
  audit_only: {
    label: "Audit",
    className: "border-muted-foreground/20 bg-muted text-muted-foreground",
  },
};

const FEATURED_META: Record<
  string,
  { rail: keyof typeof RAIL_LABELS; shortName: string }
> = {
  "google-business-profile": { rail: "api", shortName: "Google" },
  "bing-places": { rail: "guided_import", shortName: "Bing" },
  "apple-business-connect": { rail: "audit_only", shortName: "Apple" },
  facebook: { rail: "audit_only", shortName: "Facebook" },
  yelp: { rail: "audit_only", shortName: "Yelp" },
  nextdoor: { rail: "manual", shortName: "Nextdoor" },
  bbb: { rail: "audit_only", shortName: "BBB" },
  angi: { rail: "manual", shortName: "Angi" },
  homeadvisor: { rail: "manual", shortName: "HomeAdvisor" },
  thumbtack: { rail: "manual", shortName: "Thumbtack" },
  houzz: { rail: "audit_only", shortName: "Houzz" },
  foursquare: { rail: "audit_only", shortName: "Foursquare" },
};

export function PublisherNetworkGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="mb-10 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Publisher network
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">
          Tracked everywhere customers search, honestly labeled
        </h2>
        <p className="mt-4 text-muted-foreground">
          Every location auto-tracks 20+ directories. We label each rail (API,
          guided import, manual, or audit-only) so you always know what syncs
          vs what we verify.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {FEATURED_PUBLISHER_SLUGS.map((slug) => {
          const meta = FEATURED_META[slug];
          const rail = RAIL_LABELS[meta?.rail ?? "audit_only"];
          const brand = getPublisherBrand(slug);

          return (
            <div
              key={slug}
              className="localmap-card-glow group flex flex-col items-center gap-3 rounded-2xl border bg-card p-4 text-center transition-transform hover:-translate-y-1"
            >
              <PublisherIcon slug={slug} badge size={36} showCheck />
              <div className="space-y-1.5">
                <p className="text-sm font-medium leading-tight">
                  {meta?.shortName ?? brand.label}
                </p>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-semibold uppercase", rail.className)}
                >
                  {rail.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        + Angi, Porch, BuildZoom, Yellow Pages, MapQuest, Manta, and more in
        every workspace
      </p>
    </section>
  );
}
