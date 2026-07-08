import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";

import {
  GOOGLE_BUSINESS_CREATE_URL,
  LOCALSYNC_PREMIUM_SETUP_URL,
} from "@/lib/grader/gbp-links";
import type { GraderOperatingModel } from "@/lib/grader/types";
import { cn } from "@/lib/utils";

/**
 * Google-style fallback when search doesn't return a listing.
 * Offers DIY (Google) and done-for-you (LocalSync Premium).
 */
export function BusinessNotFoundHelp({
  query,
  operatingModel = "storefront",
  variant = "inline",
  className,
}: {
  query?: string;
  operatingModel?: GraderOperatingModel;
  variant?: "inline" | "dropdown" | "panel";
  className?: string;
}) {
  const googleUrl = query
    ? `${GOOGLE_BUSINESS_CREATE_URL}?hl=en`
    : GOOGLE_BUSINESS_CREATE_URL;

  const premiumLabel =
    operatingModel === "mobile" || operatingModel === "service_area"
      ? "We'll set up your Google profile & listings"
      : "We'll set up your profile for you";

  if (variant === "dropdown") {
    return (
      <li
        className={cn(
          "border-t border-black/5 px-4 py-3 text-sm text-zinc-600",
          className,
        )}
      >
        <p className="text-zinc-500">Can&apos;t find your business?</p>
        <div className="mt-1.5 flex flex-col gap-1">
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
          >
            Add your business to Google
            <ExternalLinkIcon className="size-3" />
          </a>
          <Link
            href={LOCALSYNC_PREMIUM_SETUP_URL}
            className="font-medium text-emerald-700 hover:underline"
          >
            {premiumLabel}
          </Link>
        </div>
      </li>
    );
  }

  return (
    <div
      className={cn(
        variant === "panel"
          ? "rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4"
          : "",
        className,
      )}
    >
      <p className="text-sm text-zinc-500">Can&apos;t find your business?</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
        >
          Add your business to Google
          <ExternalLinkIcon className="size-3.5" />
        </a>
        <span className="hidden text-zinc-300 sm:inline">·</span>
        <Link
          href={LOCALSYNC_PREMIUM_SETUP_URL}
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          {premiumLabel}
        </Link>
      </div>
      {operatingModel !== "storefront" ? (
        <p className="mt-2 text-xs text-zinc-500">
          Or paste your website above — we can still run a website &amp; local
          presence audit without a Google listing.
        </p>
      ) : null}
    </div>
  );
}
