function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002").replace(
    /\/$/,
    "",
  );
}

export type IndexNowResult =
  | { submitted: true; status: number }
  | { skipped: true; reason: string };

export async function submitIndexNow(urls: string[]): Promise<IndexNowResult> {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) {
    return { skipped: true, reason: "INDEXNOW_KEY not configured" };
  }

  const baseUrl = getAppBaseUrl();
  let host: string;

  try {
    host = new URL(baseUrl).host;
  } catch {
    return { skipped: true, reason: "Invalid NEXT_PUBLIC_APP_URL" };
  }

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `${baseUrl}/api/indexnow-key`,
      urlList: urls,
    }),
  });

  return { submitted: true, status: response.status };
}
