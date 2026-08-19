export class ProviderError extends Error {
  constructor({ provider, code, message, status = 502, retryable = false, cause }) {
    super(message, { cause });
    this.name = "ProviderError";
    this.provider = provider;
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }

  toJSON() {
    return {
      error: {
        provider: this.provider,
        code: this.code,
        message: this.message,
        retryable: this.retryable
      }
    };
  }
}
