import { afterEach, describe, expect, it, vi } from "vitest";
import { readGooglePages } from "./google-read";
afterEach(() => vi.unstubAllGlobals());
describe("Google paginated reads", () => {
  it("fetches all pages without persistent cache", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          accounts: [{ name: "accounts/1" }],
          nextPageToken: "next+/=",
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ accounts: [{ name: "accounts/2" }] }),
      );
    vi.stubGlobal("fetch", fetch);
    const result = await readGooglePages(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      "accounts",
      "test-token",
    );
    expect(result).toEqual({
      ok: true,
      items: [{ name: "accounts/1" }, { name: "accounts/2" }],
    });
    expect(new URL(fetch.mock.calls[1][0]).searchParams.get("pageToken")).toBe(
      "next+/=",
    );
    expect(fetch.mock.calls[0][1].cache).toBe("no-store");
  });
  it("does not return partial success after a later-page error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ accounts: [{}], nextPageToken: "next" }),
        )
        .mockResolvedValueOnce(new Response("", { status: 429 })),
    );
    expect(
      await readGooglePages(
        "https://example.test/accounts",
        "accounts",
        "test-token",
      ),
    ).toMatchObject({ ok: false, error: { code: "quota_exceeded" } });
  });
  it.each([null, [], { accounts: "bad" }, { nextPageToken: 42 }])(
    "rejects malformed payload %j",
    async (payload) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(payload)));
      expect(
        (
          await readGooglePages(
            "https://example.test/accounts",
            "accounts",
            "test-token",
          )
        ).ok,
      ).toBe(false);
    },
  );
  it("stops repeated tokens", async () => {
    const fetch = vi
      .fn()
      .mockImplementation(async () =>
        Response.json({ accounts: [], nextPageToken: "same" }),
      );
    vi.stubGlobal("fetch", fetch);
    expect(
      (
        await readGooglePages(
          "https://example.test/accounts",
          "accounts",
          "test-token",
        )
      ).ok,
    ).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("reports network failures without exposing error details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("secret upstream details")),
    );
    const result = await readGooglePages(
      "https://example.test/accounts",
      "accounts",
      "test-token",
    );
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("secret");
  });
});
