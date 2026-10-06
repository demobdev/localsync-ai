import { afterEach, describe, expect, it, vi } from "vitest";
import { patchGbpLocationSafe } from "./google-write";
import { EMPTY_LOCATION_PROFILE } from "@/lib/types/location-profile";
afterEach(() => vi.unstubAllGlobals());

describe("v1 write resource compatibility", () => {
  it.each(["locations/456", "accounts/123/locations/456"])(
    "normalizes %s to the v1 location endpoint",
    async (resource) => {
      const fetchMock = vi.fn().mockResolvedValue(Response.json({}));
      vi.stubGlobal("fetch", fetchMock);
      const result = await patchGbpLocationSafe(
        "test-token",
        resource,
        { ...EMPTY_LOCATION_PROFILE, name: "Owner's Box" },
        ["name"],
        { validateOnly: true },
      );
      expect(result.ok).toBe(true);
      expect(fetchMock.mock.calls[0][0]).toBe(
        "https://mybusinessbusinessinformation.googleapis.com/v1/locations/456?updateMask=title&validateOnly=true",
      );
    },
  );
  it("rejects invalid resources without a request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(
      (
        await patchGbpLocationSafe(
          "test-token",
          "locations/456?other=1",
          { ...EMPTY_LOCATION_PROFILE, name: "Owner's Box" },
          ["name"],
        )
      ).ok,
    ).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
