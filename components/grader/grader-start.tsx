"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  GlobeIcon,
  LoaderIcon,
  MapPinIcon,
  RadarIcon,
  SearchIcon,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { startGraderAuditAction } from "@/app/actions/grader";
import type { GraderPlaceInput } from "@/lib/grader/place";
import { cn } from "@/lib/utils";

// Browser key (HTTP-referrer restricted, Places New + Maps Static).
// Absent → the input silently behaves as URL-only.
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

/**
 * Brief holding state while the start action creates the audit row (<1s).
 * The real progressive scan experience lives on /grader/[auditId].
 */
function StartingAudit() {
  return (
    <div className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100">
          <RadarIcon className="size-5 animate-pulse text-emerald-700" />
        </div>
        <div>
          <p className="font-semibold text-zinc-900">Starting your audit…</p>
          <p className="text-sm text-zinc-500">Taking you to the live scan</p>
        </div>
      </div>
    </div>
  );
}

type Suggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

/** Treat inputs that look like domains/URLs as URLs and skip autocomplete. */
function looksLikeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return true;
  return !trimmed.includes(" ") && /^[\w-]+(\.[\w-]{2,})+/.test(trimmed);
}

async function fetchSuggestions(input: string): Promise<Suggestion[]> {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": MAPS_KEY as string,
      },
      body: JSON.stringify({ input }),
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
    }))
    .slice(0, 5);
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

  // Photo media URLs are built here (browser context) because the key is
  // HTTP-referrer-restricted — server-side fetches with it would 403.
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
    reviews,
  };
}

export function GraderStart() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestSeq = useRef(0);

  const autocompleteEnabled = Boolean(MAPS_KEY);

  // Debounced autocomplete (skipped for URL-ish input or when no key).
  useEffect(() => {
    if (!autocompleteEnabled || looksLikeUrl(query) || query.trim().length < 3) {
      setSuggestions([]);
      setDropdownOpen(false);
      return;
    }

    const seq = ++requestSeq.current;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await fetchSuggestions(query.trim());
        if (requestSeq.current === seq) {
          setSuggestions(results);
          setDropdownOpen(results.length > 0);
        }
      } catch {
        // Autocomplete is best-effort; URL input still works.
      } finally {
        if (requestSeq.current === seq) setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, autocompleteEnabled]);

  // Close the dropdown on outside taps (mobile included).
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function runAudit(input: { url?: string; place?: GraderPlaceInput }) {
    setDropdownOpen(false);
    startTransition(async () => {
      try {
        const { auditId } = await startGraderAuditAction(input);
        router.push(`/grader/${auditId}`);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Audit failed — check the URL and try again",
        );
      }
    });
  }

  function handleSelectSuggestion(suggestion: Suggestion) {
    setQuery(suggestion.mainText);
    setDropdownOpen(false);
    startTransition(async () => {
      try {
        const place = await fetchPlaceDetails(suggestion.placeId);
        if (!place) {
          toast.error("Couldn't load that business — try its website URL");
          return;
        }
        const { auditId } = await startGraderAuditAction({
          url: place.websiteUri ?? undefined,
          place,
        });
        router.push(`/grader/${auditId}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Audit failed — try again",
        );
      }
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (looksLikeUrl(trimmed) || !autocompleteEnabled) {
      runAudit({ url: trimmed });
      return;
    }

    // Business-name query: pick the top suggestion if we have one.
    const first = suggestions[0];
    if (first) {
      handleSelectSuggestion(first);
      return;
    }

    // No suggestions — last resort, treat it as a URL attempt.
    runAudit({ url: trimmed });
  }

  if (isPending) {
    return <StartingAudit />;
  }

  return (
    <div className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm sm:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div ref={containerRef} className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            name="url"
            required
            autoFocus
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setDropdownOpen(suggestions.length > 0)}
            placeholder={
              autocompleteEnabled
                ? "Search your business name, or paste your website"
                : "yourbusiness.com"
            }
            className="h-13 w-full rounded-2xl border border-zinc-200 bg-white pr-4 pl-11 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
          {searching && (
            <LoaderIcon className="absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin text-zinc-300" />
          )}

          {dropdownOpen && suggestions.length > 0 && (
            <ul className="absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-lg">
              {suggestions.map((suggestion) => (
                <li key={suggestion.placeId}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-emerald-50/70"
                  >
                    <MapPinIcon className="mt-0.5 size-4 shrink-0 text-zinc-400" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-zinc-900">
                        {suggestion.mainText}
                      </span>
                      <span className="block truncate text-xs text-zinc-500">
                        {suggestion.secondaryText}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              <li className="border-t border-black/5 px-4 py-2 text-[11px] text-zinc-400">
                <GlobeIcon className="mr-1 inline size-3" />
                Or paste your website URL directly
              </li>
            </ul>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-base font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          Grade my business
          <ArrowRightIcon className="size-4" />
        </button>
      </form>
      <p className="mt-3 text-sm text-zinc-500">
        Free · no signup to run the audit · takes about a minute
      </p>
    </div>
  );
}
