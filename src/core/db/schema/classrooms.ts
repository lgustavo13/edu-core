import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { schools } from "./schools";
import { profiles } from "./profiles";

export const shiftEnum = pgEnum("shift", ["morning", "afternoon", "full"]);

export const classrooms = pgTable("classrooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  room: text("room"),
  iconKey: text("icon_key"),
  schoolYear: text("school_year").notNull(),
  shift: shiftEnum("shift").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Classroom = typeof classrooms.$inferSelect;
export type NewClassroom = typeof classrooms.$inferInsert;
