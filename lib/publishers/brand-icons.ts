import type { SimpleIcon } from "simple-icons";
import {
  siApple,
  siFacebook,
  siFoursquare,
  siGoogle,
  siGooglegemini,
  siHomeadvisor,
  siHouzz,
  siNextdoor,
  siPerplexity,
  siThumbtack,
  siYelp,
} from "simple-icons";

/** Maps our publisher slug → Simple Icons export (when available). */
export const PUBLISHER_BRAND_ICONS: Partial<Record<string, SimpleIcon>> = {
  "google-business-profile": siGoogle,
  facebook: siFacebook,
  yelp: siYelp,
  nextdoor: siNextdoor,
  "apple-business-connect": siApple,
  homeadvisor: siHomeadvisor,
  thumbtack: siThumbtack,
  houzz: siHouzz,
  foursquare: siFoursquare,
};

export type AiPlatformId =
  | "google"
  | "gemini"
  | "chatgpt"
  | "apple"
  | "bing"
  | "facebook"
  | "yelp"
  | "perplexity";

export type BrandDisplay = {
  id: string;
  label: string;
  icon?: SimpleIcon;
  /** Render the official multicolor mark (e.g. Google G) instead of single-fill SVG */
  multicolor?: boolean;
  /** Tailwind bg class when no Simple Icon exists */
  fallbackClass?: string;
  /** Letter shown for fallback circles */
  fallbackLetter?: string;
};

export const AI_PLATFORM_BRANDS: BrandDisplay[] = [
  { id: "google", label: "Google", icon: siGoogle, multicolor: true },
  { id: "gemini", label: "Gemini", icon: siGooglegemini },
  {
    id: "chatgpt",
    label: "ChatGPT",
    fallbackClass: "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900",
    fallbackLetter: "✦",
  },
  { id: "apple", label: "Apple Maps", icon: siApple },
  {
    id: "bing",
    label: "Bing",
    fallbackClass: "bg-sky-500 text-white",
    fallbackLetter: "b",
  },
  { id: "facebook", label: "Facebook", icon: siFacebook },
  { id: "yelp", label: "Yelp", icon: siYelp },
  { id: "perplexity", label: "Perplexity", icon: siPerplexity },
];

export const FEATURED_PUBLISHER_SLUGS = [
  "google-business-profile",
  "apple-business-connect",
  "facebook",
  "yelp",
  "bing-places",
  "nextdoor",
  "bbb",
  "angi",
  "homeadvisor",
  "thumbtack",
  "houzz",
  "foursquare",
] as const;

export function getPublisherBrand(slug: string): BrandDisplay {
  if (slug === "google-business-profile" || slug === "google") {
    return {
      id: slug,
      label: "Google",
      icon: siGoogle,
      multicolor: true,
    };
  }

  const icon = PUBLISHER_BRAND_ICONS[slug];
  if (icon) {
    return { id: slug, label: icon.title, icon };
  }

  const label = slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    id: slug,
    label,
    fallbackClass: "bg-primary/15 text-primary",
    fallbackLetter: label.charAt(0),
  };
}
