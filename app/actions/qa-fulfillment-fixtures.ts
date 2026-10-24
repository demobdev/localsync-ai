"use server";

import { revalidatePath } from "next/cache";
import { requireLocalMapStaff } from "@/lib/auth/localmap-staff.server";
import {
  canSeedSyntheticFulfillmentFixtures,
  seedSyntheticFulfillmentFixtures,
} from "@/lib/listings/qa-fulfillment-fixtures.server";

export async function seedSyntheticFulfillmentFixturesAction(_formData: FormData) {
  void _formData;
  const { userId } = await requireLocalMapStaff();
  if (!canSeedSyntheticFulfillmentFixtures()) {
    throw new Error("Synthetic fixtures are unavailable outside the isolated QA Preview.");
  }
  await seedSyntheticFulfillmentFixtures(userId);
  revalidatePath("/internal/publisher-fulfillment");
}
