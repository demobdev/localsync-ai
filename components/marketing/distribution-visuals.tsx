"use client";

import { SparklesIcon } from "lucide-react";

import { BrandIconBadge } from "@/components/brand/brand-icon";
import { AI_PLATFORM_BRANDS } from "@/lib/publishers/brand-icons";
import { cn } from "@/lib/utils";

export function DistributionFlowVisual({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-lg rounded-3xl border bg-card/80 p-6 shadow-xl shadow-primary/5 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <SparklesIcon className="size-4" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Master profile
          </p>
          <p className="font-semibold">Your business · one source of truth</p>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border bg-muted/30 p-3 text-sm">
        {["Name & NAP", "Hours & services", "Photos & FAQs"].map((field) => (
          <div
            key={field}
            className="flex items-center justify-between rounded-lg bg-background px-3 py-2"
          >
            <span className="text-muted-foreground">{field}</span>
            <span className="text-xs font-medium text-primary">Synced</span>
          </div>
        ))}
      </div>

      <div className="relative my-6 h-8">
        <div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-primary" />
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
        {AI_PLATFORM_BRANDS.slice(0, 8).map((brand, index) => (
          <div
            key={brand.id}
            className="flex flex-col items-center gap-2"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <BrandIconBadge brand={brand} size={32} showCheck />
            <span className="text-center text-[10px] leading-tight text-muted-foreground">
              {brand.label}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Audits verify live listings · AI pages feed LLM crawlers
      </p>
    </div>
  );
}

export function AiVisibilityShowcase() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="localmap-card-glow rounded-2xl border bg-card p-5 shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <BrandIconBadge
            brand={AI_PLATFORM_BRANDS[0]!}
            size={28}
          />
          <span className="text-sm font-medium text-muted-foreground">
            Google Business Profile
          </span>
        </div>
        <h3 className="text-lg font-semibold">Oceanview Wealth Management</h3>
        <div className="mt-1 flex items-center gap-1 text-sm text-amber-500">
          ★★★★★ <span className="text-muted-foreground">· Financial planner</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Website", "Directions", "Call", "Reviews"].map((action) => (
            <span
              key={action}
              className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium"
            >
              {action}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Structured NAP, hours, services, and FAQs — formatted for Maps and
          Search.
        </p>
      </div>

      <div className="localmap-card-glow rounded-2xl border bg-card p-5 shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <BrandIconBadge
            brand={AI_PLATFORM_BRANDS[2]!}
            size={28}
          />
          <span className="text-sm font-medium text-muted-foreground">
            AI answer
          </span>
        </div>
        <p className="rounded-xl bg-muted/40 px-3 py-2 text-sm italic text-muted-foreground">
          &ldquo;Best financial advisor for retirement planning near me&rdquo;
        </p>
        <div className="mt-4 space-y-2 text-sm">
          <p className="font-medium">Recommended local options</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              Oceanview Wealth Management — fiduciary planning, verified listing
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary/40" />
              Pulled from your hosted schema.org + llms.txt page
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
