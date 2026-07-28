"use client";

import { useState } from "react";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  CheckIcon,
  ClipboardListIcon,
  ExternalLinkIcon,
  SearchCheckIcon,
  SendIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CATEGORY_PACK_PRICE_MONTHLY,
  CATEGORY_PACKS,
  categoryPackRailLabel,
} from "@/lib/verticals/category-pack-catalog";

const DELIVERY_STEPS = [
  {
    icon: ClipboardListIcon,
    step: "01",
    title: "Build the category profile",
    body: "We collect the fields generic listings miss, from licenses and insurance to menus and service areas.",
  },
  {
    icon: SendIcon,
    step: "02",
    title: "Work the right publishers",
    body: "The workspace prioritizes the niche surfaces that matter and gives each one an honest delivery rail.",
  },
  {
    icon: SearchCheckIcon,
    step: "03",
    title: "Prove the result",
    body: "Every publisher ends with a status, the next action, and evidence of what is actually live.",
  },
] as const;

export function CategoryPackExplorer() {
  const [selectedSlug, setSelectedSlug] = useState(
    CATEGORY_PACKS.find((pack) => pack.slug === "home-services-demand")?.slug ??
      CATEGORY_PACKS[0].slug,
  );
  const selected =
    CATEGORY_PACKS.find((pack) => pack.slug === selectedSlug) ??
    CATEGORY_PACKS[0];

  return (
    <div>
      <div
        className="flex gap-2 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-wrap [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Choose an industry pack"
      >
        {CATEGORY_PACKS.map((pack) => (
          <button
            key={pack.slug}
            type="button"
            role="tab"
            aria-selected={pack.slug === selected.slug}
            aria-controls="category-pack-panel"
            onClick={() => setSelectedSlug(pack.slug)}
            className={cn(
              "min-w-max rounded-full border px-4 py-2 text-sm font-medium transition-all",
              pack.slug === selected.slug
                ? "border-[#0f766e] bg-[#0f766e] text-white shadow-[0_8px_24px_rgba(15,118,110,0.22)]"
                : "border-[#bfdedb] bg-white text-[#294c55] hover:border-[#0f766e] hover:text-[#0f766e]",
            )}
          >
            {pack.shortName}
          </button>
        ))}
      </div>

      <div
        id="category-pack-panel"
        role="tabpanel"
        className="mt-5 overflow-hidden rounded-[2rem] border border-[#b7d9d5] bg-white shadow-[0_24px_70px_rgba(9,60,70,0.10)]"
      >
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative overflow-hidden bg-[#082b3a] p-6 text-white sm:p-9">
            <div className="absolute -right-24 -top-24 size-64 rounded-full bg-[#20c9b5]/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-20 size-56 rounded-full bg-[#ffb15c]/15 blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-[#65dfd0]/35 bg-[#65dfd0]/12 text-[#9ff3e8]">
                  {selected.name}
                </Badge>
                <Badge className="border-white/15 bg-white/8 text-white">
                  +${CATEGORY_PACK_PRICE_MONTHLY}/location/mo
                </Badge>
              </div>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-[#7de8da]">
                Built for
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {selected.audience}
              </h3>
              <p className="mt-4 max-w-xl leading-relaxed text-white/70">
                {selected.outcome}
              </p>

              <div className="mt-8 border-t border-white/12 pt-6">
                <p className="text-sm font-semibold text-white">
                  Category profile fields
                </p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {selected.profileFields.map((field) => (
                    <li
                      key={field}
                      className="flex items-start gap-2 text-sm text-white/72"
                    >
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-[#65dfd0]" />
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-9">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
                  Priority publisher plan
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#092d3b]">
                  Where the category earns trust
                </h3>
              </div>
              <p className="max-w-xs text-xs leading-relaxed text-[#55727a]">
                Rail labels describe how the work is delivered today, not a
                promise of universal API sync.
              </p>
            </div>

            <div className="mt-6 divide-y divide-[#dbeae8] border-y border-[#dbeae8]">
              {selected.publishers.map((publisher) => (
                <a
                  key={publisher.name}
                  href={publisher.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <span>
                    <span className="flex items-center gap-1.5 font-semibold text-[#092d3b] group-hover:text-[#0f766e]">
                      {publisher.name}
                      <ExternalLinkIcon className="size-3.5 opacity-35 transition-opacity group-hover:opacity-100" />
                    </span>
                    <span className="mt-1 block text-sm text-[#55727a]">
                      {publisher.role}
                    </span>
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "w-fit",
                      publisher.rail === "manual" &&
                        "border-[#f2c992] bg-[#fff7e9] text-[#8a5313]",
                      publisher.rail === "guided_import" &&
                        "border-[#a8d8f0] bg-[#edf8fd] text-[#166182]",
                      publisher.rail === "audit_only" &&
                        "border-[#c7d8df] bg-[#f5f8f9] text-[#4c6873]",
                    )}
                  >
                    {categoryPackRailLabel(publisher.rail)}
                  </Badge>
                </a>
              ))}
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#eaf8f5] p-4 text-sm leading-relaxed text-[#315a61]">
              <BadgeCheckIcon className="mt-0.5 size-5 shrink-0 text-[#0f766e]" />
              <p>
                <strong className="text-[#093843]">The deliverable:</strong>{" "}
                each publisher gets a verified status, evidence, and a clear
                next action. Google remains the direct core connector; category
                publishers are guided, manual, or audit-only today.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {DELIVERY_STEPS.map((item, index) => (
          <div
            key={item.step}
            className="relative rounded-2xl border border-[#c9e2df] bg-[#f7fbfa] p-5"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-[#dff4f0] text-[#0f766e]">
                <item.icon className="size-5" />
              </span>
              <span className="font-mono text-xs font-semibold text-[#7aa09f]">
                {item.step}
              </span>
            </div>
            <h4 className="mt-4 font-semibold text-[#092d3b]">{item.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-[#55727a]">
              {item.body}
            </p>
            {index < DELIVERY_STEPS.length - 1 ? (
              <ArrowRightIcon className="absolute -right-6 top-1/2 z-10 hidden size-4 text-[#80aaa5] md:block" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
