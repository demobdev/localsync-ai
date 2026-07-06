export const VERTICAL_LABELS: Record<string, string> = {
  home_services: "Home services",
  professional: "Professional & internet",
  healthcare: "Healthcare",
  hospitality_retail: "Hospitality & retail",
  automotive: "Automotive",
};

export const VERTICAL_ORDER = [
  "professional",
  "home_services",
  "healthcare",
  "hospitality_retail",
  "automotive",
] as const;

export function getVerticalLabel(vertical: string): string {
  return VERTICAL_LABELS[vertical] ?? vertical;
}
