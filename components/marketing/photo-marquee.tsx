"use client";

import Image from "next/image";

import { MARQUEE_PHOTOS } from "@/lib/brand/texture-assets";
import { cn } from "@/lib/utils";

export function PhotoMarquee({
  className,
  label = "Real Greenville-area brands we have helped get found",
}: {
  className?: string;
  label?: string;
}) {
  const loop = [...MARQUEE_PHOTOS, ...MARQUEE_PHOTOS];

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b bg-foreground/[0.03] py-8",
        className,
      )}
      aria-label={label}
    >
      <p className="mx-auto mb-5 max-w-6xl px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:px-6">
        {label}
      </p>
      <div className="localmap-marquee-mask relative">
        <div className="localmap-marquee flex w-max gap-3 will-change-transform">
          {loop.map((photo, index) => (
            <figure
              key={`${photo.src}-${index}`}
              className="relative h-36 w-56 shrink-0 overflow-hidden rounded-lg sm:h-44 sm:w-72"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="288px"
                className="object-cover transition-transform duration-700 ease-out hover:scale-[1.04]"
                draggable={false}
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
