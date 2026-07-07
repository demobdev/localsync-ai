import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { connectorCredentials } from "@/db/schema";
import type { LocationProfileSnapshot, RegularHours } from "@/lib/types/location-profile";

const GBP_SCOPE = "https://www.googleapis.com/auth/business.manage";

export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";
  return `${base.replace(/\/$/, "")}/api/connectors/google/callback`;
}

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: GBP_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
};

export async function exchangeGoogleCode(code: string): Promise<TokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google token exchange failed: ${body.slice(0, 300)}`);
  }

  return (await response.json()) as TokenResponse;
}

export async function saveGoogleCredentials(
  organizationId: string,
  tokens: TokenResponse,
) {
  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  const existing = await db
    .select({ id: connectorCredentials.id })
    .from(connectorCredentials)
    .where(
      and(
        eq(connectorCredentials.organizationId, organizationId),
        eq(connectorCredentials.provider, "google"),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(connectorCredentials)
      .set({
        accessToken: tokens.access_token,
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        expiresAt,
        scope: tokens.scope,
        updatedAt: now,
      })
      .where(eq(connectorCredentials.id, existing[0].id));
  } else {
    await db.insert(connectorCredentials).values({
      organizationId,
      provider: "google",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt,
      scope: tokens.scope,
    });
  }
}

export type GbpFetchErrorCode =
  | "quota_exceeded"
  | "api_not_approved"
  | "permission_denied"
  | "unknown";

export function classifyGbpFetchError(error: unknown): {
  code: GbpFetchErrorCode;
  message: string;
} {
  const raw = typeof error === "string" ? error : error instanceof Error ? error.message : String(error);

  if (
    raw.includes("Quota exceeded") ||
    raw.includes("RESOURCE_EXHAUSTED") ||
    raw.includes('"code": 429')
  ) {
    return {
      code: "quota_exceeded",
      message:
        "Google Business Profile API quota is not available yet. Submit the Basic API Access request in Google Cloud and wait for approval (often 2–6 weeks). OAuth connected successfully — location import will work once quota is granted.",
    };
  }

  if (raw.includes("403") || raw.includes("PERMISSION_DENIED")) {
    return {
      code: "permission_denied",
      message:
        "This Google account does not have permission to read Business Profile data. The account must be an owner or manager on at least one verified listing.",
    };
  }

  if (raw.includes("404") || raw.includes("NOT_FOUND")) {
    return {
      code: "api_not_approved",
      message:
        "Business Profile APIs may not be enabled or approved for this Google Cloud project. Enable Account Management and Business Information APIs, then submit the GBP API access form.",
    };
  }

  return {
    code: "unknown",
    message: raw.slice(0, 280) || "Could not load Google Business Profile locations.",
  };
}

export async function hasGoogleCredentials(
  organizationId: string,
): Promise<boolean> {
  const db = getDb();

  const [credentials] = await db
    .select({ id: connectorCredentials.id })
    .from(connectorCredentials)
    .where(
      and(
        eq(connectorCredentials.organizationId, organizationId),
        eq(connectorCredentials.provider, "google"),
      ),
    )
    .limit(1);

  return Boolean(credentials);
}

export async function getValidGoogleAccessToken(
  organizationId: string,
): Promise<string | null> {
  const db = getDb();

  const [credentials] = await db
    .select()
    .from(connectorCredentials)
    .where(
      and(
        eq(connectorCredentials.organizationId, organizationId),
        eq(connectorCredentials.provider, "google"),
      ),
    )
    .limit(1);

  if (!credentials?.accessToken) {
    return null;
  }

  const expiresSoon =
    !credentials.expiresAt ||
    credentials.expiresAt.getTime() < Date.now() + 60_000;

  if (!expiresSoon) {
    return credentials.accessToken;
  }

  if (!credentials.refreshToken) {
    return null;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: credentials.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    return null;
  }

  const tokens = (await response.json()) as TokenResponse;

  await db
    .update(connectorCredentials)
    .set({
      accessToken: tokens.access_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      updatedAt: new Date(),
    })
    .where(eq(connectorCredentials.id, credentials.id));

  return tokens.access_token;
}

export type GbpLocation = {
  gbpName: string;
  title: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  regularHours: RegularHours;
  categories: string[];
  /** OPEN, CLOSED_PERMANENTLY, CLOSED_TEMPORARILY, or undefined when not returned */
  openStatus?: string;
  /** Link to the live listing on Google Maps */
  mapsUri?: string;
  /** Google flagged this listing as a duplicate of another */
  hasDuplicate?: boolean;
  /** Listing can't be updated via API (e.g. suspended) */
  canUpdate?: boolean;
};

const DAY_MAP: Record<string, keyof RegularHours> = {
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
  SUNDAY: "sunday",
};

function formatGbpTime(time?: { hours?: number; minutes?: number }): string {
  const hours = String(time?.hours ?? 0).padStart(2, "0");
  const minutes = String(time?.minutes ?? 0).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export type FetchGbpLocationsResult =
  | { ok: true; locations: GbpLocation[] }
  | {
      ok: false;
      error: { code: GbpFetchErrorCode; message: string };
    };

export async function fetchGbpLocationsSafe(
  accessToken: string,
): Promise<FetchGbpLocationsResult> {
  const accountsResponse = await fetch(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!accountsResponse.ok) {
    const body = await accountsResponse.text();
    return {
      ok: false,
      error: classifyGbpFetchError(body),
    };
  }

  const accountsPayload = (await accountsResponse.json()) as {
    accounts?: Array<{ name: string }>;
  };

  const accounts = accountsPayload.accounts ?? [];
  const locations: GbpLocation[] = [];

  for (const account of accounts) {
    const readMask =
      "name,title,phoneNumbers,websiteUri,storefrontAddress,regularHours,categories,openInfo,metadata";
    const locationsResponse = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=${encodeURIComponent(readMask)}&pageSize=100`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!locationsResponse.ok) {
      continue;
    }

    const payload = (await locationsResponse.json()) as {
      locations?: Array<{
        name: string;
        title?: string;
        phoneNumbers?: { primaryPhone?: string };
        websiteUri?: string;
        storefrontAddress?: {
          addressLines?: string[];
          locality?: string;
          administrativeArea?: string;
          postalCode?: string;
        };
        regularHours?: {
          periods?: Array<{
            openDay?: string;
            openTime?: { hours?: number; minutes?: number };
            closeTime?: { hours?: number; minutes?: number };
          }>;
        };
        categories?: {
          primaryCategory?: { displayName?: string };
          additionalCategories?: Array<{ displayName?: string }>;
        };
        openInfo?: { status?: string };
        metadata?: {
          mapsUri?: string;
          duplicateLocation?: string;
          canOperateLocalPost?: boolean;
          canModifyServiceList?: boolean;
          hasPendingEdits?: boolean;
        };
      }>;
    };

    for (const location of payload.locations ?? []) {
      const regularHours: RegularHours = {};

      for (const period of location.regularHours?.periods ?? []) {
        const day = period.openDay ? DAY_MAP[period.openDay] : undefined;
        if (!day) {
          continue;
        }

        regularHours[day] = {
          open: formatGbpTime(period.openTime),
          close: formatGbpTime(period.closeTime),
        };
      }

      const categories = [
        location.categories?.primaryCategory?.displayName,
        ...(location.categories?.additionalCategories?.map(
          (category) => category.displayName,
        ) ?? []),
      ].filter((value): value is string => Boolean(value));

      locations.push({
        gbpName: location.name,
        title: location.title ?? "Untitled location",
        phone: location.phoneNumbers?.primaryPhone,
        website: location.websiteUri,
        addressLine1: location.storefrontAddress?.addressLines?.join(", "),
        city: location.storefrontAddress?.locality,
        state: location.storefrontAddress?.administrativeArea,
        postalCode: location.storefrontAddress?.postalCode,
        regularHours,
        categories,
        openStatus: location.openInfo?.status,
        mapsUri: location.metadata?.mapsUri,
        hasDuplicate: Boolean(location.metadata?.duplicateLocation),
        canUpdate: location.metadata?.canModifyServiceList ?? undefined,
      });
    }
  }

  return { ok: true, locations };
}

/** @deprecated Prefer fetchGbpLocationsSafe to avoid throwing on expected API errors. */
export async function fetchGbpLocations(
  accessToken: string,
): Promise<GbpLocation[]> {
  const result = await fetchGbpLocationsSafe(accessToken);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.locations;
}

export type GbpFieldKey =
  | "name"
  | "phone"
  | "website"
  | "addressLine1"
  | "city"
  | "state"
  | "postalCode"
  | "regularHours";

export function applyGbpFields(
  master: LocationProfileSnapshot,
  gbp: GbpLocation,
  fields: GbpFieldKey[],
): LocationProfileSnapshot {
  const next: LocationProfileSnapshot = { ...master };

  for (const field of fields) {
    switch (field) {
      case "name":
        next.name = gbp.title;
        break;
      case "phone":
        if (gbp.phone) next.phone = gbp.phone;
        break;
      case "website":
        if (gbp.website) next.website = gbp.website;
        break;
      case "addressLine1":
        if (gbp.addressLine1) next.addressLine1 = gbp.addressLine1;
        break;
      case "city":
        if (gbp.city) next.city = gbp.city;
        break;
      case "state":
        if (gbp.state) next.state = gbp.state;
        break;
      case "postalCode":
        if (gbp.postalCode) next.postalCode = gbp.postalCode;
        break;
      case "regularHours":
        next.regularHours = gbp.regularHours;
        break;
    }
  }

  return next;
}
