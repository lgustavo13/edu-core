import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { students } from "./students";
import { profiles } from "./profiles";

export const behaviorRecords = pgTable(
  "behavior_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    date: date("date").notNull(),
    emoji: text("emoji").notNull(),
    label: text("label").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueStudentDate: unique("unique_student_date").on(
      table.studentId,
      table.date,
    ),
  }),
);

export type BehaviorRecord = typeof behaviorRecords.$inferSelect;
export type NewBehaviorRecord = typeof behaviorRecords.$inferInsert;
