import { loadInventory } from "../tee-times/inventoryService.js";
import { scoreTeeTime } from "./score.js";

export async function getRecommendations(preferences = {}) {
  const inventory = await loadInventory({
    date: preferences.date ?? "today",
    players: preferences.players ?? 4
  });

  return inventory
    .map((item) => scoreTeeTime(item, preferences))
    .sort((a, b) => b.flyoverScore - a.flyoverScore);
}
