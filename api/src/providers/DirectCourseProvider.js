import { InventoryProvider } from "./InventoryProvider.js";

export class DirectCourseProvider extends InventoryProvider {
  constructor() {
    super("direct", "Course Direct");
  }

  async search(course, _date, _players) {
    return course.demoTimes.map((slot) =>
      this.normalize(slot, course)
    );
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
      price: course.basePrice,
      holes: course.holes,
      availablePlayers: 4,
      cartIncluded: false,
      bookingUrl: course.bookingUrl,
      isLive: false
    };
  }
}
