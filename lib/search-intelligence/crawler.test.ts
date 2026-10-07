import { describe, expect, it } from "vitest";

import { isPrivateIp } from "./crawler";

describe("isPrivateIp", () => {
  it("blocks private and loopback addresses", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("10.0.0.1")).toBe(true);
    expect(isPrivateIp("192.168.1.4")).toBe(true);
    expect(isPrivateIp("::1")).toBe(true);
  });

  it("allows a public address", () => {
    expect(isPrivateIp("8.8.8.8")).toBe(false);
  });
});

