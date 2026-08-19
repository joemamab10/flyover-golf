import express from "express";
import cors from "cors";
import { config, getPublicConfig } from "./config/index.js";
import { courses } from "./courses/courses.js";
import { loadInventory } from "./tee-times/inventoryService.js";
import { getScoutResults } from "./scout/recommendations.js";
import { ProviderError } from "./providers/ProviderError.js";

const app = express();

const corsOptions = {
  origin(origin, callback) {
    // Non-browser tools such as curl do not send Origin.
    if (!origin || config.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  }
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "flyover-golf-api",
    environment: config.env,
    providers: getPublicConfig().providers
  });
});

app.get("/api/config", (_req, res) => {
  // Deliberately excludes API keys and provider base URLs.
  res.json(getPublicConfig());
});

app.get("/api/courses", (_req, res) => {
  res.json({ courses });
});

app.get("/api/tee-times", async (req, res) => {
  const players = Number(req.query.players || 4);
  const date = req.query.date || "today";
  const inventory = await loadInventory({ date, players });
  res.json({ inventory });
});

app.post("/api/scout/recommendations", async (req, res) => {
  const { recommendations, inventory } = await getScoutResults(req.body || {});

  res.json({
    count: recommendations.length,
    inventoryCount: inventory.length,
    recommendations,
    inventory
  });
});

app.use((error, _req, res, _next) => {
  if (error instanceof ProviderError) {
    res.status(error.status).json(error.toJSON());
    return;
  }

  console.error(error);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." }
  });
});

app.listen(config.port, () => {
  console.log(
    `Flyover Golf API listening on http://localhost:${config.port} (${config.env})`
  );

  for (const provider of Object.values(config.providers)) {
    console.log(
      `${provider.label}: ${provider.configured ? "credentials configured" : "POC mode"}`
    );
  }
});
