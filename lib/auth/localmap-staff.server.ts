import "server-only";

import { currentUser } from "@clerk/nextjs/server";

export function isStaffFulfillmentEnabled() {
  return process.env.LOCALMAP_STAFF_FULFILLMENT_ENABLED === "true";
}

export async function requireLocalMapStaff() {
  if (!isStaffFulfillmentEnabled()) throw new Error("LocalMap staff fulfillment is disabled.");
  const user = await currentUser();
  if (!user || user.privateMetadata?.localmapStaff !== true) {
    throw new Error("LocalMap staff access required.");
  }
  return { userId: user.id };
}
