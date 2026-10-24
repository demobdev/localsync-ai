import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { canSeedSyntheticFulfillmentFixtures } from "./qa-fulfillment-fixtures.server";

const previewEnvironment = {
  VERCEL_ENV: "preview",
  VERCEL_GIT_COMMIT_REF: "codex/localsync-synup-mvp",
  LOCALMAP_STAFF_FULFILLMENT_ENABLED: "true",
  DATABASE_URL: "postgresql://qa:example@ep-green-hall-b7gjiyit.c-13.us-east-1.aws.neon.tech/localsync_fulfillment_qa?sslmode=require",
};

describe("synthetic fulfillment fixture environment guard", () => {
  it("allows only the named Preview branch and isolated QA database endpoint", () => {
    expect(canSeedSyntheticFulfillmentFixtures(previewEnvironment)).toBe(true);
  });

  it.each([
    { VERCEL_ENV: "production" },
    { VERCEL_GIT_COMMIT_REF: "main" },
    { LOCALMAP_STAFF_FULFILLMENT_ENABLED: "false" },
    { DATABASE_URL: "postgresql://qa:example@other.neon.tech/localsync_fulfillment_qa" },
    { DATABASE_URL: "postgresql://qa:example@ep-green-hall-b7gjiyit.c-13.us-east-1.aws.neon.tech/production" },
    { DATABASE_URL: "not-a-url" },
  ])("fails closed when a required isolation check differs", override => {
    expect(canSeedSyntheticFulfillmentFixtures({ ...previewEnvironment, ...override })).toBe(false);
  });
});
