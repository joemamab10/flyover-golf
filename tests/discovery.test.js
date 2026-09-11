import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../shared/catalog.json' with {type:'json'};
import {discover,localDate,validDate} from '../shared/discovery.js';
import {validateRound} from '../api/src/golfer/service.js';
test('verified directory excludes unverified courses and offers no sample availability',()=>{
 const rows=discover(catalog);assert.equal(rows.length,8);assert.ok(!rows.some(row=>row.id==='beaver-creek'));
 assert.deepEqual(rows.map(row=>row.name),rows.map(row=>row.name).sort((a,b)=>a.localeCompare(b)));
 for(const row of rows){assert.equal(new URL(row.website).protocol,'https:');for(const key of ['price','times','rating','weather','drive'])assert.equal(row[key],undefined);assert.equal(validateRound({courseId:row.id,date:'2026-08-01',holes:18}).courseId,row.id);}
 assert.equal(discover(catalog,{city:'Ankeny, IA'}).length,1);
});
test('latest private review wins, including legacy course identifiers',()=>{
 const rounds=[{courseId:'legacy-norwalk',status:'completed',date:'2026-07-01',feedback:{playAgain:'yes'}},{courseId:'legacy',status:'completed',date:'2026-08-01',feedback:{playAgain:'no'}}];
 assert.equal(discover(catalog,{},rounds).at(-1).id,'legacy');
 assert.equal(validateRound({courseId:'legacy-norwalk',date:'2026-08-01',holes:18}).courseId,'legacy');
 assert.equal(validateRound({courseId:'tci-polk-city',date:'2026-08-01',holes:18}).courseId,'tci');
});
test('calendar input rejects impossible dates and uses browser calendar components',()=>{
 assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2026-12-01'),true);
 assert.equal(localDate({getFullYear:()=>2026,getMonth:()=>8,getDate:()=>10}),'2026-09-10');
});
