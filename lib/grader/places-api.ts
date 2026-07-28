export type GooglePlacesErrorCode =
  | "configuration"
  | "rate_limited"
  | "invalid_request"
  | "unavailable";

type GoogleErrorPayload = {
  error?: {
    code?: number;
    status?: string;
    message?: string;
  };
};

export class GooglePlacesRequestError extends Error {
  readonly code: GooglePlacesErrorCode;
  readonly status: number;
  readonly userMessage: string;

  constructor(input: {
    code: GooglePlacesErrorCode;
    status: number;
    message: string;
    userMessage: string;
  }) {
    super(input.message);
    this.name = "GooglePlacesRequestError";
    this.code = input.code;
    this.status = input.status;
    this.userMessage = input.userMessage;
  }
}

function classifyGooglePlacesFailure(
  status: number,
  payload: GoogleErrorPayload,
): GooglePlacesRequestError {
  const upstreamMessage = payload.error?.message?.trim() || "Google Places request failed";
  const upstreamStatus = payload.error?.status ?? "";
  const searchable = `${upstreamStatus} ${upstreamMessage}`;

  if (
    status === 403 ||
    /PERMISSION_DENIED|referer|API key|blocked|forbidden/i.test(searchable)
  ) {
    return new GooglePlacesRequestError({
      code: "configuration",
      status,
      message: upstreamMessage,
      userMessage:
        "Business search is temporarily unavailable because this site origin is not allowed by Google Places.",
    });
  }

  if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(searchable)) {
    return new GooglePlacesRequestError({
      code: "rate_limited",
      status,
      message: upstreamMessage,
      userMessage:
        "Business search is temporarily busy. Wait a moment, then try again.",
    });
  }

  if (status === 400 || /INVALID_ARGUMENT/i.test(searchable)) {
    return new GooglePlacesRequestError({
      code: "invalid_request",
      status,
      message: upstreamMessage,
      userMessage:
        "Google could not understand that search. Try the exact business name plus city or ZIP code.",
    });
  }

  return new GooglePlacesRequestError({
    code: "unavailable",
    status,
    message: upstreamMessage,
    userMessage:
      "Google Places is temporarily unavailable. Your business has not been marked as missing—please try again.",
  });
}

export async function parseGooglePlacesResponse<T = unknown>(
  response: Response,
): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T &
    GoogleErrorPayload;

  if (!response.ok) {
    throw classifyGooglePlacesFailure(response.status, payload);
  }

  return payload;
}

export function googlePlacesUserMessage(error: unknown): string {
  return error instanceof GooglePlacesRequestError
    ? error.userMessage
    : "Google Places is temporarily unavailable. Your business has not been marked as missing—please try again.";
}
