"use client";

import Image from "next/image";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { CLIENT_ARCHIVE_WORK } from "@/lib/brand/texture-assets";
import { cn } from "@/lib/utils";

export function PhotoMarquee({
  className,
  label = "Selected recent and archive client work",
}: {
  className?: string;
  label?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function move(direction: -1 | 1) {
    trackRef.current?.scrollBy({
      left: direction * Math.min(trackRef.current.clientWidth * 0.82, 760),
      behavior: "smooth",
    });
  }

  return (
    <section
      className={cn(
        "overflow-hidden border-b bg-[#eef9f6] py-12 dark:bg-[#10272c] sm:py-16",
        className,
      )}
      aria-label={label}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Client work · recent + archive
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              The work keeps moving forward.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Recent launches lead the reel, followed by selected projects from our
              earlier agency years. Every project adds something to the LocalMap
              playbook.
            </p>
          </div>
          <div className="hidden shrink-0 gap-2 sm:flex">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="rounded-full bg-background/80"
              onClick={() => move(-1)}
              aria-label="Previous client work"
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="rounded-full bg-background/80"
              onClick={() => move(1)}
              aria-label="Next client work"
            >
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div
          ref={trackRef}
          data-testid="client-archive-carousel"
          style={{ scrollbarWidth: "none" }}
          className="localmap-client-scroll -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:mx-0 xl:px-0"
        >
          {CLIENT_ARCHIVE_WORK.map((work) => (
            <figure
              key={work.src}
              className="group w-[82vw] max-w-[390px] shrink-0 snap-start overflow-hidden rounded-[1.4rem] border bg-card shadow-[0_18px_50px_rgba(8,52,60,.08)] xl:w-[calc((100%-3rem)/4)] xl:max-w-none"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <Image
                  src={work.src}
                  alt={work.alt}
                  fill
                  sizes="(max-width: 640px) 82vw, 390px"
                  className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-white uppercase backdrop-blur-md">
                  {work.kind}
                </span>
                {"era" in work && work.era === "Recent" ? (
                  <span className="absolute top-3 right-3 rounded-full border border-white/30 bg-[#d9ff55] px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-[#082f35] uppercase shadow-sm">
                    Recent
                  </span>
                ) : null}
              </div>
              <figcaption className="p-4">
                <p className="font-semibold">{work.client}</p>
                <p className="mt-1 text-sm text-muted-foreground">{work.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground sm:hidden">
          Swipe to explore client work
        </p>
      </div>
    </section>
  );
}
