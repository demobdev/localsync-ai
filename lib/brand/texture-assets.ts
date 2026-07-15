/**
 * Full-res photography crawled from localmap.co (Jul 2026).
 * Real Local Map Co. client / field work — used as marketing surface texture.
 */

export const HERO_TEXTURE = {
  primary: "/texture/hero-chamber.jpg",
  secondary: "/texture/hero-still.jpg",
  tertiary: "/texture/hero-facility.jpg",
  accent: "/texture/hero-team.jpg",
} as const;

export const MARQUEE_PHOTOS = [
  {
    src: "/texture/hero-chamber.jpg",
    alt: "Local professional at the Chamber of Commerce",
  },
  {
    src: "/texture/hero-still.jpg",
    alt: "Wiz Team restoration specialist at work",
  },
  {
    src: "/texture/hero-facility.jpg",
    alt: "Manufacturing team on a packaging line",
  },
  {
    src: "/texture/hero-team.jpg",
    alt: "Restaurant listing photography",
  },
  {
    src: "/texture/hero-storefront.jpg",
    alt: "Lab and research listing photography",
  },
  {
    src: "/texture/hero-workspace.jpg",
    alt: "Local business workspace",
  },
  {
    src: "/texture/surface-cheers.jpg",
    alt: "Hospitality listing photography",
  },
  {
    src: "/texture/hero-event.jpg",
    alt: "Wellness and retail listing photography",
  },
  {
    src: "/reviews/case-masstar-signs.png",
    alt: "Masstar Signs website case study",
  },
  {
    src: "/reviews/case-modern-chiropractic.png",
    alt: "Modern Chiropractic website case study",
  },
  {
    src: "/reviews/video-swamp-rabbit.png",
    alt: "Swamp Rabbit Moving video still",
  },
  {
    src: "/reviews/case-tesla-electric.png",
    alt: "Tesla Electric website case study",
  },
] as const;

export const HERITAGE_STRIP = [
  HERO_TEXTURE.primary,
  HERO_TEXTURE.secondary,
  HERO_TEXTURE.tertiary,
  HERO_TEXTURE.accent,
] as const;
