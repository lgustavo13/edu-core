import type {
  Student,
  Guardian,
  StudentEnrollment,
  Classroom,
} from "@/core/db/schema";

export type StudentWithClassroom = Student & {
  currentClassroom: Pick<Classroom, "id" | "name" | "shift"> | null;
};

export type StudentProfile = Student & {
  currentClassroom: Pick<Classroom, "id" | "name" | "shift" | "room"> | null;
  guardians: Guardian[];
  enrollmentHistory: (StudentEnrollment & {
    classroom: Pick<Classroom, "id" | "name">;
  })[];
};

export type StudentSummary = Pick<
  Student,
  "id" | "fullName" | "birthDate" | "photoUrl" | "active"
> & {
  currentClassroom: Pick<Classroom, "id" | "name"> | null;
};
