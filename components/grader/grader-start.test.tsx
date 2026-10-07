import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/actions/grader", () => ({ startGraderAuditAction: vi.fn() }));
vi.mock("@/components/grader/business-not-found-help", () => ({
  BusinessNotFoundHelp: () => <div>Business search help</div>,
}));

let GraderStart: typeof import("./grader-start").GraderStart;
let container: HTMLDivElement;
let root: Root;
let reportPosition: PositionCallback;
const geolocationDescriptor = Object.getOwnPropertyDescriptor(navigator, "geolocation");
const fetchMock = vi.fn<typeof fetch>();

function response(payload: object, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function predictions(name: string) {
  return {
    suggestions: [{
      placePrediction: {
        placeId: "place-1",
        structuredFormat: { mainText: { text: name }, secondaryText: { text: "Test city" } },
      },
    }],
  };
}

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_KEY", "test-key");
  ({ GraderStart } = await import("./grader-start"));
  vi.unstubAllEnvs();
});

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(response({ suggestions: [] }));
  vi.stubGlobal("fetch", fetchMock);
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition: (success: PositionCallback) => { reportPosition = success; } },
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<GraderStart />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (geolocationDescriptor) {
    Object.defineProperty(navigator, "geolocation", geolocationDescriptor);
  } else {
    Reflect.deleteProperty(navigator, "geolocation");
  }
});

async function type(value: string) {
  const input = container.querySelector("input")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function advance(ms: number) {
  await act(async () => vi.advanceTimersByTimeAsync(ms));
}

function loading() {
  return Boolean(container.querySelector(".animate-spin"));
}

describe("GraderStart search lifecycle", () => {
  it("shows loading immediately and debounces name search by 280 ms", async () => {
    fetchMock.mockImplementation(async () => response(predictions("Acme")));
    await type("Acme");
    expect(loading()).toBe(true);
    await advance(279);
    expect(fetchMock).not.toHaveBeenCalled();
    await advance(1);
    expect(fetchMock).toHaveBeenCalled();
    expect(container.querySelector("ul")?.textContent).toContain("Acme");
    expect(loading()).toBe(false);
  });

  it("restarts the current search with a late geolocation result", async () => {
    fetchMock.mockImplementation(async () => response(predictions("Acme")));
    await type("Acme");
    await advance(280);
    expect(loading()).toBe(false);
    fetchMock.mockClear();
    await act(async () => reportPosition({
      coords: { latitude: 12, longitude: 34 },
    } as GeolocationPosition));
    expect(loading()).toBe(true);
    await advance(280);
    expect(JSON.parse(fetchMock.mock.calls[0]![1]!.body as string)).toMatchObject({
      input: "Acme",
      locationBias: { circle: { center: { latitude: 12, longitude: 34 } } },
    });
    expect(loading()).toBe(false);
  });

  it("cancels a pending debounce when the query becomes too short", async () => {
    await type("Acme");
    await advance(100);
    await type("A");
    expect(loading()).toBe(false);
    await advance(500);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.querySelector("ul")).toBeNull();
  });

  it("ignores a name response after switching to a URL and preserves the 450 ms URL debounce", async () => {
    let resolveOld!: (value: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
    fetchMock.mockImplementation(async () => response(predictions("Acme")));
    await type("Acme");
    await advance(280);
    await type("example.com");
    await act(async () => resolveOld(response(predictions("Acme"))));
    expect(container.querySelector("ul")).toBeNull();
    expect(loading()).toBe(true);
    const nameCalls = fetchMock.mock.calls.length;
    await advance(449);
    expect(fetchMock).toHaveBeenCalledTimes(nameCalls);
    await advance(1);
    expect(fetchMock.mock.calls.slice(nameCalls).some(([url]) => String(url).includes("searchText"))).toBe(true);
  });

  it("ignores a resolved URL after the input is cleared", async () => {
    let resolveOld!: (value: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
    fetchMock.mockImplementation(async () => response({ displayName: { text: "Old business" } }));
    await type("example.com");
    await advance(450);
    await type("");
    await act(async () => resolveOld(response({ places: [{ id: "place-1", websiteUri: "https://example.com" }] })));
    expect(container.textContent).not.toContain("Old business");
    expect(container.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    expect(loading()).toBe(false);
  });

  it("restarts loading immediately when retrying a failed search", async () => {
    fetchMock.mockImplementation(async () => response({ error: { status: "RESOURCE_EXHAUSTED", message: "Quota exceeded" } }, 429));
    await type("Acme");
    await advance(280);
    expect(container.textContent).toContain("Google search needs attention");
    expect(loading()).toBe(false);
    const retry = [...container.querySelectorAll("button")].find((button) => button.textContent === "Retry Google search")!;
    fetchMock.mockImplementation(async () => response(predictions("Acme")));
    await act(async () => retry.click());
    expect(loading()).toBe(true);
    expect(container.textContent).not.toContain("Google search needs attention");
    await advance(280);
    expect(container.querySelector("ul")?.textContent).toContain("Acme");
    expect(loading()).toBe(false);
  });
});
