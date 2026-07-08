"use client";

import { ChevronDownIcon, GlobeIcon, MapPinIcon } from "lucide-react";
import { useState } from "react";

import type { AuditReport, KeywordResult, MapResult } from "@/lib/grader/types";
import { cn } from "@/lib/utils";

import { GoogleGIcon, Pill, ReportCard, Stars } from "./primitives";

export function SearchVisibilitySection({ report }: { report: AuditReport }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <ReportCard className="overflow-hidden">
      <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
        <h2 className="text-lg font-bold text-zinc-900 sm:text-xl">
          This is how you&apos;re doing online
        </h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Where you show up when customers search for you, next to your
          competitors.
        </p>
      </div>

      <div>
        {report.keywords.map((keyword, index) => (
          <KeywordAccordionRow
            key={keyword.keyword}
            keyword={keyword}
            businessName={report.businessName}
            open={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </ReportCard>
  );
}

function rankPill(rank: number | null): { tone: "red" | "amber" | "green"; label: string } {
  if (rank === null) return { tone: "red", label: "Unranked" };
  if (rank <= 3) return { tone: "green", label: `Position ${rank}` };
  return { tone: "amber", label: `Position ${rank}` };
}

function KeywordAccordionRow({
  keyword,
  businessName,
  open,
  onToggle,
}: {
  keyword: KeywordResult;
  businessName: string;
  open: boolean;
  onToggle: () => void;
}) {
  const map = rankPill(keyword.yourMapRank);
  const organic = rankPill(keyword.yourOrganicRank);

  return (
    <div className="border-t border-black/5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 px-4 py-4 text-left transition-colors hover:bg-zinc-50/70 sm:px-6"
      >
        <GoogleGIcon className="size-5 shrink-0" />
        <span className="min-w-0 flex-1 text-sm font-semibold text-zinc-800 sm:text-base">
          &ldquo;{keyword.keyword}&rdquo;
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          {keyword.topCompetitor && (
            <Pill tone="red">#1: {keyword.topCompetitor}</Pill>
          )}
          <Pill tone={map.tone}>
            <MapPinIcon className="size-3" />
            Map: {map.label}
          </Pill>
          <Pill tone={organic.tone}>
            <GlobeIcon className="size-3" />
            Organic: {organic.label}
          </Pill>
        </span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-zinc-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="grid gap-4 px-4 pb-5 sm:px-6 lg:grid-cols-2">
          <MapPackComparisonCard keyword={keyword} businessName={businessName} />
          <OrganicResultsCard keyword={keyword} />
        </div>
      )}
    </div>
  );
}

/* ── Map pack comparison (faux map, always renders without any API key) ── */

const PIN_POSITIONS = [
  { left: "30%", top: "34%" },
  { left: "58%", top: "56%" },
  { left: "44%", top: "22%" },
];
const YOU_RANKED_POSITION = { left: "70%", top: "36%" };
const YOU_UNRANKED_POSITION = { left: "86%", top: "78%" };

function MapPackComparisonCard({
  keyword,
  businessName,
}: {
  keyword: KeywordResult;
  businessName: string;
}) {
  const youInTop3 = keyword.mapResults.some((r) => r.isYou);
  const unranked = keyword.yourMapRank === null;

  return (
    <div className="flex flex-col rounded-2xl border border-black/5 bg-white p-4">
      <p className="text-sm font-semibold text-zinc-800">Google Maps results</p>
      <p className="mb-3 text-xs text-zinc-500">
        These results get the most clicks
      </p>

      <FauxMap
        results={keyword.mapResults}
        youInTop3={youInTop3}
        unranked={unranked}
        yourRank={keyword.yourMapRank}
      />

      <div className="mt-3 space-y-2">
        {keyword.mapResults.map((result) => (
          <MapResultRow key={`${result.rank}-${result.name}`} result={result} />
        ))}
        {!youInTop3 && (
          <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-red-300 bg-red-50/60 px-3 py-2">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                unranked
                  ? "border border-dashed border-red-400 text-red-500"
                  : "bg-amber-500 text-white",
              )}
            >
              {unranked ? "—" : keyword.yourMapRank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-800">
                {businessName}
              </p>
              <p className="text-xs text-red-600">
                {unranked
                  ? "Not in the map results for this search"
                  : `Position ${keyword.yourMapRank} — below the fold`}
              </p>
            </div>
            <Pill tone="red">You</Pill>
          </div>
        )}
      </div>
    </div>
  );
}

function MapResultRow({ result }: { result: MapResult }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-3 py-2",
        result.isYou
          ? "border-emerald-300 bg-emerald-50/60"
          : "border-black/5 bg-zinc-50/60",
      )}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
          result.isYou ? "bg-emerald-600" : "bg-red-500",
        )}
      >
        {result.rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-800">{result.name}</p>
        <p className="flex items-center gap-1 text-xs text-zinc-500">
          <Stars rating={result.rating} />
          {result.rating.toFixed(1)} ({result.reviewCount})
        </p>
      </div>
      {result.isYou && <Pill tone="green">You</Pill>}
    </div>
  );
}

/**
 * CSS-only faux map: soft land tones + suggested roads. Default renderer so
 * the report never depends on a Maps API key. If GOOGLE_MAPS_STATIC_KEY is
 * added later, swap the background for a Static Maps image and keep the pins.
 */
function FauxMap({
  results,
  youInTop3,
  unranked,
  yourRank,
}: {
  results: MapResult[];
  youInTop3: boolean;
  unranked: boolean;
  yourRank: number | null;
}) {
  return (
    <div className="relative h-44 w-full overflow-hidden rounded-xl border border-black/5 bg-[#e9efe4] sm:h-52">
      {/* Water + park patches */}
      <div className="absolute -top-6 -right-8 h-24 w-40 rounded-[50%] bg-[#cfe0f2]" />
      <div className="absolute bottom-4 left-6 h-16 w-24 rounded-[45%] bg-[#d8e8cd]" />
      <div className="absolute top-10 left-1/2 h-12 w-20 rounded-[45%] bg-[#dfeada]" />

      {/* Roads */}
      <div className="absolute top-1/2 left-0 h-[3px] w-full -rotate-6 bg-white/90" />
      <div className="absolute top-0 left-1/3 h-full w-[3px] rotate-6 bg-white/90" />
      <div className="absolute top-1/4 left-0 h-[2px] w-full rotate-3 bg-white/70" />
      <div className="absolute top-0 left-2/3 h-full w-[2px] -rotate-12 bg-white/70" />
      <div className="absolute top-0 left-[15%] h-full w-[2px] -rotate-3 bg-white/60" />
      {/* Highway accent */}
      <div className="absolute top-[64%] left-0 h-[4px] w-full rotate-2 bg-[#f6d78a]" />

      {/* Competitor pins */}
      {results.map((result, index) =>
        result.isYou ? null : (
          <MapPin
            key={result.rank}
            rank={result.rank}
            color="#ef4444"
            style={PIN_POSITIONS[index] ?? PIN_POSITIONS[0]}
          />
        ),
      )}

      {/* Your pin — if you hold a top-3 slot, take that slot's position */}
      {youInTop3 ? (
        <MapPin
          rank={results.find((r) => r.isYou)?.rank ?? 0}
          color="#059669"
          label="You"
          style={
            PIN_POSITIONS[results.findIndex((r) => r.isYou)] ??
            YOU_RANKED_POSITION
          }
        />
      ) : (
        <MapPin
          rank={unranked ? null : yourRank}
          color="#059669"
          label="You"
          faded={unranked}
          style={unranked ? YOU_UNRANKED_POSITION : YOU_RANKED_POSITION}
        />
      )}
    </div>
  );
}

function MapPin({
  rank,
  color,
  label,
  faded,
  style,
}: {
  rank: number | null;
  color: string;
  label?: string;
  faded?: boolean;
  style: { left: string; top: string };
}) {
  return (
    <div
      className={cn(
        "absolute flex -translate-x-1/2 -translate-y-full flex-col items-center",
        faded && "opacity-50",
      )}
      style={style}
    >
      {label && (
        <span
          className="mb-0.5 rounded-full px-1.5 py-px text-[10px] font-bold text-white shadow-sm"
          style={{ backgroundColor: color }}
        >
          {label}
        </span>
      )}
      <div className="relative">
        <div
          className={cn(
            "flex size-7 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-md",
            faded && "border-dashed",
          )}
          style={{ backgroundColor: color }}
        >
          {rank ?? "?"}
        </div>
        <div
          className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 shadow-sm"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ── Organic results card ──────────────────────────────────────────────── */

const RESULT_TYPE_META = {
  directory: { label: "Directory", tone: "neutral" as const },
  social: { label: "Social", tone: "neutral" as const },
  competitor: { label: "Competitor", tone: "red" as const },
  you: { label: "You", tone: "green" as const },
};

function domainHue(domain: string): number {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash * 31 + domain.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

function OrganicResultsCard({ keyword }: { keyword: KeywordResult }) {
  const unranked = keyword.yourOrganicRank === null;

  return (
    <div className="flex flex-col rounded-2xl border border-black/5 bg-white p-4">
      <p className="text-sm font-semibold text-zinc-800">Google Search results</p>
      <p className="mb-3 text-xs text-zinc-500">
        {unranked ? (
          <>
            You are <span className="font-semibold text-red-600">Unranked</span>{" "}
            — directories and competitors own this search
          </>
        ) : (
          <>
            You rank{" "}
            <span className="font-semibold text-emerald-700">
              #{keyword.yourOrganicRank}
            </span>{" "}
            organically for this search
          </>
        )}
      </p>

      <div className="space-y-2">
        {keyword.organicResults.map((result) => {
          const meta = RESULT_TYPE_META[result.type];
          return (
            <div
              key={`${result.rank}-${result.domain}`}
              className={cn(
                "flex items-start gap-2.5 rounded-xl border px-3 py-2.5",
                result.isYou
                  ? "border-emerald-300 bg-emerald-50/60"
                  : "border-black/5 bg-zinc-50/60",
              )}
            >
              <span className="mt-0.5 w-5 shrink-0 text-xs font-bold text-zinc-400">
                {result.rank}
              </span>
              <span
                className="mt-1 size-3 shrink-0 rounded-full"
                style={{
                  backgroundColor: `hsl(${domainHue(result.domain)} 55% 55%)`,
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-zinc-500">{result.domain}</p>
                <p className="truncate text-sm font-medium text-zinc-800">
                  {result.title}
                </p>
              </div>
              <Pill tone={meta.tone} className="mt-0.5">
                {meta.label}
              </Pill>
            </div>
          );
        })}

        {unranked && (
          <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-red-300 bg-red-50/60 px-3 py-2.5">
            <span className="w-5 shrink-0 text-xs font-bold text-red-400">?</span>
            <p className="flex-1 text-sm text-red-700">
              Your website doesn&apos;t appear in the top results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
