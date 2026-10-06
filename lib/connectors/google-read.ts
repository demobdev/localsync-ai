import { classifyGbpFetchError, type GbpFetchErrorCode } from "./google-errors";

type GoogleReadResult<T> =
  | { ok: true; items: T[] }
  | { ok: false; error: { code: GbpFetchErrorCode; message: string } };

/** Read every page; never represent partial or malformed data as a successful empty list. */
export async function readGooglePages<T>(
  endpoint: string,
  collection: string,
  accessToken: string,
): Promise<GoogleReadResult<T>> {
  const items: T[] = [];
  const seenTokens = new Set<string>();
  let pageToken: string | undefined;
  try {
    do {
      const url = new URL(endpoint);
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok)
        return {
          ok: false,
          error: classifyGbpFetchError(await response.text(), response.status),
        };
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== "object" || Array.isArray(payload))
        throw new Error("Invalid page");
      const page = payload as Record<string, unknown>;
      const values = page[collection];
      if (values !== undefined && !Array.isArray(values))
        throw new Error("Invalid collection");
      items.push(...((values ?? []) as T[]));
      if (
        page.nextPageToken !== undefined &&
        typeof page.nextPageToken !== "string"
      )
        throw new Error("Invalid pagination");
      pageToken = page.nextPageToken as string | undefined;
      if (pageToken && seenTokens.has(pageToken))
        throw new Error("Repeated page token");
      if (pageToken) seenTokens.add(pageToken);
    } while (pageToken);
    return { ok: true, items };
  } catch {
    return {
      ok: false,
      error: {
        code: "unknown",
        message:
          "Google's complete response could not be read. Refresh and try again; partial results were not used.",
      },
    };
  }
}
