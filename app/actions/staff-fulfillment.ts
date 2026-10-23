"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireLocalMapStaff } from "@/lib/auth/localmap-staff.server";
import { transitionStaffFulfillmentCase } from "@/lib/listings/staff-fulfillment.server";

const actionSchema = z.object({
  attemptId: z.string().uuid(),
  expectedRevision: z.coerce.number().int().min(0).max(1_000_000),
  note: z.string().max(500).optional(),
});

async function transition(formData: FormData, action: "claim" | "request_information" | "resume") {
  const { userId } = await requireLocalMapStaff();
  const parsed = actionSchema.safeParse({
    attemptId: formData.get("attemptId"),
    expectedRevision: formData.get("expectedRevision"),
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) throw new Error("Refresh the queue and submit a valid staff action.");
  await transitionStaffFulfillmentCase({ ...parsed.data, action, operatorUserId: userId });
  revalidatePath("/internal/publisher-fulfillment");
}

export async function claimStaffFulfillmentCaseAction(formData: FormData) {
  await transition(formData, "claim");
}

export async function requestStaffFulfillmentInformationAction(formData: FormData) {
  await transition(formData, "request_information");
}

export async function resumeStaffFulfillmentCaseAction(formData: FormData) {
  await transition(formData, "resume");
}
