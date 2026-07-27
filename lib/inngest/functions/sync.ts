import { inngest } from "@/lib/inngest/client";
import { executeSyncJob } from "@/lib/sync/execute";

export const runPublisherSync = inngest.createFunction(
  {
    id: "run-publisher-sync",
    retries: 2,
    concurrency: { limit: 3 },
    triggers: { event: "sync/job.requested" },
  },
  async ({ event, step }) => {
    const syncJobId = event.data.syncJobId as string;

    const result = await step.run("execute-sync", async () => {
      return executeSyncJob(syncJobId);
    });

    return result;
  },
);
