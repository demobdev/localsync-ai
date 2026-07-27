import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

export type ConnectorCapability =
  | "connect"
  | "refresh_auth"
  | "list_authorized_locations"
  | "search_listings"
  | "get_listing"
  | "create_listing"
  | "update_listing"
  | "get_job_status"
  | "detect_duplicates"
  | "verify_listing";

export type ConnectionResult =
  | { ok: true; externalAccountId?: string }
  | { ok: false; code: string; message: string };

export type AuthResult =
  | { ok: true; expiresAt?: Date }
  | { ok: false; code: string; message: string };

export type PublisherLocation = {
  externalId: string;
  title: string;
  listingUrl?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  website?: string;
};

export type ListingCandidate = PublisherLocation & {
  confidence: number;
  signals?: Record<string, number>;
};

export type PublisherListing = PublisherLocation & {
  fields: Partial<LocationProfileSnapshot>;
  verificationState?: string;
};

export type PublisherFieldUpdate = {
  fieldKey: string;
  value: unknown;
};

export type PublisherJob = {
  externalJobId?: string;
  status:
    | "queued"
    | "sent"
    | "accepted"
    | "processing"
    | "live"
    | "rejected"
    | "failed";
  message?: string;
  updatedFields?: string[];
  raw?: Record<string, unknown>;
};

export type PublisherJobStatus = PublisherJob;

export type PublisherFieldDefinition = {
  fieldKey: string;
  label: string;
  required: boolean;
  writable: boolean;
};

/**
 * Shared contract for publisher connectors.
 * Google is the first reference implementation — do not embed
 * publisher-specific behavior in core location services.
 */
export interface PublisherConnector {
  readonly publisherSlug: string;
  readonly capabilities: readonly ConnectorCapability[];

  getSupportedFields(): Promise<PublisherFieldDefinition[]>;

  connectAccount?(input: {
    organizationId: string;
  }): Promise<ConnectionResult>;

  refreshAuthentication?(input: {
    organizationId: string;
  }): Promise<AuthResult>;

  listAuthorizedLocations?(input: {
    organizationId: string;
  }): Promise<PublisherLocation[]>;

  searchListings?(input: {
    organizationId: string;
    location: LocationProfileSnapshot;
  }): Promise<ListingCandidate[]>;

  getListing?(input: {
    organizationId: string;
    listingId: string;
  }): Promise<PublisherListing>;

  updateListing?(input: {
    organizationId: string;
    listingId: string;
    profile: LocationProfileSnapshot;
    changes: PublisherFieldUpdate[];
  }): Promise<PublisherJob>;

  getJobStatus?(input: {
    organizationId: string;
    jobId: string;
  }): Promise<PublisherJobStatus>;

  verifyListing?(input: {
    organizationId: string;
    listingId: string;
    profile: LocationProfileSnapshot;
    fieldKeys: string[];
  }): Promise<{
    verified: boolean;
    matchedFields: string[];
    mismatchedFields: Array<{
      fieldKey: string;
      expected: string;
      actual: string;
    }>;
  }>;
}
