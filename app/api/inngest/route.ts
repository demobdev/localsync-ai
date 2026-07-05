import { serve } from "inngest/next";

import { inngest } from "@/lib/inngest/client";
import { runLocationAudit } from "@/lib/inngest/functions/audit";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runLocationAudit],
});
