export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function uniqueSlug(base: string, suffix?: string) {
  const normalized = slugify(base);
  if (!suffix) {
    return normalized;
  }

  return slugify(`${normalized}-${suffix}`);
}
