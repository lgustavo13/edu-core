import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  date,
  time,
  pgEnum,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("user_role", ["teacher", "director", "parent"]);
export const periodEnum = pgEnum("class_period", [
  "morning",
  "afternoon",
  "full_time",
]);
export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "other",
  "not_specified",
]);
export const eventCategoryEnum = pgEnum("event_category", [
  "holiday",
  "school_event",
  "birthday",
]);
export const obsCategoryEnum = pgEnum("observation_category", [
  "cognitive",
  "social",
  "physical",
  "nutrition",
  "sleep",
  "development",
  "general",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  role: roleEnum("role").default("teacher").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  teacherId: uuid("teacher_id")
    .references(() => users.id, { onDelete: "restrict" })
    .notNull(),
  name: text("name").notNull(),
  period: periodEnum("period").notNull(),
  room: text("room"),
  icon: text("icon"),
  pedagogicalObjectives: text("pedagogical_objectives"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id")
    .references(() => classes.id, { onDelete: "restrict" })
    .notNull(),
  registrationNumber: varchar("registration_number", { length: 50 }).unique(),
  fullName: text("full_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: genderEnum("gender").notNull(),
  avatarUrl: text("avatar_url"),
  bloodType: varchar("blood_type", { length: 5 }),
  pediatricianName: text("pediatrician_name"),
  pediatricianPhone: varchar("pediatrician_phone", { length: 20 }),
  medicalAlerts: text("medical_alerts"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studentGuardians = pgTable("student_guardians", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .references(() => students.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  isEmergencyContact: boolean("is_emergency_contact").default(false),
});

export const observations = pgTable("observations", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .references(() => students.id, { onDelete: "cascade" })
    .notNull(),
  teacherId: uuid("teacher_id")
    .references(() => users.id, { onDelete: "restrict" })
    .notNull(),
  category: obsCategoryEnum("category").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  description: text("description").notNull(),
  internalNote: text("internal_note"),
  mediaUrls: text("media_urls").array(),
  sharedWithParents: boolean("shared_with_parents").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .references(() => students.id, { onDelete: "cascade" })
    .notNull(),
  classId: uuid("class_id")
    .references(() => classes.id, { onDelete: "cascade" })
    .notNull(),
  date: date("date").defaultNow().notNull(),
  isPresent: boolean("is_present").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").references(() => classes.id, {
    onDelete: "cascade",
  }),
  title: text("title").notNull(),
  category: eventCategoryEnum("category").notNull(),
  eventDate: date("event_date").notNull(),
  eventTime: time("event_time"),
  location: text("location"),
  description: text("description"),
  notifyParents: boolean("notify_parents").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  classes: many(classes),
  observations: many(observations),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  teacher: one(users, {
    fields: [classes.teacherId],
    references: [users.id],
  }),
  students: many(students),
  events: many(events),
  attendance: many(attendance),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  class: one(classes, {
    fields: [students.classId],
    references: [classes.id],
  }),
  guardians: many(studentGuardians),
  observations: many(observations),
  attendance: many(attendance),
}));
