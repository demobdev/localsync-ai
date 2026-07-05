export type ScrapeResult = {
  markdown: string;
  title?: string;
  sourceUrl: string;
};

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not configured");
  }

  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: false,
      timeout: 60000,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Firecrawl scrape failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    success: boolean;
    data?: { markdown?: string; metadata?: { title?: string } };
    error?: string;
  };

  if (!payload.success || !payload.data?.markdown) {
    throw new Error(payload.error ?? "Firecrawl returned no markdown");
  }

  return {
    markdown: payload.data.markdown,
    title: payload.data.metadata?.title,
    sourceUrl: url,
  };
}
