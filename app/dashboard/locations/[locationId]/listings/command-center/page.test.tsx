import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import Page from "./page";

beforeEach(() => redirectMock.mockReset());

describe("legacy listings command-center route", () => {
  it("routes the legacy URL to the location Listings baseline", async () => {
    await Page({ params: Promise.resolve({ locationId: "location-one" }) });

    expect(redirectMock).toHaveBeenCalledExactlyOnceWith(
      "/dashboard/locations/location-one/listings",
    );
  });

  it("encodes the location id before building the destination", async () => {
    await Page({ params: Promise.resolve({ locationId: "org/a b" }) });

    expect(redirectMock).toHaveBeenCalledExactlyOnceWith(
      "/dashboard/locations/org%2Fa%20b/listings",
    );
  });
});
