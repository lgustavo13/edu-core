import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { schools } from "./schools";

export const roleEnum = pgEnum("role", ["director", "teacher", "parent"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  avatarUrl: text("avatar_url"),
  role: roleEnum("role").notNull().default("teacher"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
