import {
  classifyGbpFetchError,
  type GbpFetchErrorCode,
  type GbpFieldKey,
} from "./google";
import type { LocationProfileSnapshot, RegularHours } from "@/lib/types/location-profile";

export type GbpWriteFieldKey = GbpFieldKey;

export type PatchGbpLocationResult =
  | { ok: true; updatedFields: GbpWriteFieldKey[] }
  | {
      ok: false;
      error: { code: GbpFetchErrorCode; message: string };
    };

const DAY_TO_GBP: Record<keyof RegularHours, string> = {
  monday: "MONDAY",
  tuesday: "TUESDAY",
  wednesday: "WEDNESDAY",
  thursday: "THURSDAY",
  friday: "FRIDAY",
  saturday: "SATURDAY",
  sunday: "SUNDAY",
};

function parseTimeParts(value: string): { hours: number; minutes: number } {
  const [hoursRaw, minutesRaw] = value.split(":");
  return {
    hours: Number(hoursRaw ?? 0),
    minutes: Number(minutesRaw ?? 0),
  };
}

function buildRegularHoursPayload(hours: RegularHours) {
  const periods = Object.entries(hours).flatMap(([day, value]) => {
    if (!value || value.closed) {
      return [];
    }

    const gbpDay = DAY_TO_GBP[day as keyof RegularHours];
    if (!gbpDay) {
      return [];
    }

    return [
      {
        openDay: gbpDay,
        openTime: parseTimeParts(value.open),
        closeDay: gbpDay,
        closeTime: parseTimeParts(value.close),
      },
    ];
  });

  return { periods };
}

export function buildGbpPatchPayload(
  profile: LocationProfileSnapshot,
  fields: GbpWriteFieldKey[],
): { body: Record<string, unknown>; updateMask: string[] } {
  const body: Record<string, unknown> = {};
  const updateMask: string[] = [];

  for (const field of fields) {
    switch (field) {
      case "name":
        body.title = profile.name;
        updateMask.push("title");
        break;
      case "phone":
        if (profile.phone) {
          body.phoneNumbers = { primaryPhone: profile.phone };
          updateMask.push("phoneNumbers.primaryPhone");
        }
        break;
      case "website":
        if (profile.website) {
          body.websiteUri = profile.website;
          updateMask.push("websiteUri");
        }
        break;
      case "addressLine1":
      case "city":
      case "state":
      case "postalCode": {
        body.storefrontAddress = {
          ...(typeof body.storefrontAddress === "object" && body.storefrontAddress
            ? (body.storefrontAddress as Record<string, unknown>)
            : {}),
          ...(field === "addressLine1" && profile.addressLine1
            ? { addressLines: [profile.addressLine1] }
            : {}),
          ...(field === "city" && profile.city ? { locality: profile.city } : {}),
          ...(field === "state" && profile.state
            ? { administrativeArea: profile.state }
            : {}),
          ...(field === "postalCode" && profile.postalCode
            ? { postalCode: profile.postalCode }
            : {}),
        };
        if (field === "addressLine1" && profile.addressLine1) {
          updateMask.push("storefrontAddress.addressLines");
        }
        if (field === "city" && profile.city) {
          updateMask.push("storefrontAddress.locality");
        }
        if (field === "state" && profile.state) {
          updateMask.push("storefrontAddress.administrativeArea");
        }
        if (field === "postalCode" && profile.postalCode) {
          updateMask.push("storefrontAddress.postalCode");
        }
        break;
      }
      case "regularHours":
        body.regularHours = buildRegularHoursPayload(profile.regularHours);
        updateMask.push("regularHours");
        break;
    }
  }

  return { body, updateMask: [...new Set(updateMask)] };
}

export async function patchGbpLocationSafe(
  accessToken: string,
  gbpName: string,
  profile: LocationProfileSnapshot,
  fields: GbpWriteFieldKey[],
  options?: { validateOnly?: boolean },
): Promise<PatchGbpLocationResult> {
  if (fields.length === 0) {
    return {
      ok: false,
      error: { code: "unknown", message: "Select at least one field to push." },
    };
  }

  const { body, updateMask } = buildGbpPatchPayload(profile, fields);

  if (updateMask.length === 0) {
    return {
      ok: false,
      error: {
        code: "unknown",
        message: "Selected fields are empty in the master profile.",
      },
    };
  }

  const params = new URLSearchParams({
    updateMask: updateMask.join(","),
  });

  if (options?.validateOnly) {
    params.set("validateOnly", "true");
  }

  const response = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${gbpName}?${params.toString()}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    return {
      ok: false,
      error: classifyGbpFetchError(errorBody),
    };
  }

  return {
    ok: true,
    updatedFields: fields.filter((field) => {
      if (field === "addressLine1") return Boolean(profile.addressLine1);
      if (field === "city") return Boolean(profile.city);
      if (field === "state") return Boolean(profile.state);
      if (field === "postalCode") return Boolean(profile.postalCode);
      if (field === "phone") return Boolean(profile.phone);
      if (field === "website") return Boolean(profile.website);
      if (field === "name") return Boolean(profile.name);
      if (field === "regularHours") {
        return Object.keys(profile.regularHours).length > 0;
      }
      return false;
    }),
  };
}
