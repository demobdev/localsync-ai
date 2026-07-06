import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

const DAY_SCHEMA: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function buildOpeningHoursSpecification(
  regularHours: LocationProfileSnapshot["regularHours"],
): Array<Record<string, string>> {
  const specs: Array<Record<string, string>> = [];

  for (const [day, hours] of Object.entries(regularHours)) {
    const dayOfWeek = DAY_SCHEMA[day];
    if (!dayOfWeek || !hours) {
      continue;
    }

    if (hours.closed) {
      continue;
    }

    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${dayOfWeek}`,
      opens: hours.open,
      closes: hours.close,
    });
  }

  return specs;
}

export function buildLocationJsonLd(input: {
  profile: LocationProfileSnapshot;
  schemaOrgType: string;
  pageUrl: string;
  serviceNames: string[];
}): Record<string, unknown> {
  const { profile, schemaOrgType, pageUrl, serviceNames } = input;

  const address =
    profile.addressLine1 || profile.city
      ? {
          "@type": "PostalAddress",
          streetAddress: profile.addressLine1,
          addressLocality: profile.city,
          addressRegion: profile.state,
          postalCode: profile.postalCode,
          addressCountry: profile.country ?? "US",
        }
      : undefined;

  const geo =
    profile.latitude && profile.longitude
      ? {
          "@type": "GeoCoordinates",
          latitude: profile.latitude,
          longitude: profile.longitude,
        }
      : undefined;

  const openingHours = buildOpeningHoursSpecification(profile.regularHours);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaOrgType,
    "@id": pageUrl,
    name: profile.name,
    url: pageUrl,
    description: profile.description,
    telephone: profile.phone,
    email: profile.email,
    image: profile.photos.map((photo) => photo.url),
    sameAs: profile.sameAs.filter(Boolean),
    address,
    geo,
    openingHoursSpecification: openingHours.length > 0 ? openingHours : undefined,
    areaServed: profile.city
      ? {
          "@type": "City",
          name: profile.city,
        }
      : undefined,
    hasOfferCatalog:
      serviceNames.length > 0
        ? {
            "@type": "OfferCatalog",
            name: "Services",
            itemListElement: serviceNames.map((name, index) => ({
              "@type": "Offer",
              position: index + 1,
              itemOffered: {
                "@type": "Service",
                name,
              },
            })),
          }
        : undefined,
  };

  const faqs = profile.faqs?.filter(
    (faq) => faq.question.trim() && faq.answer.trim(),
  );

  if (faqs && faqs.length > 0) {
    jsonLd.subjectOf = {
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };
  }

  return Object.fromEntries(
    Object.entries(jsonLd).filter(([, value]) => value !== undefined && value !== ""),
  );
}
