import {
  pgTable,
  uuid,
  integer,
  date,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { students } from "./students";
import { profiles } from "./profiles";

export const developmentRecords = pgTable(
  "development_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    referenceMonth: date("reference_month").notNull(),

    socialInteraction: integer("social_interaction"),
    focusAttention: integer("focus_attention"),
    motorCoordination: integer("motor_coordination"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueStudentMonth: unique("unique_student_month").on(
      table.studentId,
      table.referenceMonth,
    ),
  }),
);

export type DevelopmentRecord = typeof developmentRecords.$inferSelect;
export type NewDevelopmentRecord = typeof developmentRecords.$inferInsert;
