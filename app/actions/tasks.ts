"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import { locations, manualTasks, publishers } from "@/db/schema";
import { requireOrgAuth } from "@/lib/auth/org";

async function getOrgLocationIds(orgId: string) {
  const db = getDb();
  const rows = await db
    .select({ id: locations.id })
    .from(locations)
    .where(eq(locations.organizationId, orgId));

  return rows.map((row) => row.id);
}

async function assertLocationInOrg(locationId: string, orgId: string) {
  const db = getDb();
  const [location] = await db
    .select()
    .from(locations)
    .where(
      and(eq(locations.id, locationId), eq(locations.organizationId, orgId)),
    )
    .limit(1);

  if (!location) {
    throw new Error("Location not found");
  }

  return location;
}

export async function listTasksAction() {
  const { orgId } = await requireOrgAuth();
  const db = getDb();

  const locationIds = await getOrgLocationIds(orgId);

  if (locationIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: manualTasks.id,
      locationId: manualTasks.locationId,
      locationName: locations.name,
      publisherId: manualTasks.publisherId,
      publisherName: publishers.name,
      title: manualTasks.title,
      description: manualTasks.description,
      status: manualTasks.status,
      checklistItemKey: manualTasks.checklistItemKey,
      dueAt: manualTasks.dueAt,
      completedAt: manualTasks.completedAt,
      createdAt: manualTasks.createdAt,
    })
    .from(manualTasks)
    .innerJoin(locations, eq(locations.id, manualTasks.locationId))
    .innerJoin(publishers, eq(publishers.id, manualTasks.publisherId))
    .where(inArray(manualTasks.locationId, locationIds))
    .orderBy(desc(manualTasks.createdAt));
}

export async function createTaskAction(input: {
  locationId: string;
  publisherId: string;
  title: string;
  description?: string;
}) {
  const { orgId } = await requireOrgAuth();
  await assertLocationInOrg(input.locationId, orgId);
  const db = getDb();

  const [task] = await db
    .insert(manualTasks)
    .values({
      locationId: input.locationId,
      publisherId: input.publisherId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: "open",
    })
    .returning();

  revalidatePath("/dashboard/tasks");
  return task;
}

export async function createChecklistTasksAction(input: {
  locationId: string;
  publisherId: string;
}) {
  const { orgId } = await requireOrgAuth();
  await assertLocationInOrg(input.locationId, orgId);
  const db = getDb();

  const [publisher] = await db
    .select()
    .from(publishers)
    .where(eq(publishers.id, input.publisherId))
    .limit(1);

  if (!publisher) {
    throw new Error("Publisher not found");
  }

  const checklistItems = (publisher.checklistMarkdown ?? "")
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  const items = checklistItems.length
    ? checklistItems
    : [`Claim or update the ${publisher.name} listing`, "Verify NAP matches master profile"];

  const created = await db
    .insert(manualTasks)
    .values(
      items.map((item, index) => ({
        locationId: input.locationId,
        publisherId: input.publisherId,
        title: item,
        status: "open" as const,
        checklistItemKey: `${publisher.slug}-${index}`,
      })),
    )
    .returning();

  revalidatePath("/dashboard/tasks");
  return created;
}

export async function updateTaskStatusAction(input: {
  taskId: string;
  status: "open" | "in_progress" | "done" | "blocked";
}) {
  const { orgId } = await requireOrgAuth();
  const db = getDb();

  const locationIds = await getOrgLocationIds(orgId);

  if (locationIds.length === 0) {
    throw new Error("Task not found");
  }

  await db
    .update(manualTasks)
    .set({
      status: input.status,
      completedAt: input.status === "done" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(manualTasks.id, input.taskId),
        inArray(manualTasks.locationId, locationIds),
      ),
    );

  revalidatePath("/dashboard/tasks");
}
