import { courses } from "../courses/courses.js";

export class InputError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
function object(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError("Expected a JSON object.");
}
function number(value, min, max, label, integer = false) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new InputError(`${label} must be ${integer ? "an integer" : "a number"} from ${min} to ${max}.`);
  return value;
}
function text(value, label) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 100) throw new InputError(`${label} must contain 1–100 characters.`);
  return value.trim();
}
export function validateProfile(input) {
  object(input);
  const profile = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === "displayName") profile[key] = text(value, key);
    else if (key === "handicap") profile[key] = value === null ? null : number(value, -10, 54, key);
    else if (key === "preferredHoles" && [9, 18, "either"].includes(value)) profile[key] = value;
    else if (key === "preferredRide" && ["walk", "cart", "either"].includes(value)) profile[key] = value;
    else if (key === "favoriteCourseIds" && Array.isArray(value) && value.length <= courses.length && value.every(id => courses.some(course => course.id === id))) profile[key] = [...new Set(value)];
    else throw new InputError(`Invalid profile field: ${key}`);
  }
  return profile;
}
export function validateRound(input) {
  object(input);
  const course = courses.find(course => course.id === input.courseId);
  if (!course) throw new InputError("Choose a known courseId.");
  if (typeof input.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !Number.isFinite(Date.parse(input.date)) || new Date(input.date).toISOString().slice(0, 10) !== input.date) throw new InputError("date must be a valid YYYY-MM-DD date.");
  if (![9, 18].includes(input.holes)) throw new InputError("holes must be 9 or 18.");
  return { id: crypto.randomUUID(), courseId: course.id, courseName: course.name, date: input.date, holes: input.holes, tees: input.tees == null ? null : text(input.tees, "tees"), status: "planned", score: null, createdAt: new Date().toISOString() };
}
export function validateScore(input, round) {
  object(input);
  if (round.date > new Date().toISOString().slice(0, 10)) throw new InputError("Scores cannot be entered for future rounds.");
  return { strokes: number(input.strokes, round.holes, round.holes * 15, "strokes", true), par: input.par == null ? null : number(input.par, round.holes * 3, round.holes * 6, "par", true) };
}
export function getStats(rounds) {
  const completed = rounds.filter(round => round.status === "completed" && round.score);
  const group = holes => {
    const rows = completed.filter(round => round.holes === holes);
    const scores = rows.map(round => round.score.strokes);
    const withPar = rows.filter(round => round.score.par !== null);
    return { rounds: rows.length, averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null, bestScore: scores.length ? Math.min(...scores) : null, averageToPar: withPar.length ? Math.round(withPar.reduce((sum, round) => sum + round.score.strokes - round.score.par, 0) / withPar.length * 10) / 10 : null };
  };
  return { completedRounds: completed.length, nineHoles: group(9), eighteenHoles: group(18) };
}
