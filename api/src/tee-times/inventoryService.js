import { courses } from "../courses/courses.js";
import { providers } from "../providers/index.js";

export async function loadInventory({ date = "today", players = 4 } = {}) {
  const inventory = [];

  for (const course of courses) {
    const adapter = providers[course.provider] ?? providers.direct;
    const slots = await adapter.search(course, date, players);

    inventory.push(
      ...slots.map((slot) => ({
        ...slot,
        course: {
          id: course.id,
          name: course.name,
          city: course.city,
          driveMinutes: course.driveMinutes,
          rating: course.rating,
          weatherScore: course.weatherScore,
          walk: course.walk,
          cart: course.cart
        }
      }))
    );
  }

  return inventory;
}
