import { describe, expect, it, vi } from "vitest";

import { shouldUseLocalInngestDevServer } from "./client";
import { dispatchBackgroundJob } from "./dispatch";

describe("shouldUseLocalInngestDevServer", () => {
  it("uses the local worker in Next.js development only", () => {
    expect(shouldUseLocalInngestDevServer("development")).toBe(true);
    expect(shouldUseLocalInngestDevServer("production")).toBe(false);
    expect(shouldUseLocalInngestDevServer("test")).toBe(false);
  });
});

describe("dispatchBackgroundJob", () => {
  it("runs the job inline when Inngest rejects the event", async () => {
    const send = vi
      .fn()
      .mockRejectedValue(new Error("Inngest API Error: 400 Branch environment name is required"));
    const runInline = vi.fn().mockResolvedValue(undefined);

    await expect(
      dispatchBackgroundJob({ send, runInline }),
    ).resolves.toBe("inline");

    expect(send).toHaveBeenCalledOnce();
    expect(runInline).toHaveBeenCalledOnce();
  });

  it("leaves execution to Inngest when the event is accepted", async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const runInline = vi.fn().mockResolvedValue(undefined);

    await expect(
      dispatchBackgroundJob({ send, runInline }),
    ).resolves.toBe("queued");

    expect(send).toHaveBeenCalledOnce();
    expect(runInline).not.toHaveBeenCalled();
  });
});
