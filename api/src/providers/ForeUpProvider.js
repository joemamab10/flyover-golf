import { config } from "../config/index.js";
import { InventoryProvider } from "./InventoryProvider.js";
import { ProviderError } from "./ProviderError.js";

export class ForeUpProvider extends InventoryProvider {
  constructor({ providerConfig = config.providers.foreup, fetchImpl = globalThis.fetch } = {}) {
    super("foreup", "foreUP");
    this.config = providerConfig;
    this.fetch = fetchImpl;
  }

  async search(course, date, players) {
    // Keep POC inventory active until foreUP supplies its official endpoint,
    // request parameters, and response contract. request() below is the shared
    // HTTP shell the eventual live search will call.
    return this.searchPoc(course, date, players);
  }

  validateConfig() {
    const errors = [];

    if (!this.config.baseUrl) errors.push("FOREUP_API_BASE_URL is required.");
    if (!this.config.apiKey) errors.push("FOREUP_API_KEY is required.");
    if (!this.config.authHeader) errors.push("FOREUP_AUTH_HEADER is required.");

    if (this.config.baseUrl) {
      try {
        const url = new URL(this.config.baseUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      } catch {
        errors.push("FOREUP_API_BASE_URL must be a valid HTTP(S) URL.");
      }
    }

    if (!Number.isFinite(this.config.requestTimeoutMs) || this.config.requestTimeoutMs <= 0) {
      errors.push("FOREUP_REQUEST_TIMEOUT_MS must be greater than zero.");
    }

    return { valid: errors.length === 0, errors };
  }

  buildAuthHeaders() {
    const { valid, errors } = this.validateConfig();
    if (!valid) {
      throw new ProviderError({
        provider: this.id,
        code: "PROVIDER_CONFIG_INVALID",
        message: errors.join(" "),
        status: 503
      });
    }

    const credential = this.config.authScheme
      ? `${this.config.authScheme} ${this.config.apiKey}`
      : this.config.apiKey;

    return { [this.config.authHeader]: credential };
  }

  async request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      const url = new URL(endpoint, this.config.baseUrl);
      const response = await this.fetch(url, {
        ...options,
        headers: {
          accept: "application/json",
          ...this.buildAuthHeaders(),
          ...options.headers
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new ProviderError({
          provider: this.id,
          code: "PROVIDER_HTTP_ERROR",
          message: `foreUP returned HTTP ${response.status}.`,
          status: 502,
          retryable: response.status === 429 || response.status >= 500
        });
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ProviderError) throw error;

      const timedOut = error?.name === "AbortError";
      throw new ProviderError({
        provider: this.id,
        code: timedOut ? "PROVIDER_TIMEOUT" : "PROVIDER_UNAVAILABLE",
        message: timedOut
          ? `foreUP did not respond within ${this.config.requestTimeoutMs}ms.`
          : "foreUP could not be reached.",
        status: 502,
        retryable: true,
        cause: error
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async searchPoc(course, date, players) {
    const raw = {
      courseId: course.providerCourseId,
      date,
      slots: course.demoTimes.map((slot, index) => ({
        time: slot.time,
        hour: slot.hour,
        holes: course.holes,
        price: course.basePrice + (index === 2 ? 3 : 0),
        availablePlayers: Math.max(players, 4 - index),
        bookingUrl: course.bookingUrl
      }))
    };

    return raw.slots.map((slot) => this.normalize(slot, course));
  }

  normalize(raw, course) {
    return {
      provider: this.id,
      providerLabel: this.label,
      courseId: course.id,
      providerCourseId: course.providerCourseId,
      courseName: course.name,
      time: raw.time,
      hour: raw.hour,
      price: raw.price,
      holes: raw.holes,
      availablePlayers: raw.availablePlayers,
      cartIncluded: false,
      bookingUrl: raw.bookingUrl,
      isLive: false
    };
  }
}
