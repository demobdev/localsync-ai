import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ replace: vi.fn(), success: vi.fn(), params: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => mocks.params,
}));
vi.mock("sonner", () => ({ toast: { success: mocks.success } }));
import { GoogleImportToast } from "./google-import-toast";

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function render(query = "", hash = "") {
  window.history.replaceState(null, "", `/dashboard/connect/google${query}${hash}`);
  mocks.params = new URLSearchParams(query);
  await act(async () => root.render(<StrictMode><GoogleImportToast /></StrictMode>));
}

describe("Google connection success feedback", () => {
  it("confirms the callback once and removes only its marker without scrolling", async () => {
    await render("?connected=1&return=business", "#import");
    expect(mocks.success).toHaveBeenCalledExactlyOnceWith("Google account connected", expect.any(Object));
    expect(mocks.replace).toHaveBeenCalledExactlyOnceWith("/dashboard/connect/google?return=business#import", { scroll: false });
    await render("?connected=1&return=business", "#import");
    expect(mocks.success).toHaveBeenCalledTimes(1);
  });
  it("does not show success on ordinary or failed connections", async () => {
    await render();
    await render("?error=access_denied");
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
  it("never lets a success marker override a callback error", async () => {
    await render("?connected=1&error=exchange_failed");
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith("/dashboard/connect/google?error=exchange_failed", { scroll: false });
  });
  it("can acknowledge a later successful attempt after the marker was cleared", async () => {
    await render("?connected=1");
    await render();
    await render("?connected=1");
    expect(mocks.success).toHaveBeenCalledTimes(2);
  });
});
