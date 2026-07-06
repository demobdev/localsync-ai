import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { organizations } from "@/db/schema";

export type OrganizationType = "business" | "agency";

export async function upsertOrganization(input: {
  id: string;
  name: string;
  slug?: string | null;
  imageUrl?: string | null;
  type?: OrganizationType;
}) {
  const db = getDb();
  const now = new Date();

  await db
    .insert(organizations)
    .values({
      id: input.id,
      name: input.name,
      slug: input.slug ?? null,
      imageUrl: input.imageUrl ?? null,
      type: input.type ?? "business",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: organizations.id,
      set: {
        name: input.name,
        slug: input.slug ?? null,
        imageUrl: input.imageUrl ?? null,
        ...(input.type !== undefined ? { type: input.type } : {}),
        updatedAt: now,
      },
    });
}

export async function deleteOrganization(id: string) {
  const db = getDb();
  await db.delete(organizations).where(eq(organizations.id, id));
}

export async function getOrganization(id: string) {
  const db = getDb();
  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);

  return organization ?? null;
}
