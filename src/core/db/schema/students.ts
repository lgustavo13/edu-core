import {
  pgTable,
  uuid,
  text,
  date,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { schools } from "./schools";

export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "other",
  "not_informed",
]);

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  birthDate: date("birth_date").notNull(),
  gender: genderEnum("gender").notNull().default("not_informed"),
  photoUrl: text("photo_url"),

  bloodType: text("blood_type"),
  pediatrician: text("pediatrician"),
  medications: text("medications"),
  medicalAlerts: text("medical_alerts"),

  parentEmail: text("parent_email"),

  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
