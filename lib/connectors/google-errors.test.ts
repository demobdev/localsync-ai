import { describe, expect, it } from "vitest";
import { classifyGbpFetchError } from "./google-errors";

describe("Google API error classification", () => {
  it.each([
    [
      JSON.stringify({ error: { code: 429, status: "RESOURCE_EXHAUSTED" } }),
      undefined,
    ],
    ["Quota exceeded", undefined],
    ["upstream error", 429],
    [
      JSON.stringify({
        error: { code: 403, errors: [{ reason: "rateLimitExceeded" }] },
      }),
      undefined,
    ],
  ])("does not infer pending approval from quota errors", (body, status) => {
    const result = classifyGbpFetchError(body, status as number | undefined);
    expect(result.code).toBe("quota_exceeded");
    expect(result.message).toContain("does not mean API access is unapproved");
    expect(result.message).not.toContain("wait for approval");
  });
  it("identifies a disabled service separately from general permission denial", () => {
    expect(
      classifyGbpFetchError(
        JSON.stringify({
          error: {
            code: 403,
            status: "PERMISSION_DENIED",
            details: [{ reason: "SERVICE_DISABLED" }],
          },
        }),
      ).code,
    ).toBe("api_disabled");
  });
  it("does not claim a 403 means missing listing ownership", () => {
    const error = classifyGbpFetchError("", 403);
    expect(error.code).toBe("permission_denied");
    expect(error.message).toContain("Workspace");
  });
  it("does not claim a 404 means missing approval", () => {
    expect(classifyGbpFetchError("", 404).code).toBe("not_found");
  });
  it("distinguishes authentication", () => {
    expect(classifyGbpFetchError("", 401).code).toBe("unauthenticated");
  });
  it.each(["null", "{}", '{"error":{"details":"unexpected"}}'])(
    "handles malformed response shape %s",
    (body) => {
      expect(classifyGbpFetchError(body, 503).code).toBe("unknown");
    },
  );
  it("does not echo arbitrary upstream bodies", () => {
    expect(
      classifyGbpFetchError("private upstream data", 500).message,
    ).not.toContain("private upstream data");
  });
});
