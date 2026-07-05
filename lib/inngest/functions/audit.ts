import { inngest } from "@/lib/inngest/client";
import { executeAuditRun } from "@/lib/audit/run";

export const runLocationAudit = inngest.createFunction(
  {
    id: "run-location-audit",
    retries: 2,
    concurrency: { limit: 3 },
    triggers: { event: "audit/run.requested" },
  },
  async ({ event, step }) => {
    const auditRunId = event.data.auditRunId as string;

    await step.run("execute-audit", async () => {
      await executeAuditRun(auditRunId);
    });

    return { auditRunId };
  },
);
