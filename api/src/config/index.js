function readString(name, fallback = "") {
  const value = process.env[name];
  return value == null ? fallback : value.trim();
}

function readNumber(name, fallback) {
  const raw = readString(name);
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${name} must be a number.`);
  }

  return value;
}

function readCsv(name, fallback = []) {
  const raw = readString(name);
  if (!raw) return fallback;

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function providerConfig({ id, label, baseUrlEnv, apiKeyEnv }) {
  const baseUrl = readString(baseUrlEnv);
  const apiKey = readString(apiKeyEnv);

  return {
    id,
    label,
    baseUrl,
    apiKey,
    configured: Boolean(baseUrl && apiKey)
  };
}

export const config = Object.freeze({
  env: readString("NODE_ENV", "development"),
  port: readNumber("PORT", 3000),

  corsOrigins: readCsv("CORS_ORIGINS", [
    "http://localhost:8080",
    "http://127.0.0.1:8080"
  ]),

  providers: Object.freeze({
    foreup: Object.freeze(
      providerConfig({
        id: "foreup",
        label: "foreUP",
        baseUrlEnv: "FOREUP_API_BASE_URL",
        apiKeyEnv: "FOREUP_API_KEY"
      })
    ),

    clubcaddie: Object.freeze(
      providerConfig({
        id: "clubcaddie",
        label: "Club Caddie",
        baseUrlEnv: "CLUB_CADDIE_API_BASE_URL",
        apiKeyEnv: "CLUB_CADDIE_API_KEY"
      })
    )
  })
});

export function getPublicConfig() {
  return {
    env: config.env,
    providers: Object.fromEntries(
      Object.entries(config.providers).map(([key, provider]) => [
        key,
        {
          label: provider.label,
          configured: provider.configured
        }
      ])
    )
  };
}
