import express from "express";
import cors from "cors";
import { courses } from "./courses/courses.js";
import { loadInventory } from "./tee-times/inventoryService.js";
import { getRecommendations } from "./scout/recommendations.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "flyover-golf-api" });
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
  const recommendations = await getRecommendations(req.body || {});
  res.json({
    count: recommendations.length,
    recommendations
  });
});

app.listen(port, () => {
  console.log(`Flyover Golf API listening on http://localhost:${port}`);
});
