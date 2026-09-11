import { sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
export const rounds = sqliteTable("golfer_rounds", {
  userId: text("user_id").notNull(),
  id: text("id").notNull(),
  data: text("data").notNull(),
}, table => [primaryKey({columns:[table.userId,table.id]})]);
export const profiles = sqliteTable("golfer_profiles", {
  userId: text("user_id").primaryKey(),
  data: text("data").notNull(),
});
