import { inngest } from "@/lib/inngest/client";
import { executeWebsiteAudit } from "@/lib/search-intelligence/audit";

export const runWebsiteAudit = inngest.createFunction(
  {
    id: "run-website-audit",
    retries: 2,
    concurrency: { limit: 3 },
    triggers: { event: "search-intelligence/audit.requested" },
  },
  async ({ event, step }) => {
    const auditRunId = event.data.auditRunId as string;
    await step.run("crawl-and-score-website", () =>
      executeWebsiteAudit(auditRunId),
    );
    return { auditRunId };
  },
);

