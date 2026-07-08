import type { GraderAuditTier, GraderOperatingModel } from "@/lib/grader/types";

export function ModelReportNotes({
  operatingModel = "storefront",
  auditTier = "full_local",
  gbpLinked,
}: {
  operatingModel?: GraderOperatingModel;
  auditTier?: GraderAuditTier;
  gbpLinked: boolean;
}) {
  const websiteFirst = auditTier === "website_local";

  if (operatingModel === "service_area" && !gbpLinked) {
    return (
      <ReportNote
        title="Service-area businesses rank on trade + city"
        body="This audit scored your website and directories — not a storefront pin. Claim a Google service-area profile and define the cities you serve to compete in map results."
      />
    );
  }

  if (operatingModel === "mobile" && !gbpLinked) {
    return (
      <ReportNote
        title="Mobile businesses need a findable home online"
        body="Add a service-area Google profile and keep your website or social link consistent — that's how customers find your schedule and location."
      />
    );
  }

  if (operatingModel === "online" && websiteFirst) {
    return (
      <ReportNote
        title="Website-first audit scope"
        body="We prioritized website SEO, citations, and AI-readable facts. Google Maps is optional unless you meet buyers in person — still worth adding if you have local pickup or events."
        muted
      />
    );
  }

  return null;
}

function ReportNote({
  title,
  body,
  muted = false,
}: {
  title: string;
  body: string;
  muted?: boolean;
}) {
  return (
    <div
      className={
        muted
          ? "mb-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700"
          : "mb-4 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 sm:p-5"
      }
    >
      <p className="font-semibold text-zinc-900">{title}</p>
      <p className="mt-1 text-sm text-zinc-700">{body}</p>
    </div>
  );
}
