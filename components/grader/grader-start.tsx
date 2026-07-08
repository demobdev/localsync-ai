"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  GlobeIcon,
  LoaderIcon,
  MapPinIcon,
  RadarIcon,
  SearchIcon,
  StoreIcon,
  TruckIcon,
  XCircleIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { startGraderAuditAction } from "@/app/actions/grader";
import { BusinessNotFoundHelp } from "@/components/grader/business-not-found-help";
import type { GraderPlaceInput } from "@/lib/grader/place";
import {
  domainToSearchQuery,
  normalizeHost,
} from "@/lib/grader/place-lookup";
import {
  buildSearchVariants,
  scorePlaceMatch,
} from "@/lib/grader/place-search";
import type { GraderOperatingModel } from "@/lib/grader/types";
import { cn } from "@/lib/utils";

import { Stars } from "./report/primitives";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

const OPERATING_MODELS: Array<{
  id: GraderOperatingModel;
  label: string;
  hint: string;
  icon: typeof StoreIcon;
}> = [
  {
    id: "storefront",
    label: "Storefront or office",
    hint: "Customers visit you — Google listing required",
    icon: StoreIcon,
  },
  {
    id: "mobile",
    label: "Truck, cart, or pop-up",
    hint: "Google listing if you have one; website works too",
    icon: TruckIcon,
  },
  {
    id: "service_area",
    label: "Home-based / service area",
    hint: "You go to customers — listing or website",
    icon: MapPinIcon,
  },
  {
    id: "online",
    label: "Mostly online, local buyers",
    hint: "Website-first; Google listing is a bonus",
    icon: GlobeIcon,
  },
];

function StartingAudit() {
  return (
    <div className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100">
          <RadarIcon className="size-5 animate-pulse text-emerald-700" />
        </div>
        <div>
          <p className="font-semibold text-zinc-900">Starting your audit…</p>
          <p className="text-sm text-zinc-500">
            Matching your Google profile and opening the live scan
          </p>
        </div>
      </div>
    </div>
  );
}

type Suggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
  score: number;
};

type LocationBias = {
  latitude: number;
  longitude: number;
};

function looksLikeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return true;
  return !trimmed.includes(" ") && /^[\w-]+(\.[\w-]{2,})+/.test(trimmed);
}

function hostsMatch(a: string, b: string): boolean {
  const left = normalizeHost(a);
  const right = normalizeHost(b);
  return left === right || left.endsWith(`.${right}`) || right.endsWith(`.${left}`);
}

async function fetchAutocomplete(
  input: string,
  locationBias?: LocationBias | null,
): Promise<Suggestion[]> {
  const body: Record<string, unknown> = { input };
  if (locationBias) {
    body.locationBias = {
      circle: {
        center: {
          latitude: locationBias.latitude,
          longitude: locationBias.longitude,
        },
        radius: 50000,
      },
    };
  }

  const response = await fetch(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": MAPS_KEY as string,
      },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) return [];

  const payload = (await response.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string;
        structuredFormat?: {
          mainText?: { text?: string };
          secondaryText?: { text?: string };
        };
        text?: { text?: string };
      };
    }>;
  };

  return (payload.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => Boolean(p?.placeId))
    .map((p) => ({
      placeId: p.placeId as string,
      mainText:
        p.structuredFormat?.mainText?.text ?? p.text?.text ?? "Unknown place",
      secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
      score: 0,
    }));
}

async function fetchTextSearch(query: string): Promise<Suggestion[]> {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": MAPS_KEY as string,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress",
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 8 }),
    },
  );
  if (!response.ok) return [];

  const payload = (await response.json()) as {
    places?: Array<{
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
    }>;
  };

  return (payload.places ?? [])
    .filter((place) => place.id)
    .map((place) => ({
      placeId: place.id!.replace(/^places\//, ""),
      mainText: place.displayName?.text ?? "Unknown place",
      secondaryText: place.formattedAddress ?? "",
      score: 0,
    }));
}

async function fetchRankedSuggestions(
  query: string,
  locationBias?: LocationBias | null,
): Promise<Suggestion[]> {
  const variants = buildSearchVariants(query);
  const merged = new Map<string, Suggestion>();

  for (const variant of variants) {
    const results = await fetchAutocomplete(variant, locationBias);
    for (const suggestion of results) {
      const existing = merged.get(suggestion.placeId);
      const score = scorePlaceMatch(query, suggestion.mainText);
      if (!existing || score > existing.score) {
        merged.set(suggestion.placeId, { ...suggestion, score });
      }
    }
  }

  let ranked = [...merged.values()].sort((a, b) => b.score - a.score);

  if (ranked.length === 0 || ranked[0]!.score < 50) {
    for (const variant of variants.slice(0, 2)) {
      const textResults = await fetchTextSearch(variant);
      for (const suggestion of textResults) {
        const score = scorePlaceMatch(query, suggestion.mainText);
        const existing = merged.get(suggestion.placeId);
        if (!existing || score > existing.score) {
          merged.set(suggestion.placeId, { ...suggestion, score });
        }
      }
    }
    ranked = [...merged.values()].sort((a, b) => b.score - a.score);
  }

  return ranked.slice(0, 6);
}

async function fetchPlaceDetails(
  placeId: string,
): Promise<GraderPlaceInput | null> {
  const fields = [
    "displayName",
    "formattedAddress",
    "nationalPhoneNumber",
    "websiteUri",
    "rating",
    "userRatingCount",
    "location",
    "primaryTypeDisplayName",
    "photos",
    "reviews",
  ].join(",");

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-Api-Key": MAPS_KEY as string,
        "X-Goog-FieldMask": fields,
      },
    },
  );
  if (!response.ok) return null;

  const place = (await response.json()) as {
    displayName?: { text?: string };
    formattedAddress?: string;
    nationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
    location?: { latitude?: number; longitude?: number };
    primaryTypeDisplayName?: { text?: string };
    photos?: Array<{ name?: string }>;
    reviews?: Array<{
      rating?: number;
      text?: { text?: string };
      authorAttribution?: { displayName?: string };
      relativePublishTimeDescription?: string;
    }>;
  };

  const photoUrls = (place.photos ?? [])
    .slice(0, 6)
    .map((photo) => photo.name)
    .filter((name): name is string => Boolean(name))
    .map(
      (name) =>
        `https://places.googleapis.com/v1/${name}/media?maxWidthPx=800&key=${MAPS_KEY}`,
    );

  const reviews = (place.reviews ?? [])
    .slice(0, 5)
    .map((review) => ({
      author: review.authorAttribution?.displayName ?? "A customer",
      rating: review.rating ?? 5,
      text: (review.text?.text ?? "").slice(0, 200),
      when: review.relativePublishTimeDescription ?? "",
    }))
    .filter((review) => review.text.length > 0);

  return {
    placeId,
    name: place.displayName?.text ?? "Your business",
    formattedAddress: place.formattedAddress ?? null,
    phone: place.nationalPhoneNumber ?? null,
    websiteUri: place.websiteUri ?? null,
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? null,
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    primaryType: place.primaryTypeDisplayName?.text ?? null,
    photoUrls,
    photoCount: place.photos?.length ?? photoUrls.length,
    reviews,
  };
}

async function resolveUrlToPlace(
  websiteUrl: string,
): Promise<GraderPlaceInput | null> {
  if (!MAPS_KEY) return null;

  const host = normalizeHost(websiteUrl);
  const brandQuery = domainToSearchQuery(host);
  const queries = [
    brandQuery,
    `the ${brandQuery}`,
    brandQuery.replace(/\s+/g, ""),
    host,
  ].filter((q, i, arr) => q.length >= 2 && arr.indexOf(q) === i);

  async function search(textQuery: string) {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": MAPS_KEY as string,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.websiteUri,places.formattedAddress,places.rating,places.userRatingCount",
        },
        body: JSON.stringify({ textQuery, maxResultCount: 8 }),
      },
    );
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      places?: Array<{
        id?: string;
        displayName?: { text?: string };
        websiteUri?: string;
      }>;
    };
    return payload.places ?? [];
  }

  for (const textQuery of queries) {
    const places = await search(textQuery);
    const websiteMatch = places.find(
      (place) => place.id && place.websiteUri && hostsMatch(place.websiteUri, host),
    );
    if (websiteMatch?.id) {
      return fetchPlaceDetails(websiteMatch.id.replace(/^places\//, ""));
    }
  }

  for (const textQuery of queries) {
    const places = await search(textQuery);
    const ranked = places
      .filter((p) => p.id && p.displayName?.text)
      .map((p) => ({
        id: p.id!,
        score: scorePlaceMatch(brandQuery, p.displayName!.text!),
      }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    if (best && best.score >= 55) {
      return fetchPlaceDetails(best.id.replace(/^places\//, ""));
    }
  }

  return null;
}

export function GraderStart() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [operatingModel, setOperatingModel] =
    useState<GraderOperatingModel>("storefront");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [resolvingUrl, setResolvingUrl] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<GraderPlaceInput | null>(
    null,
  );
  const [notFound, setNotFound] = useState(false);
  const [locationBias, setLocationBias] = useState<LocationBias | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestSeq = useRef(0);
  const urlResolveSeq = useRef(0);

  const mapsEnabled = Boolean(MAPS_KEY);
  const isUrlMode = looksLikeUrl(query);
  const requiresGbp = operatingModel === "storefront";
  const canSubmitWebsiteOnly =
    !requiresGbp &&
    isUrlMode &&
    query.trim().length >= 4 &&
    !resolvingUrl &&
    !searching;
  const canSubmit =
    !isPending &&
    !resolvingUrl &&
    (Boolean(selectedPlace) || canSubmitWebsiteOnly);

  useEffect(() => {
    if (!mapsEnabled || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationBias({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {
        // Proximity bias is optional — search still works without it.
      },
      { maximumAge: 600_000, timeout: 4000 },
    );
  }, [mapsEnabled]);

  useEffect(() => {
    if (!mapsEnabled) return;

    if (isUrlMode) {
      setSuggestions([]);
      setDropdownOpen(false);
      setSearching(false);

      const trimmed = query.trim();
      if (trimmed.length < 4) {
        setSelectedPlace(null);
        setNotFound(false);
        return;
      }

      const seq = ++urlResolveSeq.current;
      setResolvingUrl(true);
      setNotFound(false);
      setSelectedPlace(null);

      const timer = setTimeout(async () => {
        try {
          const place = await resolveUrlToPlace(trimmed);
          if (urlResolveSeq.current !== seq) return;
          if (place) {
            setSelectedPlace(place);
            setNotFound(false);
          } else {
            setSelectedPlace(null);
            setNotFound(true);
          }
        } catch {
          if (urlResolveSeq.current === seq) {
            setSelectedPlace(null);
            setNotFound(true);
          }
        } finally {
          if (urlResolveSeq.current === seq) setResolvingUrl(false);
        }
      }, 450);

      return () => clearTimeout(timer);
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      setDropdownOpen(false);
      setSearching(false);
      setNotFound(false);
      return;
    }

    const seq = ++requestSeq.current;
    setSearching(true);
    setNotFound(false);

    const timer = setTimeout(async () => {
      try {
        const results = await fetchRankedSuggestions(
          query.trim(),
          locationBias,
        );
        if (requestSeq.current !== seq) return;
        setSuggestions(results);
        setDropdownOpen(results.length > 0);
        if (results.length === 0) setNotFound(true);
      } catch {
        if (requestSeq.current === seq) setNotFound(true);
      } finally {
        if (requestSeq.current === seq) setSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, mapsEnabled, isUrlMode, locationBias]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const selectPlace = useCallback(async (placeId: string, label: string) => {
    setDropdownOpen(false);
    setQuery(label);
    setNotFound(false);
    setSearching(true);
    try {
      const place = await fetchPlaceDetails(placeId);
      if (!place) {
        setSelectedPlace(null);
        setNotFound(true);
        toast.error("Couldn't load that business — try another result");
        return;
      }
      setSelectedPlace(place);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!canSubmit) {
      toast.error(
        requiresGbp
          ? "Select your business from Google search first"
          : "Find your Google listing or paste your website URL",
      );
      return;
    }

    startTransition(async () => {
      try {
        const { auditId } = await startGraderAuditAction({
          operatingModel,
          place: selectedPlace ?? undefined,
          url:
            selectedPlace?.websiteUri ??
            (looksLikeUrl(trimmed) ? trimmed : undefined),
        });
        router.push(`/grader/${auditId}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Audit failed — try again",
        );
      }
    });
  }

  function clearSelection() {
    setSelectedPlace(null);
    setNotFound(false);
    setQuery("");
    setSuggestions([]);
  }

  if (!mapsEnabled) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Google Places search is not configured. Add{" "}
        <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code>{" "}
        to enable the grader.
      </div>
    );
  }

  if (isPending) {
    return <StartingAudit />;
  }

  return (
    <div className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm sm:p-8">
      <fieldset className="mb-5">
        <legend className="mb-3 text-sm font-semibold text-zinc-800">
          What kind of business is this?
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {OPERATING_MODELS.map((option) => {
            const Icon = option.icon;
            const active = operatingModel === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setOperatingModel(option.id);
                  setSelectedPlace(null);
                  setNotFound(false);
                }}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors",
                  active
                    ? "border-emerald-500 bg-emerald-50/80"
                    : "border-zinc-200 bg-white hover:border-zinc-300",
                )}
              >
                <Icon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    active ? "text-emerald-700" : "text-zinc-400",
                  )}
                />
                <span>
                  <span className="block text-sm font-medium text-zinc-900">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    {option.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div ref={containerRef} className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            name="business"
            required
            autoFocus
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selectedPlace && e.target.value !== selectedPlace.name) {
                setSelectedPlace(null);
              }
            }}
            onFocus={() => {
              if (suggestions.length > 0) setDropdownOpen(true);
            }}
            placeholder={
              requiresGbp
                ? "Search your business name on Google"
                : "Search on Google or paste your website"
            }
            className="h-13 w-full rounded-2xl border border-zinc-200 bg-white pr-4 pl-11 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
          {(searching || resolvingUrl) && (
            <LoaderIcon className="absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin text-zinc-300" />
          )}

          {dropdownOpen && suggestions.length > 0 && !selectedPlace && (
            <ul className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-lg">
              {suggestions.map((suggestion) => (
                <li key={suggestion.placeId}>
                  <button
                    type="button"
                    onClick={() =>
                      void selectPlace(suggestion.placeId, suggestion.mainText)
                    }
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-emerald-50/70"
                  >
                    <MapPinIcon className="mt-0.5 size-4 shrink-0 text-zinc-400" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-900">
                        {suggestion.mainText}
                      </span>
                      <span className="block truncate text-xs text-zinc-500">
                        {suggestion.secondaryText}
                      </span>
                    </span>
                    {suggestion.score >= 85 ? (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Best match
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
              <BusinessNotFoundHelp
                query={query.trim()}
                operatingModel={operatingModel}
                variant="dropdown"
              />
            </ul>
          )}

          {!dropdownOpen &&
          !selectedPlace &&
          query.trim().length >= 2 &&
          !isUrlMode &&
          suggestions.length === 0 &&
          !searching ? (
            <BusinessNotFoundHelp
              query={query.trim()}
              operatingModel={operatingModel}
              variant="panel"
              className="mt-2"
            />
          ) : null}
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-base font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Grade my business
          <ArrowRightIcon className="size-4" />
        </button>
      </form>

      {selectedPlace ? (
        <div className="mt-3 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
          {selectedPlace.photoUrls?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element -- Places media URL
            <img
              src={selectedPlace.photoUrls[0]}
              alt=""
              className="size-12 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <CheckCircle2Icon className="size-6 shrink-0 text-emerald-600" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-emerald-950">{selectedPlace.name}</p>
            <p className="truncate text-sm text-emerald-800/80">
              {selectedPlace.formattedAddress ?? "Verified on Google"}
            </p>
            {selectedPlace.rating != null && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-800">
                <Stars rating={selectedPlace.rating} />
                {selectedPlace.rating.toFixed(1)}
                {selectedPlace.reviewCount != null
                  ? ` · ${selectedPlace.reviewCount} reviews`
                  : null}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="text-xs font-medium text-emerald-700 underline underline-offset-2"
          >
            Change
          </button>
        </div>
      ) : null}

      {notFound &&
      !selectedPlace &&
      !searching &&
      !resolvingUrl &&
      query.trim().length >= 2 ? (
        requiresGbp || !isUrlMode ? (
        <div className="mt-3 space-y-3">
          <div className="flex items-start gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-800">
            <XCircleIcon className="mt-0.5 size-5 shrink-0 text-zinc-400" />
            <div>
              <p className="font-semibold text-zinc-900">
                {isUrlMode
                  ? "No Google Business Profile matched this website"
                  : "We couldn't find that business on Google"}
              </p>
              <p className="mt-1 text-zinc-600">
                {isUrlMode
                  ? "Try searching the exact business name instead."
                  : "Try the full name (e.g. “The Owners Box”) or check spelling."}
              </p>
            </div>
          </div>
          <BusinessNotFoundHelp
            query={query.trim()}
            operatingModel={operatingModel}
            variant="panel"
          />
        </div>
        ) : (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">No Google listing found — that&apos;s OK for your business type</p>
          <p className="mt-1 text-amber-900/90">
            We&apos;ll run a <strong>website &amp; local presence</strong> audit
            (search keywords + competitors in your area). Map pack and listing
            scores stay limited until you add a Google profile.
          </p>
        </div>
        )
      ) : null}

      {!selectedPlace && !notFound && query.trim().length >= 2 && !isUrlMode ? (
        <p className="mt-3 text-sm text-zinc-500">
          {requiresGbp
            ? "Pick your business from the list — storefront audits need a verified Google profile."
            : "Pick your Google listing if you have one, or paste your website URL."}
        </p>
      ) : null}

      <p className="mt-3 text-sm text-zinc-400">
        Free · no signup to run the audit · takes about a minute
      </p>
    </div>
  );
}
