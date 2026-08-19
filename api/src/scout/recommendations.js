import { loadInventory } from "../tee-times/inventoryService.js";
import { scoreTeeTime } from "./score.js";

function rankInventory(inventory, preferences) {
  return inventory
    .map((item) => scoreTeeTime(item, preferences))
    .sort((a, b) => {
      if (b.flyoverScore !== a.flyoverScore) {
        return b.flyoverScore - a.flyoverScore;
      }

      // Stable, user-friendly tie breakers:
      // 1) shorter drive
      // 2) lower price
      // 3) earlier tee time
      if (a.course.driveMinutes !== b.course.driveMinutes) {
        return a.course.driveMinutes - b.course.driveMinutes;
      }

      if (a.price !== b.price) {
        return a.price - b.price;
      }

      return a.hour - b.hour;
    });
}

function selectBestRoundPerCourse(rankedInventory) {
  const seenCourses = new Set();
  const recommendations = [];

  for (const teeTime of rankedInventory) {
    if (seenCourses.has(teeTime.courseId)) {
      continue;
    }

    seenCourses.add(teeTime.courseId);
    recommendations.push(teeTime);
  }

  return recommendations;
}

export async function getScoutResults(preferences = {}) {
  const inventory = await loadInventory({
    date: preferences.date ?? "today",
    players: preferences.players ?? 4
  });

  const rankedInventory = rankInventory(inventory, preferences);
  const recommendations = selectBestRoundPerCourse(rankedInventory);

  return {
    recommendations,
    inventory: rankedInventory
  };
}

// Kept for callers that only need the course-diverse recommendation list.
export async function getRecommendations(preferences = {}) {
  const { recommendations } = await getScoutResults(preferences);
  return recommendations;
}
