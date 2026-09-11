import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
export function database(){
  const sql=new DatabaseSync(":memory:");
  for(const file of readdirSync("drizzle").filter(file=>file.endsWith(".sql")))sql.exec(readFileSync(`drizzle/${file}`,"utf8"));
  const db={
    prepare(query){
      return {bind(...args){
        return {
          all:async()=>({results:sql.prepare(query).all(...args)}),
          first:async()=>sql.prepare(query).get(...args),
          run:async()=>({meta:{changes:Number(sql.prepare(query).run(...args).changes)}})
        };
      }};
    },
    async batch(statements){
      sql.exec("BEGIN");
      try{const results=[];for(const statement of statements)results.push(await statement.run());sql.exec("COMMIT");return results;}
      catch(error){sql.exec("ROLLBACK");throw error;}
    }
  };
  return {db,sql};
}
