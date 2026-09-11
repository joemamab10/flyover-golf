import { InputError } from "../api/src/golfer/service.js";
export async function limitedJson(request){
  if(!request.headers.get("content-type")?.includes("application/json"))throw new InputError("Send a JSON request.",415);
  const reader=request.body?.getReader();if(!reader)throw new InputError("Missing request body.");
  let size=0;const chunks=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>200000){await reader.cancel();throw new InputError("This request is too large. Import up to 100 rounds at a time.",413);}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  try{const value=JSON.parse(new TextDecoder().decode(bytes));if(!value||typeof value!=="object"||Array.isArray(value))throw Error();return value;}catch{throw new InputError("Invalid JSON request.");}
}
export async function limitRequests(db,userId,now=Date.now()){
  const window=Math.floor(now/60000);
  const row=await db.prepare("INSERT INTO request_limits (user_id,window,count) VALUES (?,?,1) ON CONFLICT(user_id) DO UPDATE SET count=CASE WHEN window=excluded.window THEN count+1 ELSE 1 END, window=excluded.window RETURNING count").bind(userId,window).first();
  if(row.count>120)throw new InputError("Too many requests. Please wait a minute and try again.",429);
}
