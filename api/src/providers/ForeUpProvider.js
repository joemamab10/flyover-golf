import { config } from "../config/index.js";
import { InventoryProvider } from "./InventoryProvider.js";

export class ForeUpProvider extends InventoryProvider {
  constructor() {
    super("foreup", "foreUP");
    this.config = config.providers.foreup;
  }

  async search(course, date, players) {
    if (this.config.configured) {
      // Credentials are now available, but we intentionally do not guess
      // foreUP's authorized endpoint/contract. The real HTTP implementation
      // belongs here after Flyover receives the official integration docs.
      return this.searchPoc(course, date, players);
    }

    return this.searchPoc(course, date, players);
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
