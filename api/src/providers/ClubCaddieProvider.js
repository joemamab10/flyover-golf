import { InventoryProvider } from "./InventoryProvider.js";

export class ClubCaddieProvider extends InventoryProvider {
  constructor() {
    super("clubcaddie", "Club Caddie");
  }

  async search(course, date, players) {
    // POC ONLY.
    // Replace with an authorized Club Caddie API/integration when available.
    const raw = course.demoTimes.map((slot, index) => ({
      teeTime: slot.time,
      hour: slot.hour,
      rate: course.basePrice + (index === 1 ? 2 : 0),
      spots: Math.max(players, 4 - index),
      holes: course.holes,
      url: course.bookingUrl
    }));

    return raw.map((slot) => this.normalize(slot, course));
  }

  normalize(raw, course) {
    return {
      provider: this.id,
      providerLabel: this.label,
      courseId: course.id,
      providerCourseId: course.providerCourseId,
      courseName: course.name,
      time: raw.teeTime,
      hour: raw.hour,
      price: raw.rate,
      holes: raw.holes,
      availablePlayers: raw.spots,
      cartIncluded: false,
      bookingUrl: raw.url,
      isLive: false
    };
  }
}
