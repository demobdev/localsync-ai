"use client";

import { ChevronDownIcon, GlobeIcon, MapPinIcon } from "lucide-react";
import { useState } from "react";

import type {
  AuditReport,
  KeywordIntent,
  KeywordResult,
  MapResult,
} from "@/lib/grader/types";
import { cn } from "@/lib/utils";

import { GoogleGIcon, Pill, ReportCard, Stars } from "./primitives";

// Browser key restricted by HTTP referrer (Maps Static + Places New).
// Absent → the CSS FauxMap renders instead; nothing breaks.
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

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
            youLat={report.latitude}
            youLng={report.longitude}
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

const INTENT_META: Record<
  KeywordIntent,
  { label: string; tone: "red" | "amber" | "green" }
> = {
  protecting: { label: "Protect", tone: "green" },
  competing: { label: "Gain ground", tone: "amber" },
  opportunity: { label: "Opportunity", tone: "red" },
};

/** Pre-existing audits lack the stored intent — derive it from ranks. */
function keywordIntent(keyword: KeywordResult): KeywordIntent {
  if (keyword.intent) return keyword.intent;
  const best = Math.min(
    keyword.yourMapRank ?? Infinity,
    keyword.yourOrganicRank ?? Infinity,
  );
  if (best <= 3) return "protecting";
  if (best !== Infinity) return "competing";
  return "opportunity";
}

function KeywordAccordionRow({
  keyword,
  businessName,
  youLat,
  youLng,
  open,
  onToggle,
}: {
  keyword: KeywordResult;
  businessName: string;
  youLat: number | null;
  youLng: number | null;
  open: boolean;
  onToggle: () => void;
}) {
  const map = rankPill(keyword.yourMapRank);
  const organic = rankPill(keyword.yourOrganicRank);
  const intent = INTENT_META[keywordIntent(keyword)];

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
          <Pill tone={intent.tone}>{intent.label}</Pill>
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
          <MapPackComparisonCard
            keyword={keyword}
            businessName={businessName}
            youLat={youLat}
            youLng={youLng}
          />
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
  youLat,
  youLng,
}: {
  keyword: KeywordResult;
  businessName: string;
  youLat: number | null;
  youLng: number | null;
}) {
  const youInTop3 = keyword.mapResults.some((r) => r.isYou);
  const unranked = keyword.yourMapRank === null;

  return (
    <div className="flex flex-col rounded-2xl border border-black/5 bg-white p-4">
      <p className="text-sm font-semibold text-zinc-800">Google Maps results</p>
      <p className="mb-3 text-xs text-zinc-500">
        These results get the most clicks
      </p>

      <PackMap
        results={keyword.mapResults}
        youInTop3={youInTop3}
        unranked={unranked}
        yourRank={keyword.yourMapRank}
        youLat={youLat}
        youLng={youLng}
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
 * Chooses the map renderer: a real Google Static Maps tile (when the browser
 * key exists AND the results carry usable coordinates) with our CSS pins
 * overlaid, otherwise the CSS-only FauxMap. Static tile failures (bad key,
 * referrer mismatch, quota) fall back to the FauxMap at runtime.
 */
function PackMap({
  results,
  youInTop3,
  unranked,
  yourRank,
  youLat,
  youLng,
}: {
  results: MapResult[];
  youInTop3: boolean;
  unranked: boolean;
  yourRank: number | null;
  youLat: number | null;
  youLng: number | null;
}) {
  const [tileFailed, setTileFailed] = useState(false);

  const competitorPins = results.filter(
    (r) => !r.isYou && r.lat != null && r.lng != null,
  );
  const youResult = results.find((r) => r.isYou);
  const youCoord =
    youResult?.lat != null && youResult.lng != null
      ? { lat: youResult.lat, lng: youResult.lng }
      : youLat != null && youLng != null
        ? { lat: youLat, lng: youLng }
        : null;

  const canRenderStatic =
    Boolean(MAPS_KEY) && !tileFailed && competitorPins.length >= 2;

  if (!canRenderStatic) {
    return (
      <FauxMap
        results={results}
        youInTop3={youInTop3}
        unranked={unranked}
        yourRank={yourRank}
      />
    );
  }

  return (
    <StaticMapWithPins
      competitorPins={competitorPins}
      youResult={youResult ?? null}
      youCoord={youCoord}
      unranked={unranked}
      yourRank={yourRank}
      onTileError={() => setTileFailed(true)}
    />
  );
}

// Static Maps viewport in "scale 1" pixels (we request scale=2 for retina).
const TILE_W = 640;
const TILE_H = 400;

/** Web Mercator world point at zoom 0 (256px world). */
function projectMercator(lat: number, lng: number): { x: number; y: number } {
  const clampedLat = Math.max(-85, Math.min(85, lat));
  const sin = Math.sin((clampedLat * Math.PI) / 180);
  return {
    x: 256 * (0.5 + lng / 360),
    y: 256 * (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)),
  };
}

/** Largest zoom (max 15) where every pin fits inside ~72% of the viewport. */
function fitZoom(points: Array<{ lat: number; lng: number }>): number {
  for (let zoom = 15; zoom >= 3; zoom--) {
    const scale = 2 ** zoom;
    const xs = points.map((p) => projectMercator(p.lat, p.lng).x * scale);
    const ys = points.map((p) => projectMercator(p.lat, p.lng).y * scale);
    const spanX = Math.max(...xs) - Math.min(...xs);
    const spanY = Math.max(...ys) - Math.min(...ys);
    if (spanX <= TILE_W * 0.72 && spanY <= TILE_H * 0.62) return zoom;
  }
  return 3;
}

// Muted, light map style so the red/green pins carry the visual weight.
const STATIC_STYLE_PARAMS = [
  "style=feature:poi|visibility:off",
  "style=feature:transit|visibility:off",
  "style=feature:road|element:labels|visibility:simplified",
  "style=feature:all|element:geometry|saturation:-35|lightness:12",
  "style=feature:water|element:geometry|saturation:-20",
].join("&");

function StaticMapWithPins({
  competitorPins,
  youResult,
  youCoord,
  unranked,
  yourRank,
  onTileError,
}: {
  competitorPins: MapResult[];
  youResult: MapResult | null;
  youCoord: { lat: number; lng: number } | null;
  unranked: boolean;
  yourRank: number | null;
  onTileError: () => void;
}) {
  const allPoints = [
    ...competitorPins.map((p) => ({ lat: p.lat!, lng: p.lng! })),
    ...(youCoord ? [youCoord] : []),
  ];
  const center = {
    lat: allPoints.reduce((s, p) => s + p.lat, 0) / allPoints.length,
    lng: allPoints.reduce((s, p) => s + p.lng, 0) / allPoints.length,
  };
  const zoom = fitZoom(allPoints);
  const scale = 2 ** zoom;
  const centerPx = projectMercator(center.lat, center.lng);

  function toPercent(lat: number, lng: number): { left: string; top: string } {
    const point = projectMercator(lat, lng);
    const left = 50 + (((point.x - centerPx.x) * scale) / TILE_W) * 100;
    const top = 50 + (((point.y - centerPx.y) * scale) / TILE_H) * 100;
    return {
      left: `${Math.max(4, Math.min(96, left))}%`,
      top: `${Math.max(12, Math.min(94, top))}%`,
    };
  }

  const src =
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${center.lat.toFixed(6)},${center.lng.toFixed(6)}` +
    `&zoom=${zoom}&size=${TILE_W}x${TILE_H}&scale=2&maptype=roadmap` +
    `&${STATIC_STYLE_PARAMS}&key=${MAPS_KEY}`;

  return (
    <div className="relative h-44 w-full overflow-hidden rounded-xl border border-black/5 bg-[#e9efe4] sm:h-52">
      {/* eslint-disable-next-line @next/next/no-img-element -- external Static Maps tile */}
      <img
        src={src}
        alt="Map of top-ranking businesses near you"
        className="absolute inset-0 size-full object-cover"
        onError={onTileError}
        loading="lazy"
      />

      {competitorPins.map((pin) => (
        <MapPin
          key={pin.rank}
          rank={pin.rank}
          color="#ef4444"
          style={toPercent(pin.lat!, pin.lng!)}
        />
      ))}

      {youCoord ? (
        <MapPin
          rank={youResult?.rank ?? (unranked ? null : yourRank)}
          color="#059669"
          label="You"
          faded={unranked && !youResult}
          style={toPercent(youCoord.lat, youCoord.lng)}
        />
      ) : (
        <MapPin
          rank={unranked ? null : yourRank}
          color="#059669"
          label="You"
          faded={unranked}
          style={YOU_UNRANKED_POSITION}
        />
      )}
    </div>
  );
}

/**
 * CSS-only faux map: soft land tones + suggested roads. Default renderer so
 * the report never depends on a Maps API key; also the runtime fallback when
 * the static tile can't load.
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
