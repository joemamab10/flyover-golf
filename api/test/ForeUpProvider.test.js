import assert from "node:assert/strict";
import test from "node:test";
import { ForeUpProvider } from "../src/providers/ForeUpProvider.js";
import { ProviderError } from "../src/providers/ProviderError.js";

function configured(overrides = {}) {
  return {
    baseUrl: "https://authorized.example/",
    apiKey: "secret",
    authHeader: "X-Official-Key",
    authScheme: "",
    requestTimeoutMs: 50,
    ...overrides
  };
}

test("builds auth headers from configuration without assuming a vendor scheme", () => {
  const provider = new ForeUpProvider({ providerConfig: configured() });
  assert.deepEqual(provider.buildAuthHeaders(), { "X-Official-Key": "secret" });
});

test("reports incomplete configuration as a standardized provider error", () => {
  const provider = new ForeUpProvider({ providerConfig: configured({ authHeader: "" }) });
  assert.throws(
    () => provider.buildAuthHeaders(),
    (error) => error instanceof ProviderError && error.code === "PROVIDER_CONFIG_INVALID"
  );
});

test("standardizes provider HTTP failures", async () => {
  const provider = new ForeUpProvider({
    providerConfig: configured(),
    fetchImpl: async () => ({ ok: false, status: 503 })
  });

  await assert.rejects(
    provider.request("official-path"),
    (error) => error.code === "PROVIDER_HTTP_ERROR" && error.retryable === true
  );
});

test("standardizes request timeouts", async () => {
  const provider = new ForeUpProvider({
    providerConfig: configured({ requestTimeoutMs: 5 }),
    fetchImpl: async (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () =>
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }))
        );
      })
  });

  await assert.rejects(
    provider.request("official-path"),
    (error) => error.code === "PROVIDER_TIMEOUT" && error.retryable === true
  );
});

test("continues returning POC inventory while the live contract is unavailable", async () => {
  const provider = new ForeUpProvider({ providerConfig: configured() });
  const course = {
    id: "tci",
    name: "Tournament Club of Iowa",
    providerCourseId: "tci-polk-city",
    holes: 18,
    basePrice: 55,
    bookingUrl: "https://tcofiowa.com/",
    demoTimes: [{ time: "8:00 AM", hour: 8 }]
  };

  const inventory = await provider.search(course, "today", 4);
  assert.equal(inventory[0].isLive, false);
  assert.equal(inventory[0].provider, "foreup");
});
