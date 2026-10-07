import { and, eq } from "drizzle-orm";

import type { getDb } from "@/db";
import { manualTasks, publishers } from "@/db/schema";

type Db = ReturnType<typeof getDb>;

export type GoogleProfileLookup = {
  status: "found" | "not_found" | "error";
  matchedBy?: "website" | "name" | "autocomplete";
  searchedAs?: string;
  message?: string;
};

export type GoogleProfileIntakeState =
  | "connected"
  | "ready_to_connect"
  | "needs_confirmation"
  | "needs_discovery"
  | "needs_creation"
  | "needs_manual_match"
  | "lookup_blocked";

export type GoogleProfileIntakeFix = {
  checklistItemKey: `system:google-profile:${string}`;
  title: string;
  description: string;
  status: "open" | "blocked";
};

export type GoogleProfileIntake = {
  state: GoogleProfileIntakeState;
  fix: GoogleProfileIntakeFix | null;
};

/**
 * One decision point for every Google-profile onboarding case. The caller does
 * not need to understand search confidence, outages, or verification rules.
 */
export function resolveGoogleProfileIntake(input: {
  lookup?: GoogleProfileLookup | null;
  googleConnected?: boolean;
  customerSaysExists?: boolean;
}): GoogleProfileIntake {
  if (input.googleConnected) {
    return { state: "connected", fix: null };
  }

  const lookup = input.lookup ?? null;

  if (lookup?.status === "error") {
    return {
      state: "lookup_blocked",
      fix: {
        checklistItemKey: "system:google-profile:retry-lookup",
        title: "Retry Google profile discovery",
        description:
          "Google search was unavailable, so LocalMap did not assume the profile is missing. Retry discovery before creating anything.",
        status: "blocked",
      },
    };
  }

  if (lookup?.status === "found" && lookup.matchedBy === "name") {
    return {
      state: "needs_confirmation",
      fix: {
        checklistItemKey: "system:google-profile:confirm-match",
        title: "Confirm the Google profile match",
        description:
          "LocalMap found a likely profile by name. Confirm the address, phone, and website before importing or publishing changes.",
        status: "open",
      },
    };
  }

  if (lookup?.status === "found") {
    return {
      state: "ready_to_connect",
      fix: {
        checklistItemKey: "system:google-profile:connect",
        title: "Connect and verify your Google profile",
        description:
          "Authorize an owner or manager account. LocalMap will import the live profile, compare it with the Master Profile, and queue only approved differences.",
        status: "open",
      },
    };
  }

  if (lookup?.status === "not_found" && input.customerSaysExists) {
    return {
      state: "needs_manual_match",
      fix: {
        checklistItemKey: "system:google-profile:recover",
        title: "Recover the existing Google profile",
        description:
          "Search by exact name, address, phone, and website; then resolve ownership or duplicate listings before creating a new profile.",
        status: "open",
      },
    };
  }

  if (lookup?.status === "not_found") {
    return {
      state: "needs_creation",
      fix: {
        checklistItemKey: "system:google-profile:create",
        title: "Create or claim your Google Business Profile",
        description:
          "LocalMap can prepare the approved name, category, service area, hours, and description. Google still requires owner verification before the profile can go live.",
        status: "open",
      },
    };
  }

  return {
    state: "needs_discovery",
    fix: {
      checklistItemKey: "system:google-profile:discover",
      title: "Find your Google Business Profile",
      description:
        "LocalMap will search by business name, address, phone, and website before deciding whether to connect, recover, or create a profile.",
      status: "open",
    },
  };
}

/** Seed the one next Google-profile action into the shared Fix Queue. */
export async function seedGoogleProfileIntakeFix(input: {
  db: Db;
  locationId: string;
  lookup?: GoogleProfileLookup | null;
  googleConnected?: boolean;
  customerSaysExists?: boolean;
}): Promise<{ state: GoogleProfileIntakeState; seeded: boolean }> {
  const intake = resolveGoogleProfileIntake(input);
  if (!intake.fix) return { state: intake.state, seeded: false };

  const [googlePublisher] = await input.db
    .select({ id: publishers.id })
    .from(publishers)
    .where(eq(publishers.slug, "google-business-profile"))
    .limit(1);

  if (!googlePublisher) return { state: intake.state, seeded: false };

  const [existing] = await input.db
    .select({ id: manualTasks.id })
    .from(manualTasks)
    .where(
      and(
        eq(manualTasks.locationId, input.locationId),
        eq(manualTasks.checklistItemKey, intake.fix.checklistItemKey),
      ),
    )
    .limit(1);

  if (existing) return { state: intake.state, seeded: false };

  await input.db.insert(manualTasks).values({
    locationId: input.locationId,
    publisherId: googlePublisher.id,
    title: intake.fix.title,
    description: intake.fix.description,
    status: intake.fix.status,
    checklistItemKey: intake.fix.checklistItemKey,
  });

  return { state: intake.state, seeded: true };
}
