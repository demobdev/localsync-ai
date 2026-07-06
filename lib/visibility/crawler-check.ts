import { scrapeUrl } from "@/lib/firecrawl";

export type CrawlerCheckResult = {
  ok: boolean;
  hasJsonLd: boolean;
  hasTitle: boolean;
  statusCode?: number;
  notes: string[];
};

export async function runCrawlerCheck(pageUrl: string): Promise<CrawlerCheckResult> {
  const notes: string[] = [];

  try {
    const response = await fetch(pageUrl, {
      headers: { Accept: "text/html" },
      cache: "no-store",
    });

    const html = await response.text();
    const hasJsonLd =
      html.includes("application/ld+json") && html.includes('"@type"');
    const hasTitle = html.includes("<title>") && !html.includes("<title></title>");

    if (!response.ok) {
      notes.push(`HTTP ${response.status}`);
    }

    if (!hasJsonLd) {
      notes.push("Missing JSON-LD structured data");
    }

    if (!hasTitle) {
      notes.push("Missing page title");
    }

    if (process.env.FIRECRAWL_API_KEY) {
      try {
        const scraped = await scrapeUrl(pageUrl);
        if (scraped.markdown.length < 100) {
          notes.push("Firecrawl returned very little content — page may not be crawlable");
        } else {
          notes.push("Firecrawl crawl succeeded");
        }
      } catch {
        notes.push("Firecrawl crawl failed — check page is publicly reachable");
      }
    }

    return {
      ok: response.ok && hasJsonLd && hasTitle,
      hasJsonLd,
      hasTitle,
      statusCode: response.status,
      notes,
    };
  } catch (error) {
    return {
      ok: false,
      hasJsonLd: false,
      hasTitle: false,
      notes: [
        error instanceof Error ? error.message : "Could not fetch public page",
      ],
    };
  }
}
