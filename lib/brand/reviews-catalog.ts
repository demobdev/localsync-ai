/**
 * Case studies, reviews, and creative proof from localmap.co (Firecrawl Jul 2026).
 * Images live in /public/reviews/
 */

export const WEBSITE_CASES = [
  {
    slug: "masstar-signs",
    name: "Masstar Signs",
    category: "Web design",
    image: "/reviews/case-masstar-signs.png",
  },
  {
    slug: "modern-chiropractic",
    name: "Modern Chiropractic",
    category: "Web design",
    image: "/reviews/case-modern-chiropractic.png",
  },
  {
    slug: "tesla-electric",
    name: "Tesla Electric",
    category: "Web design",
    image: "/reviews/case-tesla-electric.png",
  },
  {
    slug: "stoney-craven",
    name: "Stoney Craven Law",
    category: "Web design",
    image: "/reviews/case-stoney-craven.png",
  },
  {
    slug: "disability-hc",
    name: "Disability HC",
    category: "Web design",
    image: "/reviews/case-disability-hc.png",
  },
] as const;

export const SEO_CASES = [
  {
    slug: "revived-aesthetics",
    name: "Revived Aesthetics",
    summary:
      "Came over from a larger agency with little to show. We drove #1 rankings for their primary keyword and lifted discovery searches.",
    logo: "/reviews/seo-revived-aesthetics.jpg",
    ranking: "/reviews/seo-revived-ranking.png",
  },
  {
    slug: "wiz-team",
    name: "Wiz Team Inc.",
    summary:
      "High-end cleaning and restoration in Chicagoland. After #1 for their primary keyword, they expanded to multiple service areas and teams.",
    logo: "/reviews/seo-wiz-team-logo.png",
    ranking: "/reviews/seo-wiz-team-ranking.png",
  },
  {
    slug: "ladson-garbage",
    name: "Ladson Garbage Co.",
    summary:
      "Multi-generation family business. We modernized their marketing and mapped where their most profitable 20% of demand was searching.",
    logo: "/reviews/seo-ladson-logo.png",
    ranking: "/reviews/seo-ladson-ranking.png",
  },
  {
    slug: "jones-law",
    name: "Jones Law Firm",
    summary:
      "Solo practitioner in a crowded market. Budget-friendly strategy that routed new clients around larger competitors' ad machines.",
    logo: "/reviews/seo-jones-logo.png",
    ranking: "/reviews/seo-jones-ranking.png",
  },
] as const;

export const CLIENT_REVIEWS = [
  {
    slug: "stoney-craven",
    name: "Stoney Craven, ESQ",
    role: "Owner, The Law Office of James Stone Craven",
    quote:
      "Working with Local Map has been one of the best decisions of my business career. They were able to develop a brilliant website. They captured excellent video footage of client testimonials. They even traveled to my client locations to accommodate their needs. I've experienced a noticeable difference in web traffic as a direct result of work.",
    avatar: "/reviews/case-stoney-craven.png",
    relatedCase: "stoney-craven",
  },
  {
    slug: "tom-butler",
    name: "Tom Butler",
    role: "Owner, Sherlock Roof Cleaning",
    quote:
      "They have done an outstanding job with advertising our company! They're knowledgeable, friendly, patient along with reasonable pricing. We highly recommend them!",
    avatar: "/reviews/avatar-tom-butler.png",
  },
  {
    slug: "jenny-malkiel",
    name: "Dr. Jenny Malkiel",
    role: "Owner, Modern Chiropractic",
    quote:
      "Local Map Co has been amazing to work with! They completely re-vamped my whole website from scratch, and I'm really impressed with their work. They were professional and completed this project in a timely manner. They even provided original video and photography, so it took my business to the next level professionally. I'm already getting calls — I'm very satisfied with their service!",
    avatar: "/reviews/avatar-jenny-malkiel.png",
    relatedCase: "modern-chiropractic",
  },
] as const;

export const VIDEO_THUMBS = [
  { src: "/reviews/video-mccord.png", label: "McCord" },
  { src: "/reviews/video-ty-washington.png", label: "TY Washington" },
  { src: "/reviews/video-hair-studios.png", label: "Hair Studios" },
  { src: "/reviews/video-swamp-rabbit.png", label: "Swamp Rabbit Moving" },
  { src: "/reviews/video-sofrito.png", label: "Sofrito" },
  { src: "/reviews/video-mr-seafood.png", label: "Mr. Seafood" },
  { src: "/reviews/video-andy-thomas.png", label: "Andy Thomas" },
  { src: "/reviews/video-local-fig.png", label: "Local Fig" },
  { src: "/reviews/video-multipack.png", label: "Multipack Solutions" },
  { src: "/reviews/video-emerald-plate.png", label: "Emerald Plate" },
  { src: "/reviews/video-wiz-team.png", label: "Wiz Team" },
] as const;

export const PHOTO_GALLERY = [
  "/reviews/photo-imgl6492.jpg",
  "/reviews/photo-imgl3860.jpg",
  "/reviews/photo-imgl4047.jpg",
  "/reviews/photo-imgl1245.jpg",
  "/reviews/photo-imgl3709.jpg",
  "/reviews/photo-cheers.jpg",
  "/reviews/photo-2648.jpg",
  "/reviews/photo-still.jpg",
  "/reviews/photo-2eb3.jpg",
] as const;

export const CREATIVE_SAMPLES = [
  {
    src: "/reviews/creative-facebook-cover.png",
    label: "Facebook cover",
    wide: true,
  },
  {
    src: "/reviews/creative-stoney-social.png",
    label: "Stoney Craven social",
    wide: true,
  },
  {
    src: "/reviews/creative-swk-banner.png",
    label: "SWK banner ad",
    wide: true,
  },
  {
    src: "/reviews/creative-tm-mockup.png",
    label: "Trial Masters mockup",
    wide: true,
  },
  { src: "/reviews/creative-ad-square-1.png", label: "Display ad", wide: false },
  {
    src: "/reviews/creative-ad-covid-wiz.png",
    label: "Wiz Team campaign",
    wide: false,
  },
  {
    src: "/reviews/creative-ad-trial-masters.jpg",
    label: "Trial Masters ad",
    wide: false,
  },
  { src: "/reviews/creative-ad-fth.png", label: "FTH campaign", wide: false },
  {
    src: "/reviews/creative-ad-bab20.png",
    label: "BAB20 display",
    wide: false,
  },
] as const;

export const PORTFOLIO_WORKS = [
  "/reviews/work-1.jpg",
  "/reviews/work-2.jpg",
  "/reviews/work-4.jpg",
  "/reviews/work-9.jpg",
  "/reviews/work-10.jpg",
] as const;
