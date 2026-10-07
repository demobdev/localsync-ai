export type GbpFetchErrorCode =
  | "quota_exceeded"
  | "api_disabled"
  | "permission_denied"
  | "unauthenticated"
  | "not_found"
  | "unknown";

/** HTTP status and structured Google reasons are evidence; approval is not inferred. */
export function classifyGbpFetchError(
  error: unknown,
  httpStatus?: number,
): {
  code: GbpFetchErrorCode;
  message: string;
} {
  const raw =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : "";
  let payload: {
    error?: {
      code?: number;
      status?: string;
      details?: Array<{ reason?: string }>;
    };
  } = {};
  try {
    payload = JSON.parse(raw);
  } catch {
    /* Some gateways return plain text. */
  }
  const status = httpStatus ?? payload?.error?.code;
  const details = payload?.error?.details;
  const reasons = Array.isArray(details)
    ? details.map((detail) => detail?.reason)
    : [];
  if (
    reasons.includes("SERVICE_DISABLED") ||
    /SERVICE_DISABLED|accessNotConfigured/i.test(raw)
  ) {
    return {
      code: "api_disabled",
      message:
        "A required Google Business Profile API is disabled for the calling project. Check API enablement and that the OAuth client belongs to the approved project. Access approval and API activation are separate steps.",
    };
  }
  if (
    status === 429 ||
    payload?.error?.status === "RESOURCE_EXHAUSTED" ||
    /quota exceeded|RESOURCE_EXHAUSTED|rateLimitExceeded|userRateLimitExceeded/i.test(
      raw,
    )
  ) {
    return {
      code: "quota_exceeded",
      message:
        "Google's API quota or rate limit was reached. Retry later with backoff and check the calling project's quota and usage. This error alone does not mean API access is unapproved. If the project is already approved, do not submit another Basic API Access application; verify the OAuth project and effective quota.",
    };
  }
  if (status === 401 || payload?.error?.status === "UNAUTHENTICATED") {
    return {
      code: "unauthenticated",
      message:
        "Google could not authenticate this connection. Check whether the authorization expired or was revoked; reconnect if needed.",
    };
  }
  if (
    status === 403 ||
    payload?.error?.status === "PERMISSION_DENIED" ||
    /PERMISSION_DENIED/i.test(raw)
  ) {
    return {
      code: "permission_denied",
      message:
        "Google denied this request. Check the account's listing role, granted OAuth scope, calling project's access and API settings, and whether Business Profile is enabled by your Workspace administrator. A 403 alone does not identify which permission is missing.",
    };
  }
  if (status === 404 || payload?.error?.status === "NOT_FOUND") {
    return {
      code: "not_found",
      message:
        "Google could not find the requested resource. Check the account/location ID and API endpoint. A 404 does not establish whether the project is approved.",
    };
  }
  return {
    code: "unknown",
    message:
      "Could not load Google Business Profile data. Check the connection and try again. If it continues, inspect the Google API response securely.",
  };
}
