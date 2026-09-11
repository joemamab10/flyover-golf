import { discover, validDate } from "../../shared/discovery.js";
import catalog from "../../shared/catalog.json" with {type:"json"};
import express from "express";
import cors from "cors";
import { config, getPublicConfig } from "./config/index.js";
import { courses } from "./courses/courses.js";
import { loadInventory } from "./tee-times/inventoryService.js";
import { getScoutResults } from "./scout/recommendations.js";
import { ProviderError } from "./providers/ProviderError.js";

import { fileURLToPath, pathToFileURL } from "node:url";
import { createStore } from "./golfer/store.js";
import { golferRoutes } from "./golfer/routes.js";
import { InputError } from "./golfer/service.js";

const store = createStore(process.env.GOLFER_DATA_DIR || fileURLToPath(new URL("../.local/", import.meta.url)));
export const app = express();

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
app.use("/api", golferRoutes(store));

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

app.post("/api/discovery", async (req,res)=>{if(!validDate(req.body.date))throw new InputError("Choose a valid planning date.");res.json({courses:discover(catalog,req.body,(await store.read()).rounds)});});

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
  const { recommendations, inventory } = await getScoutResults(req.body || {}, await store.read());

  res.json({
    count: recommendations.length,
    inventoryCount: inventory.length,
    recommendations,
    inventory
  });
});

app.use((error, _req, res, _next) => {
  if (error instanceof InputError || error.type === "entity.parse.failed") {
    res.status(error.status || 400).json({ error: { code: "INVALID_INPUT", message: error instanceof InputError ? error.message : "Invalid JSON body." } });
    return;
  }

  if (error instanceof ProviderError) {
    res.status(error.status).json(error.toJSON());
    return;
  }

  console.error(error);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." }
  });
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) app.listen(config.port, () => {
  console.log(
    `Flyover Golf API listening on http://localhost:${config.port} (${config.env})`
  );

  for (const provider of Object.values(config.providers)) {
    console.log(
      `${provider.label}: ${provider.configured ? "credentials configured" : "POC mode"}`
    );
  }
});
