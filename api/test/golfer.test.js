import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStore } from "../src/golfer/store.js";
import { getStats, validateRound, validateProfile } from "../src/golfer/service.js";
import { personalize } from "../src/scout/personalize.js";

test("profile and round validation rejects invalid values", () => {
  for (const profile of [{ handicap: "12" }, { preferredHoles: 10 }, { favoriteCourseIds: ["unknown"] }, [], { displayName: " " }]) assert.throws(() => validateProfile(profile));
  for (const date of ["2026-02-30", "not-a-date", "2026-13-01"]) assert.throws(() => validateRound({ courseId: "waveland", date, holes: 18 }));
});

test("stats keep nine and eighteen hole scores separate and exclude planned rounds", () => {
  const stats = getStats([
    { holes: 9, status: "completed", score: { strokes: 42, par: 36 } },
    { holes: 18, status: "completed", score: { strokes: 84, par: 72 } },
    { holes: 18, status: "completed", score: { strokes: 90, par: null } },
    { holes: 18, status: "planned", score: null }
  ]);
  assert.equal(stats.nineHoles.averageScore, 42);
  assert.equal(stats.eighteenHoles.averageScore, 87);
  assert.equal(stats.eighteenHoles.averageToPar, 12);
  assert.equal(getStats([]).eighteenHoles.averageScore, null);
});

test("personalization preserves base scores, bounds bonuses, and respects explicit format", () => {
  const item = { flyoverScore: 97, courseId: "waveland", holes: 18, course: { walk: true } };
  assert.equal(personalize(item).flyoverScore, 97);
  const personalized = personalize(item, { favoriteCourseIds: ["waveland"], preferredHoles: 18 }, [{ courseId: "waveland", status: "completed" }], { holes: 9 });
  assert.equal(personalized.flyoverScore, 100);
  assert.equal(personalized.baseFlyoverScore, 97);
  assert.equal(personalized.golferFit.adjustment, 3);
  assert.equal(personalized.golferFit.reasons.length, 2);
});

test("store serializes concurrent writes and persists across instances", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flyover-store-"));
  try {
    const store = createStore(directory);
    await Promise.all(Array.from({ length: 20 }, (_, id) => store.update(state => state.rounds.push({ id }))));
    assert.equal((await createStore(directory).read()).rounds.length, 20);
    await assert.rejects(store.update(() => { throw Error("invalid"); }));
    await store.update(state => { state.profile.displayName = "Joe"; });
    assert.equal((await store.read()).profile.displayName, "Joe");
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("API profile → round → score → stats → personalized Scout; corrections and errors", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flyover-api-"));
  process.env.GOLFER_DATA_DIR = directory;
  const { app } = await import("../src/server.js");
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(path, method = "GET", body, expected = 200) {
    const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    assert.equal(response.status, expected);
    return response.json();
  }
  try {
    await request("/golfer-profile", "PUT", { displayName: "Joe", favoriteCourseIds: ["waveland"] });
    const { round } = await request("/rounds", "POST", { courseId: "waveland", date: "2026-08-01", holes: 18, tees: "Blue" }, 201);
    await request(`/rounds/${round.id}/score`, "PUT", { strokes: 84, par: 72 });
    assert.equal((await request("/stats")).stats.eighteenHoles.averageScore, 84);
    await request(`/rounds/${round.id}/score`, "PUT", { strokes: 83, par: 72 });
    assert.equal((await request("/stats")).stats.completedRounds, 1);
    assert.equal((await request("/stats")).stats.eighteenHoles.averageScore, 83);
    await request(`/rounds/${round.id}/score`, "PUT", { strokes: -1 }, 400);
    await request("/rounds/missing/score", "PUT", { strokes: 84 }, 404);
    const future = await request("/rounds", "POST", { courseId: "waveland", date: "2099-01-01", holes: 9 }, 201);
    await request(`/rounds/${future.round.id}/score`, "PUT", { strokes: 40 }, 400);
    const payload = { courseId: "waveland", date: "2026-08-02", holes: 9, score: { strokes: 42, par: 36 }, requestId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" };
    const first = await request("/rounds", "POST", payload, 201);
    const retry = await request("/rounds", "POST", payload, 201);
    assert.equal(first.round.id, retry.round.id);
    assert.equal((await request("/stats")).stats.nineHoles.rounds, 1);
    await request("/rounds", "POST", { ...payload, requestId: undefined, score: { strokes: -1 } }, 400);
    assert.equal((await request("/stats")).stats.nineHoles.rounds, 1);
    const scout = await request("/scout/recommendations", "POST", {});
    const match = scout.inventory.find(item => item.courseId === "waveland");
    assert.equal(match.golferFit.personalized, true);
    assert.equal(match.golferFit.reasons.length, 2);
    assert.ok(match.flyoverScore >= match.baseFlyoverScore);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
