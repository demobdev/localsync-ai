import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { scanLeads } from "@/db/schema";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ScanPrefill = {
  scanId: string;
  url: string;
  businessName: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  score: number;
};

export async function getScanPrefill(
  scanId: string,
): Promise<ScanPrefill | null> {
  if (!UUID_RE.test(scanId)) {
    return null;
  }

  const db = getDb();
  const [lead] = await db
    .select({
      id: scanLeads.id,
      url: scanLeads.url,
      businessName: scanLeads.businessName,
      phone: scanLeads.phone,
      city: scanLeads.city,
      state: scanLeads.state,
      score: scanLeads.score,
    })
    .from(scanLeads)
    .where(eq(scanLeads.id, scanId))
    .limit(1);

  if (!lead) {
    return null;
  }

  return {
    scanId: lead.id,
    url: lead.url,
    businessName: lead.businessName,
    phone: lead.phone,
    city: lead.city,
    state: lead.state,
    score: lead.score,
  };
}
