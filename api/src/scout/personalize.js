import { courseExperience } from "../golfer/feedback.js";
export function personalize(item, profile = {}, rounds = [], preferences = {}) {
  const reasons = [];
  let adjustment = 0;
  if (profile.favoriteCourseIds?.includes(item.courseId)) {
    adjustment += 5;
    reasons.push("One of your favorite courses (+5).");
  }
  const experience=courseExperience(item.courseId,rounds);
  if(experience){adjustment+=experience.adjustment;reasons.push(...experience.reasons);}
  if (!experience && rounds.some(round => round.courseId === item.courseId && round.status === "completed")) {
    adjustment += 2;
    reasons.push("You have played this course before (+2).");
  }
  // Explicit search preferences take priority over the saved profile.
  if (preferences.holes == null && profile.preferredHoles && profile.preferredHoles !== "either" && profile.preferredHoles === item.holes) {
    adjustment += 3;
    reasons.push(`Matches your saved ${profile.preferredHoles}-hole preference (+3).`);
  }
  if (preferences.ride == null && ["walk", "cart"].includes(profile.preferredRide) && item.course[profile.preferredRide]) {
    adjustment += 3;
    reasons.push(`Supports your saved ${profile.preferredRide} preference (+3).`);
  }
  const flyoverScore = Math.max(0, Math.min(100, item.flyoverScore + adjustment));
  return { ...item, baseFlyoverScore: item.flyoverScore, flyoverScore, personalizedFlyoverScore: flyoverScore, golferFit: { experience, adjustment: flyoverScore - item.flyoverScore, reasons, personalized: reasons.length > 0 } };
}
