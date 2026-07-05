import { slugify } from "@/lib/slugify";

export function buildClientSlug(name: string) {
  return slugify(name);
}

export function buildLocationSlug(name: string, city?: string) {
  const base = city ? `${name}-${city}` : name;
  return slugify(base);
}
