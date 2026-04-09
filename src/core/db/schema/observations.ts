import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { students } from "./students";
import { profiles } from "./profiles";

export const observationCategoryEnum = pgEnum("observation_category", [
  "cognitive",
  "social",
  "nutrition",
  "health",
  "motor",
  "emotional",
  "other",
]);

export const observations = pgTable("observations", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "restrict" }),
  title: text("title"),
  content: text("content").notNull(),
  category: observationCategoryEnum("category").notNull().default("other"),
  mediaUrl: text("media_url"),
  isPrivate: boolean("is_private").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Observation = typeof observations.$inferSelect;
export type NewObservation = typeof observations.$inferInsert;
