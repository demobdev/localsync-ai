import { classifyGbpFetchError, type GbpFetchErrorCode } from "./google";

export type GbpVerificationAction =
  | "none"
  | "wait_for_review"
  | "verify"
  | "resolve_ownership_conflict"
  | "comply_with_guidelines";

export type GbpVerificationStatus =
  | "verified"
  | "pending_review"
  | "needs_verification"
  | "ownership_conflict"
  | "guidelines_issue"
  | "limited_authority"
  | "unknown";

export type GbpVoiceOfMerchantState = {
  hasVoiceOfMerchant: boolean;
  hasBusinessAuthority: boolean;
  action: GbpVerificationAction;
};

export type FetchVoiceOfMerchantResult =
  | { ok: true; state: GbpVoiceOfMerchantState }
  | {
      ok: false;
      error: { code: GbpFetchErrorCode; message: string };
    };

type VoiceOfMerchantPayload = {
  hasVoiceOfMerchant?: boolean;
  hasBusinessAuthority?: boolean;
  waitForVoiceOfMerchant?: Record<string, unknown>;
  verify?: Record<string, unknown>;
  resolveOwnershipConflict?: Record<string, unknown>;
  complyWithGuidelines?: Record<string, unknown>;
};

export function resolveGbpVerificationAction(
  payload: VoiceOfMerchantPayload,
): GbpVerificationAction {
  if (payload.waitForVoiceOfMerchant) {
    return "wait_for_review";
  }
  if (payload.verify) {
    return "verify";
  }
  if (payload.resolveOwnershipConflict) {
    return "resolve_ownership_conflict";
  }
  if (payload.complyWithGuidelines) {
    return "comply_with_guidelines";
  }
  return "none";
}

export function resolveGbpVerificationStatus(
  state: GbpVoiceOfMerchantState,
): GbpVerificationStatus {
  if (state.hasVoiceOfMerchant && state.hasBusinessAuthority) {
    return "verified";
  }

  switch (state.action) {
    case "wait_for_review":
      return "pending_review";
    case "verify":
      return "needs_verification";
    case "resolve_ownership_conflict":
      return "ownership_conflict";
    case "comply_with_guidelines":
      return "guidelines_issue";
    default:
      if (state.hasBusinessAuthority && !state.hasVoiceOfMerchant) {
        return "limited_authority";
      }
      return "unknown";
  }
}

export function getGbpVerificationLabel(status: GbpVerificationStatus): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "pending_review":
      return "Under review";
    case "needs_verification":
      return "Needs verification";
    case "ownership_conflict":
      return "Ownership conflict";
    case "guidelines_issue":
      return "Guidelines issue";
    case "limited_authority":
      return "Limited authority";
    default:
      return "Status unknown";
  }
}

export async function fetchVoiceOfMerchantStateSafe(
  accessToken: string,
  gbpName: string,
): Promise<FetchVoiceOfMerchantResult> {
  const response = await fetch(
    `https://mybusinessverifications.googleapis.com/v1/${gbpName}/VoiceOfMerchantState`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) {
    const body = await response.text();
    return {
      ok: false,
      error: classifyGbpFetchError(body),
    };
  }

  const payload = (await response.json()) as VoiceOfMerchantPayload;

  const state: GbpVoiceOfMerchantState = {
    hasVoiceOfMerchant: Boolean(payload.hasVoiceOfMerchant),
    hasBusinessAuthority: Boolean(payload.hasBusinessAuthority),
    action: resolveGbpVerificationAction(payload),
  };

  return { ok: true, state };
}
