import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { webcrypto } from "node:crypto";

const source = await readFile(new URL("../../ui/device-store.js", import.meta.url), "utf8");
function setup() {
  const data = new Map();
  const localStorage = { getItem:key=>data.get(key)??null, setItem:(key,value)=>data.set(key,value) };
  const context = vm.createContext({ window:{}, localStorage, navigator:{}, crypto:webcrypto, courses:[{ providerCourseId:"waveland", name:"Waveland" }] });
  vm.runInContext(source,context);
  return { store:context.window.flyoverDeviceStore, localStorage };
}
const payload = { courseId:"waveland", date:"2026-08-01", holes:18, score:{strokes:84,par:72}, requestId:"one" };
test("device scores persist, retry safely and update Scout familiarity", async()=>{
  const {store}=setup();
  assert.equal(store.played("waveland"),false);
  const first=await store.request("/rounds","POST",payload);
  const retry=await store.request("/rounds","POST",payload);
  assert.equal(first.round.id,retry.round.id);
  await store.request(`/rounds/${first.round.id}/score`,"PUT",{strokes:83,par:72});
  const {stats}=await store.request("/stats","GET");
  assert.equal(stats.completedRounds,1);assert.equal(stats.eighteenHoles.averageScore,83);
  assert.equal(stats.nineHoles.averageScore,null);assert.equal(store.played("waveland"),true);
});
test("device storage failures and invalid scores do not claim a successful save",async()=>{
  const {store,localStorage}=setup();
  await assert.rejects(store.request("/rounds","POST",{...payload,score:{strokes:-1,par:72}}));
  assert.equal((await store.request("/rounds","GET")).rounds.length,0);
  localStorage.setItem=()=>{throw Error("quota");};
  await assert.rejects(store.request("/rounds","POST",payload),/could not save/);
  assert.equal((await store.request("/rounds","GET")).rounds.length,0);
});

test("device feedback changes course fit and leaves the score intact",async()=>{
 const {store}=setup();const {round}=await store.request("/rounds","POST",payload);
 await store.request(`/rounds/${round.id}/feedback`,"PUT",{playAgain:"no",pace:1});
 assert.equal(store.experience("waveland").adjustment,-14);
 assert.equal((await store.request("/rounds","GET")).rounds[0].score.strokes,84);
 await assert.rejects(store.request(`/rounds/${round.id}/feedback`,"PUT",{playAgain:"yes",pace:9}));
 assert.equal(store.experience("waveland").adjustment,-14);
});
