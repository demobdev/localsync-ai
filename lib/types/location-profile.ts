export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type RegularHours = Partial<
  Record<
    DayOfWeek,
    {
      open: string;
      close: string;
      closed?: boolean;
    }
  >
>;

export type HolidayHoursEntry = {
  date: string;
  label?: string;
  open?: string;
  close?: string;
  closed?: boolean;
};

export type LocationPhoto = {
  id: string;
  url: string;
  caption?: string;
  category?: "logo" | "cover" | "interior" | "exterior" | "team" | "other";
  sortOrder: number;
};

export type LocationFaq = {
  question: string;
  answer: string;
};

export type LocationProfileSnapshot = {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  categorySlug?: string;
  serviceSlugs: string[];
  regularHours: RegularHours;
  holidayHours: HolidayHoursEntry[];
  attributes: Record<string, string | boolean | number>;
  photos: LocationPhoto[];
  sameAs: string[];
  faqs?: LocationFaq[];
};

export const EMPTY_LOCATION_PROFILE: LocationProfileSnapshot = {
  name: "",
  serviceSlugs: [],
  regularHours: {},
  holidayHours: [],
  attributes: {},
  photos: [],
  sameAs: [],
};
