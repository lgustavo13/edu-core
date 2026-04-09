import { pgTable, uuid, date, timestamp, unique } from "drizzle-orm/pg-core";
import { students } from "./students";
import { classrooms } from "./classrooms";

export const studentEnrollments = pgTable(
  "student_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    classroomId: uuid("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "restrict" }),
    enrolledAt: date("enrolled_at").notNull(),
    leftAt: date("left_at"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueActiveEnrollment: unique("unique_active_enrollment").on(
      table.studentId,
      table.leftAt,
    ),
  }),
);

export type StudentEnrollment = typeof studentEnrollments.$inferSelect;
export type NewStudentEnrollment = typeof studentEnrollments.$inferInsert;
