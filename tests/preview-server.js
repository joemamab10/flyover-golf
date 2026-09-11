// Isolated browser-test harness only; never included in the hosted Worker build.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { database } from "./database.js";
import worker from "../dist/server/index.js";
const {db}=database();
const assets={async fetch(request){
  const url=new URL(request.url),path=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname;
  const root=resolve('dist/client'),file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/'))return new Response('Not found',{status:404});
  try{return new Response(await readFile(file),{headers:{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(file)]||'application/octet-stream'}});}catch{return new Response('Not found',{status:404});}
}};
createServer(async(req,res)=>{
 try{
  const headers=new Headers(req.headers);
  headers.delete('oai-authenticated-user-id');headers.delete('oai-authenticated-user-email');
  const user=(req.headers.cookie||'').match(/test-golfer=(alice|bob)/)?.[1];
  if(user){headers.set('oai-authenticated-user-id',user);headers.set('oai-authenticated-user-email',user+'@example.com');}
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const request=new Request('http://127.0.0.1:8082'+req.url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
  const result=await worker.fetch(request,{DB:db,ASSETS:assets});
  res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
 }catch(error){res.writeHead(500);res.end(error.message);}
}).listen(8082,'127.0.0.1',()=>console.log('Isolated cloud test preview: http://127.0.0.1:8082'));
