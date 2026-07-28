import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import {
  searchConsoleConnections,
  searchPerformanceDaily,
} from "@/db/schema";
import { getValidGoogleAccessToken } from "@/lib/connectors/google";

type SearchConsoleProperty = {
  siteUrl: string;
  permissionLevel?: string;
};

export async function connectMatchingSearchConsoleProperty(input: {
  organizationId: string;
  locationId: string;
  website: string;
}) {
  const token = await getValidGoogleAccessToken(input.organizationId);
  if (!token) throw new Error("Google authorization did not return a usable token");

  const response = await fetch(
    "https://www.googleapis.com/webmasters/v3/sites",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) {
    throw new Error(`Search Console property lookup failed (${response.status})`);
  }
  const payload = (await response.json()) as { siteEntry?: SearchConsoleProperty[] };
  const host = new URL(input.website).hostname.replace(/^www\./, "");
  const property = (payload.siteEntry ?? []).find((candidate) => {
    if (candidate.siteUrl === `sc-domain:${host}`) return true;
    try {
      return new URL(candidate.siteUrl).hostname.replace(/^www\./, "") === host;
    } catch {
      return false;
    }
  });
  if (!property) {
    throw new Error(`No Search Console property matched ${host}`);
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: searchConsoleConnections.id })
    .from(searchConsoleConnections)
    .where(eq(searchConsoleConnections.locationId, input.locationId))
    .limit(1);
  if (existing) {
    await db
      .update(searchConsoleConnections)
      .set({
        propertyUrl: property.siteUrl,
        permissionLevel: property.permissionLevel ?? null,
        updatedAt: new Date(),
      })
      .where(eq(searchConsoleConnections.id, existing.id));
  } else {
    await db.insert(searchConsoleConnections).values({
      locationId: input.locationId,
      propertyUrl: property.siteUrl,
      permissionLevel: property.permissionLevel ?? null,
    });
  }
  return property;
}

export async function syncSearchConsolePerformance(input: {
  organizationId: string;
  locationId: string;
  days?: number;
}) {
  const db = getDb();
  const [connection] = await db
    .select()
    .from(searchConsoleConnections)
    .where(eq(searchConsoleConnections.locationId, input.locationId))
    .limit(1);
  if (!connection) throw new Error("Connect Search Console first");
  const token = await getValidGoogleAccessToken(input.organizationId);
  if (!token) throw new Error("Google authorization expired");

  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 2);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (input.days ?? 28));
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(connection.propertyUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        dimensions: ["date", "query", "page", "device", "country"],
        rowLimit: 25_000,
        dataState: "final",
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`Search Console sync failed (${response.status})`);
  }
  const payload = (await response.json()) as {
    rows?: Array<{
      keys: [string, string, string, string, string];
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }>;
  };
  for (const row of payload.rows ?? []) {
    const [day, query, page, device, country] = row.keys;
    await db
      .insert(searchPerformanceDaily)
      .values({
        locationId: input.locationId,
        day,
        query,
        page,
        device,
        country,
        clicks: Math.round(row.clicks),
        impressions: Math.round(row.impressions),
        ctrMicros: Math.round(row.ctr * 1_000_000),
        positionMicros: Math.round(row.position * 1_000_000),
      })
      .onConflictDoUpdate({
        target: [
          searchPerformanceDaily.locationId,
          searchPerformanceDaily.day,
          searchPerformanceDaily.query,
          searchPerformanceDaily.page,
          searchPerformanceDaily.device,
          searchPerformanceDaily.country,
        ],
        set: {
          clicks: Math.round(row.clicks),
          impressions: Math.round(row.impressions),
          ctrMicros: Math.round(row.ctr * 1_000_000),
          positionMicros: Math.round(row.position * 1_000_000),
          updatedAt: new Date(),
        },
      });
  }
  await db
    .update(searchConsoleConnections)
    .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
    .where(eq(searchConsoleConnections.id, connection.id));
  return { rows: payload.rows?.length ?? 0 };
}
