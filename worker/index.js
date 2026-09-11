import { limitedJson as body, limitRequests } from "./reliability.js";
import { discover, validDate } from "../shared/discovery.js";
import catalog from "../shared/catalog.json" with {type:"json"};
import { validateFeedback } from "../api/src/golfer/feedback.js";
import { InputError, validateRound, validateScore, validateProfile, getStats } from "../api/src/golfer/service.js";

const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store","Vary":"Cookie","X-Content-Type-Options":"nosniff"}});
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function readRounds(db,userId){
  const {results}=await db.prepare("SELECT data FROM golfer_rounds WHERE user_id = ?").bind(userId).all();
  return results.map(row=>JSON.parse(row.data)).sort((a,b)=>b.date.localeCompare(a.date));
}
async function readProfile(db,userId){const row=await db.prepare("SELECT data FROM golfer_profiles WHERE user_id = ?").bind(userId).first();return row?JSON.parse(row.data):{};}
function checkedRound(input){
  const round=validateRound(input);
  if(input.score!=null){round.score=validateScore(input.score,round);round.status="completed";}
  if(input.feedback!=null)round.feedback=validateFeedback(input.feedback,round);
  round.version=1;return round;
}
export default {
  async fetch(request,env){
    const url=new URL(request.url),path=url.pathname;
    if(!path.startsWith("/api/")&&path!=="/health")return env.ASSETS.fetch(request);
    // These headers are supplied by the Sites dispatcher, never by app form fields.
    const userId=request.headers.get("oai-authenticated-user-id");
    const email=request.headers.get("oai-authenticated-user-email");
    const authenticated=Boolean(userId&&email);
    const requestId=crypto.randomUUID();
    try{
      if(path==="/health"){
        await env.DB.prepare("SELECT user_id FROM golfer_rounds LIMIT 1").bind().first();
        return json({ok:true,mode:"course-discovery"});
      }
      if(path==="/api/session"&&request.method==="GET")return json({user:authenticated?{email}:null});
      if(path==="/api/courses"&&request.method==="GET")return json({courses:catalog.filter(course=>course.verifiedOn)});
      if(!["GET","HEAD"].includes(request.method)&&request.headers.get("origin")!==url.origin)throw new InputError("Request origin is not allowed.",403);
      if(authenticated)await limitRequests(env.DB,userId);
      if(path==="/api/discovery"&&request.method==="POST"){
        const prefs=await body(request);
        if(!validDate(prefs.date))throw new InputError("Choose a valid planning date.");
        const rounds=authenticated?await readRounds(env.DB,userId):[];
        return json({courses:discover(catalog,prefs,rounds),planningDate:prefs.date,mode:"course-discovery"});
      }
      if(path==="/api/scout/recommendations")return json({error:{message:"Use course discovery. Demo tee-time recommendations have been retired."}},410);
      if(!authenticated)return json({error:{message:"Sign in to access your synced rounds.",code:"SIGN_IN_REQUIRED"}},401);
      if(path==="/api/golfer-profile"){
        if(request.method==="GET")return json({profile:await readProfile(env.DB,userId)});
        if(request.method==="PUT"){
          const patch=validateProfile(await body(request));
          // JSON patch in SQL avoids lost fields when two devices update at once.
          await env.DB.prepare("INSERT INTO golfer_profiles(user_id,data) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET data=json_patch(golfer_profiles.data,excluded.data)").bind(userId,JSON.stringify(patch)).run();
          return json({profile:await readProfile(env.DB,userId)});
        }
      }
      if(path==="/api/account/export"&&request.method==="GET")return json({format:"flyover-rounds-v1",exportedAt:new Date().toISOString(),profile:await readProfile(env.DB,userId),rounds:await readRounds(env.DB,userId)});
      if(path==="/api/account"&&request.method==="DELETE"){
        const data=await body(request);
        if(data.confirmation!=="DELETE")throw new InputError("Type DELETE to confirm.");
        await env.DB.batch([
          env.DB.prepare("DELETE FROM golfer_rounds WHERE user_id = ?").bind(userId),
          env.DB.prepare("DELETE FROM golfer_profiles WHERE user_id = ?").bind(userId)
        ]);
        return json({ok:true});
      }
      const deleteMatch=path.match(/^\/api\/rounds\/([^/]+)$/);
      if(deleteMatch&&request.method==="DELETE"){
        const data=await body(request),id=decodeURIComponent(deleteMatch[1]);
        const existing=await env.DB.prepare("SELECT data FROM golfer_rounds WHERE user_id = ? AND id = ?").bind(userId,id).first();
        if(!existing)throw new InputError("Round not found.",404);
        if(data.version!==JSON.parse(existing.data).version)throw new InputError("This round changed. Refresh before deleting it.",409);
        const result=await env.DB.prepare("DELETE FROM golfer_rounds WHERE user_id = ? AND id = ? AND data = ?").bind(userId,id,existing.data).run();
        if(result.meta.changes!==1)throw new InputError("This round changed. Refresh before deleting it.",409);
        return json({ok:true});
      }
      if(path==="/api/rounds"&&request.method==="GET")return json({rounds:await readRounds(env.DB,userId)});
      if(path==="/api/stats"&&request.method==="GET")return json({stats:getStats(await readRounds(env.DB,userId))});
      if(path==="/api/rounds"&&request.method==="POST"){
        const data=await body(request),round=checkedRound(data);
        if(data.requestId!=null&&(typeof data.requestId!=="string"||!idPattern.test(data.requestId)))throw new InputError("Invalid requestId.");
        // Account-scoped request IDs make retries safe across devices and workers.
        if(data.requestId)round.id=data.requestId;
        await env.DB.prepare("INSERT INTO golfer_rounds(user_id,id,data) VALUES (?,?,?) ON CONFLICT(user_id,id) DO NOTHING").bind(userId,round.id,JSON.stringify(round)).run();
        const saved=await env.DB.prepare("SELECT data FROM golfer_rounds WHERE user_id = ? AND id = ?").bind(userId,round.id).first();
        return json({round:JSON.parse(saved.data)},201);
      }
      if(path==="/api/rounds/import"&&request.method==="POST"){
        const data=await body(request);
        if(!Array.isArray(data.rounds)||!data.rounds.length||data.rounds.length>100)throw new InputError("Choose a file containing 1–100 rounds.");
        const imports=data.rounds.map(input=>{
          if(!input||typeof input.id!=="string"||!idPattern.test(input.id))throw new InputError("A round has an invalid ID.");
          const round=checkedRound(input);round.id=input.id;return round;
        });
        // Validate the entire file before the atomic batch. Never overwrite a correction.
        await env.DB.batch(imports.map(round=>env.DB.prepare("INSERT INTO golfer_rounds(user_id,id,data) VALUES (?,?,?) ON CONFLICT(user_id,id) DO NOTHING").bind(userId,round.id,JSON.stringify(round))));
        return json({ok:true,rounds:await readRounds(env.DB,userId)});
      }
      const match=path.match(/^\/api\/rounds\/([^/]+)\/(score|feedback)$/);
      if(match&&request.method==="PUT"){
        const data=await body(request),id=decodeURIComponent(match[1]);
        const existing=await env.DB.prepare("SELECT data FROM golfer_rounds WHERE user_id = ? AND id = ?").bind(userId,id).first();
        if(!existing)throw new InputError("Round not found.",404);
        const round=JSON.parse(existing.data);
        const score=match[2]==="score"?validateScore(data,round):null;
        const feedback=match[2]==="feedback"?validateFeedback(data,round):null;
        if(data.version!==round.version)throw new InputError("This score changed on another device. Close this form, refresh Rounds and reopen the score before editing.",409);
        round.version+=1;
        if(feedback)round.feedback=feedback;
        if(score){round.score=score;round.status="completed";}round.updatedAt=new Date().toISOString();
        const result=await env.DB.prepare("UPDATE golfer_rounds SET data = ? WHERE user_id = ? AND id = ? AND data = ?").bind(JSON.stringify(round),userId,id,existing.data).run();
        if(result.meta.changes!==1)throw new InputError("This score changed on another device. Refresh Rounds and try again.",409);
        return json({round});
      }
      return json({error:{message:"Not found."}},404);
    }catch(error){
      if(error instanceof InputError){const response=json({error:{message:error.message,requestId}},error.status);if(error.status===429)response.headers.set("Retry-After","60");return response;}
      console.error(JSON.stringify({event:"request_failed",requestId,method:request.method,route:path.replace(/\/rounds\/[^/]+/,"/rounds/:id"),errorType:error.name}));
      return json({error:{message:"We couldn’t complete that request. Try again or contact support with this reference.",requestId}},path==="/health"?503:500);
    }
  }
};
