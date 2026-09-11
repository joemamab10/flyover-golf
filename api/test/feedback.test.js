import test from "node:test";
import assert from "node:assert/strict";
import { validateFeedback, courseExperience } from "../src/golfer/feedback.js";
import { personalize } from "../src/scout/personalize.js";
import { getScoutResults } from "../src/scout/recommendations.js";
const round={id:"1",courseId:"waveland",status:"completed",date:"2026-08-01",createdAt:"2026-08-01T00:00:00Z"};
test("feedback accepts explicit return intent and optional ratings",()=>{
 assert.deepEqual(validateFeedback({playAgain:"yes"},round),{playAgain:"yes",value:null,conditions:null,pace:null});
 for(const input of [{playAgain:"unknown"},{playAgain:"yes",pace:6},{playAgain:"no",value:"5"}])assert.throws(()=>validateFeedback(input,round));
 assert.throws(()=>validateFeedback({playAgain:"yes"},{status:"planned"}));
});
test("latest review replaces familiarity; negative feedback reduces rank without stacking",()=>{
 const positive={...round,feedback:{playAgain:"yes",value:5,conditions:4,pace:4}};
 const negative={...round,date:"2026-08-02",feedback:{playAgain:"no",value:2,conditions:2,pace:1}};
 assert.equal(courseExperience("waveland",[positive,negative]).adjustment,-18);
 const item={courseId:"waveland",flyoverScore:80,course:{},holes:18};
 assert.equal(personalize(item,{},[positive]).flyoverScore,89);
 assert.equal(personalize(item,{},[positive,negative]).flyoverScore,62);
 assert.equal(personalize(item,{},[positive,negative,negative]).flyoverScore,62);
 assert.equal(personalize({...item,flyoverScore:5},{},[negative]).flyoverScore,0);
});
test("Scout respects hard limits and returns an honest empty result",async()=>{
 const tight=await getScoutResults({maxPrice:40,maxDriveMinutes:16});
 assert.ok(tight.inventory.length>0);assert.ok(tight.inventory.every(item=>item.price<=40&&item.course.driveMinutes<=16));
 const noMatches=await getScoutResults({holes:9});assert.equal(noMatches.recommendations.length,0);
 const noAfternoon=await getScoutResults({when:"afternoon"});assert.equal(noAfternoon.recommendations.length,0);
});
