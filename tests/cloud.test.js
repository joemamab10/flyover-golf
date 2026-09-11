import test from "node:test";
import assert from "node:assert/strict";
import { database } from "./database.js";
import worker from "../worker/index.js";

const origin="https://flyover.test";
const newRound={courseId:"waveland",date:"2026-08-01",holes:18,score:{strokes:84,par:72},requestId:"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"};
function client(db,user="alice",headers={}){return async(path,method="GET",data)=>{
 const r=await worker.fetch(new Request(origin+path,{method,headers:{"content-type":"application/json",origin,...(user?{"oai-authenticated-user-id":user,"oai-authenticated-user-email":`${user}@example.com`}:{}),...headers},body:data===undefined?undefined:JSON.stringify(data)}),{DB:db});return {status:r.status,data:await r.json(),headers:r.headers};
};}

test("cloud rejects anonymous requests and cross-origin writes",async()=>{
 const {db,sql}=database();
 try{
  for(const path of ["/api/rounds","/api/stats","/api/golfer-profile"])assert.equal((await client(db,null)(path)).status,401);
  assert.equal((await client(db,null)("/api/rounds","POST",newRound)).status,401);
  assert.equal((await client(db,"alice",{origin:"https://evil.test"})("/api/rounds","POST",newRound)).status,403);
  assert.equal((await client(db,"alice",{origin:""})("/api/rounds","POST",newRound)).status,403);
  const session=await client(db,"alice")("/api/session");assert.equal(session.data.user.email,"alice@example.com");assert.equal(session.headers.get("cache-control"),"no-store");
 }finally{sql.close();}
});

test("rounds, profile, stats and personalization are scoped to the authenticated account",async()=>{
 const {db,sql}=database();const alice=client(db),bob=client(db,"bob");
 try{
  const saved=await alice("/api/rounds","POST",{...newRound,userId:"bob"});assert.equal(saved.status,201);
  const round=saved.data.round;
  assert.equal((await bob("/api/rounds")).data.rounds.length,0);
  assert.equal((await bob(`/api/rounds/${round.id}/score`,"PUT",{strokes:50,par:72,version:1})).status,404);
  await alice("/api/golfer-profile","PUT",{displayName:"Alice",favoriteCourseIds:["waveland"]});
  assert.deepEqual((await bob("/api/golfer-profile")).data.profile,{});
  assert.equal((await alice("/api/stats")).data.stats.eighteenHoles.averageScore,84);
  assert.equal((await bob("/api/stats")).data.stats.completedRounds,0);
  const aScout=await alice("/api/scout/recommendations","POST",{}),bScout=await bob("/api/scout/recommendations","POST",{});
  assert.equal(aScout.data.inventory.find(row=>row.courseId==="waveland").golferFit.personalized,true);
  assert.equal(bScout.data.inventory.find(row=>row.courseId==="waveland").golferFit.personalized,false);
 }finally{sql.close();}
});

test("two devices share history; safe retries and stale edits preserve the latest score",async()=>{
 const {db,sql}=database();const phone=client(db),laptop=client(db);
 try{
  const first=await phone("/api/rounds","POST",newRound),again=await laptop("/api/rounds","POST",newRound);
  assert.equal(first.data.round.id,again.data.round.id);
  const id=first.data.round.id;
  assert.equal((await laptop("/api/rounds")).data.rounds.length,1);
  assert.equal((await phone(`/api/rounds/${id}/score`,"PUT",{strokes:83,par:72,version:1})).status,200);
  assert.equal((await laptop(`/api/rounds/${id}/score`,"PUT",{strokes:85,par:72,version:1})).status,409);
  assert.equal((await laptop("/api/rounds")).data.rounds[0].score.strokes,83);
 }finally{sql.close();}
});

test("imports validate before writing and preserve existing corrections",async()=>{
 const {db,sql}=database();const alice=client(db);
 try{
  const input={...newRound,id:"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"};
  assert.equal((await alice("/api/rounds/import","POST",{rounds:[input,{...input,id:"bad"}]})).status,400);
  assert.equal((await alice("/api/rounds")).data.rounds.length,0);
  assert.equal((await alice("/api/rounds/import","POST",{rounds:[input]})).status,200);
  await alice(`/api/rounds/${input.id}/score`,"PUT",{strokes:82,par:72,version:1});
  await alice("/api/rounds/import","POST",{rounds:[input]});
  const rounds=(await alice("/api/rounds")).data.rounds;assert.equal(rounds.length,1);assert.equal(rounds[0].score.strokes,82);
 }finally{sql.close();}
});

test("feedback is private, versioned and survives score corrections and imports",async()=>{
 const {db,sql}=database();const alice=client(db),bob=client(db,"bob");
 try{
  const {data}=await alice("/api/rounds","POST",newRound),id=data.round.id;
  assert.equal((await bob(`/api/rounds/${id}/feedback`,"PUT",{playAgain:"no",version:1})).status,404);
  assert.equal((await alice(`/api/rounds/${id}/feedback`,"PUT",{playAgain:"no",pace:1,version:1})).status,200);
  assert.equal((await alice(`/api/rounds/${id}/feedback`,"PUT",{playAgain:"yes",version:1})).status,409);
  await alice(`/api/rounds/${id}/score`,"PUT",{strokes:83,par:72,version:2});
  assert.equal((await alice("/api/rounds")).data.rounds[0].feedback.playAgain,"no");
  const scout=await alice("/api/scout/recommendations","POST",{});
  assert.ok(scout.data.inventory.find(row=>row.courseId==="waveland").golferFit.adjustment<0);
  const payload={...newRound,id:"dddddddd-dddd-dddd-dddd-dddddddddddd",feedback:{playAgain:"yes",value:5}};
  assert.equal((await alice("/api/rounds/import","POST",{rounds:[payload]})).status,200);
  assert.ok((await alice("/api/rounds")).data.rounds.some(row=>row.feedback?.value===5));
 }finally{sql.close();}
});
