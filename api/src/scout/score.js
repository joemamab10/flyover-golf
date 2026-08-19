const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

export function scoreTeeTime(item, preferences) {
  const {
    maxPrice = 65,
    maxDriveMinutes = 30,
    when = "morning",
    holes = 18,
    ride = "cart",
    style = "balanced"
  } = preferences;

  const course = item.course;

  const priceRatio = item.price / maxPrice;
  const priceScore =
    priceRatio <= 0.7 ? 100 :
    priceRatio <= 1 ? 100 - ((priceRatio - 0.7) / 0.3) * 20 :
    80 - Math.min(60, (priceRatio - 1) * 120);

  const driveRatio = course.driveMinutes / maxDriveMinutes;
  const driveScore =
    driveRatio <= 0.6 ? 100 :
    driveRatio <= 1 ? 100 - ((driveRatio - 0.6) / 0.4) * 22 :
    78 - Math.min(58, (driveRatio - 1) * 110);

  const courseScore = clamp(((course.rating - 3.5) / 1.5) * 35 + 65);
  const weatherScore = clamp(course.weatherScore);

  let timeScore = 100;
  if (when === "morning" && item.hour >= 12) timeScore = 45;
  if (when === "afternoon" && item.hour < 12) timeScore = 55;

  const formatScore = holes === "either" || Number(holes) === item.holes ? 100 : 35;

  let rideScore = 100;
  if (ride === "walk" && !course.walk) rideScore = 45;
  if (ride === "cart" && !course.cart) rideScore = 45;

  let weights = {
    price: 0.20,
    drive: 0.19,
    course: 0.24,
    weather: 0.17,
    time: 0.10,
    format: 0.05,
    ride: 0.05
  };

  if (style === "value") {
    weights = { price: 0.37, drive: 0.20, course: 0.15, weather: 0.10, time: 0.08, format: 0.05, ride: 0.05 };
  }

  if (style === "quality") {
    weights = { price: 0.10, drive: 0.13, course: 0.42, weather: 0.16, time: 0.09, format: 0.05, ride: 0.05 };
  }

  let score =
    priceScore * weights.price +
    driveScore * weights.drive +
    courseScore * weights.course +
    weatherScore * weights.weather +
    timeScore * weights.time +
    formatScore * weights.format +
    rideScore * weights.ride;

  if (item.price > maxPrice) score -= 14;
  if (course.driveMinutes > maxDriveMinutes) score -= 12;
  if (formatScore < 60) score -= 12;
  if (rideScore < 60) score -= 8;
  if (timeScore < 60) score -= 10;

  return {
    ...item,
    flyoverScore: clamp(score),
    factors: {
      price: clamp(priceScore),
      drive: clamp(driveScore),
      course: courseScore,
      weather: weatherScore,
      time: timeScore,
      format: formatScore,
      ride: rideScore
    }
  };
}
