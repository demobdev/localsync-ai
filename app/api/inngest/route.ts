import { serve } from "inngest/next";

import { inngest } from "@/lib/inngest/client";
import { runLocationAudit } from "@/lib/inngest/functions/audit";
import { runWebsiteAudit } from "@/lib/inngest/functions/search-intelligence";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runLocationAudit, runWebsiteAudit],
});
