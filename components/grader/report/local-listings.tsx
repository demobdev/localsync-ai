"use client";

import { LoaderIcon, MapPinIcon } from "lucide-react";

import {
  CATEGORY_MAX,
  type AuditReport,
  type GbpField,
} from "@/lib/grader/types";

import { ReportCard, SectionHeader, Stars, StatusIcon } from "./primitives";

export function LocalListingsSection({ report }: { report: AuditReport }) {
  return (
    <ReportCard className="overflow-hidden">
      <SectionHeader
        index={3}
        title="Local Listings"
        subtitle="Make your business easy to find"
        score={report.categoryScores.listings}
        max={CATEGORY_MAX.listings}
      />

      <div className="px-4 pb-5 sm:px-5">
        <GbpProfileCard report={report} />
      </div>
    </ReportCard>
  );
}

function GbpProfileCard({ report }: { report: AuditReport }) {
  const gbp = report.gbpProfile;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 bg-zinc-50/70 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50">
            <MapPinIcon className="size-4.5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-800">
              Google Business Profile
            </p>
            <p className="text-xs text-zinc-500">{report.businessName}</p>
          </div>
        </div>
        {gbp.rating !== null && (
          <p className="flex items-center gap-1.5 text-sm text-zinc-700">
            <Stars rating={gbp.rating} />
            <span className="font-semibold">{gbp.rating.toFixed(1)}</span>
            <span className="text-zinc-400">
              ({gbp.reviewCount ?? 0} reviews)
            </span>
          </p>
        )}
      </div>

      <GbpFieldGroup title="Profile content" fields={gbp.profileFields} />
      <GbpFieldGroup title="User-submitted content" fields={gbp.reviewFields} />
    </div>
  );
}

function GbpFieldGroup({ title, fields }: { title: string; fields: GbpField[] }) {
  return (
    <div className="border-t border-black/5 first:border-t-0">
      <p className="bg-zinc-50/50 px-4 py-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase sm:px-5">
        {title}
      </p>
      {fields.map((field) => (
        <div
          key={field.id}
          className="flex items-start gap-3 border-t border-black/5 px-4 py-3 sm:px-5"
        >
          {field.status === "pending" ? (
            <LoaderIcon className="mt-0.5 size-5 shrink-0 animate-spin text-amber-500" />
          ) : (
            <StatusIcon status={field.status} className="mt-0.5" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-800">{field.label}</p>
            {field.detail && (
              <p className="mt-0.5 text-xs text-zinc-500">{field.detail}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
