import { serve } from "inngest/next";

import { inngest } from "@/lib/inngest/client";
import { runLocationAudit } from "@/lib/inngest/functions/audit";
import { runPublisherSync } from "@/lib/inngest/functions/sync";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runLocationAudit, runPublisherSync],
});
