import { InventoryProvider } from "./InventoryProvider.js";

export class ForeUpProvider extends InventoryProvider {
  constructor() {
    super("foreup", "foreUP");
  }

  async search(course, date, players) {
    // POC ONLY.
    // Replace this simulated response with an authorized foreUP API request.
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
