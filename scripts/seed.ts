import { config } from "dotenv";
import { eq } from "drizzle-orm";

import { getDb } from "../db";
import {
  businessCategories,
  enablePgVector,
  publisherRequiredFields,
  publishers,
  serviceTaxonomy,
} from "../db/schema";
import { PUBLISHER_SEEDS } from "../db/seed/publishers";
import {
  TAXONOMY_CATEGORIES,
  TAXONOMY_SERVICES,
} from "../db/seed/taxonomy";

config({ path: ".env.local" });

async function seedTaxonomy(db: ReturnType<typeof getDb>) {
  for (const category of TAXONOMY_CATEGORIES) {
    await db
      .insert(businessCategories)
      .values(category)
      .onConflictDoUpdate({
        target: businessCategories.slug,
        set: {
          name: category.name,
          vertical: category.vertical,
          schemaOrgType: category.schemaOrgType,
          description: category.description,
          sortOrder: category.sortOrder,
        },
      });
  }

  for (const service of TAXONOMY_SERVICES) {
    await db
      .insert(serviceTaxonomy)
      .values(service)
      .onConflictDoUpdate({
        target: serviceTaxonomy.slug,
        set: {
          categorySlug: service.categorySlug,
          name: service.name,
          description: service.description,
          sortOrder: service.sortOrder,
        },
      });
  }
}

async function seedPublishers(db: ReturnType<typeof getDb>) {
  for (const publisher of PUBLISHER_SEEDS) {
    const [row] = await db
      .insert(publishers)
      .values({
        slug: publisher.slug,
        name: publisher.name,
        rail: publisher.rail,
        websiteUrl: publisher.websiteUrl,
        description: publisher.description,
        isCore: publisher.isCore,
        isHomeServices: publisher.isHomeServices,
        checklistMarkdown: publisher.checklistMarkdown,
        sortOrder: publisher.sortOrder,
      })
      .onConflictDoUpdate({
        target: publishers.slug,
        set: {
          name: publisher.name,
          rail: publisher.rail,
          websiteUrl: publisher.websiteUrl,
          description: publisher.description,
          isCore: publisher.isCore,
          isHomeServices: publisher.isHomeServices,
          checklistMarkdown: publisher.checklistMarkdown,
          sortOrder: publisher.sortOrder,
        },
      })
      .returning({ id: publishers.id });

    const publisherId =
      row?.id ??
      (
        await db
          .select({ id: publishers.id })
          .from(publishers)
          .where(eq(publishers.slug, publisher.slug))
          .limit(1)
      )[0]?.id;

    if (!publisherId) {
      continue;
    }

    await db
      .delete(publisherRequiredFields)
      .where(eq(publisherRequiredFields.publisherId, publisherId));

    for (const field of publisher.requiredFields) {
      await db.insert(publisherRequiredFields).values({
        publisherId,
        fieldKey: field.fieldKey,
        label: field.label,
        isRequired: field.isRequired ?? true,
        description: field.description,
        sortOrder: field.sortOrder,
      });
    }
  }
}

async function main() {
  const db = getDb();

  console.log("Enabling pgvector extension...");
  await db.execute(enablePgVector);

  console.log("Seeding taxonomy...");
  await seedTaxonomy(db);

  console.log("Seeding publishers...");
  await seedPublishers(db);

  console.log("Seed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
