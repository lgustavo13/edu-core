import { db } from "@/core/db";
import {
  students,
  guardians,
  studentEnrollments,
  classrooms,
  profiles,
} from "@/core/db/schema";
import { createSupabaseServerClient } from "@/core/lib/supabase/server";
import { eq, and, isNull, desc, asc } from "drizzle-orm";
import type {
  StudentProfile,
  StudentSummary,
  StudentWithClassroom,
} from "./types";

async function getAuthContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Usuário não autenticado");

  const profile = await db.query.profiles.findFirst({
    where: (profile, { eq }) => eq(profile.id, user.id),
    columns: { schoolId: true, role: true },
  });

  if (!profile) throw new Error("Perfil não encontrado");

  return { userId: user.id, schoolId: profile.schoolId, role: profile.role };
}

export async function getStudentsByClassroom(
  classroomId: string,
): Promise<StudentSummary[]> {
  const { userId } = await getAuthContext();
  const rows = await db
    .select({
      student: {
        id: students.id,
        fullName: students.fullName,
        birthDate: students.birthDate,
        photoUrl: students.photoUrl,
        active: students.active,
      },
      classroom: {
        id: classrooms.id,
        name: classrooms.name,
      },
    })
    .from(studentEnrollments)
    .innerJoin(students, eq(students.id, studentEnrollments.studentId))
    .innerJoin(classrooms, eq(classrooms.id, studentEnrollments.classroomId))
    .where(
      and(
        eq(studentEnrollments.classroomId, classroomId),
        isNull(studentEnrollments.leftAt),
        eq(classrooms.teacherId, userId),
        eq(students.active, true),
      ),
    )
    .orderBy(asc(students.fullName));

  return rows.map((row) => ({
    ...row.student,
    currentClassroom: row.classroom,
  }));
}

export async function getAllStudents(): Promise<StudentWithClassroom[]> {
  const { userId } = await getAuthContext();

  const rows = await db
    .select({
      student: students,
      classroom: {
        id: classrooms.id,
        name: classrooms.name,
        shift: classrooms.shift,
      },
    })
    .from(students)
    .leftJoin(
      studentEnrollments,
      and(
        eq(studentEnrollments.studentId, students.id),
        isNull(studentEnrollments.leftAt),
      ),
    )
    .leftJoin(classrooms, eq(classrooms.id, studentEnrollments.classroomId))
    .where(and(eq(students.active, true), eq(classrooms.teacherId, userId)))
    .orderBy(asc(students.fullName));

  return rows.map((row) => ({
    ...row.student,
    currentClassroom: row.classroom ?? null,
  }));
}

export async function getStudentProfile(
  studentId: string,
): Promise<StudentProfile | null> {
  const { userId } = await getAuthContext();

  const student = await db.query.students.findFirst({
    where: (student, { eq, and }) =>
      and(eq(student.id, studentId), eq(student.active, true)),
  });

  if (!student) return null;

  const currentEnrollment = await db
    .select({
      id: studentEnrollments.id,
      enrolledAt: studentEnrollments.enrolledAt,
      leftAt: studentEnrollments.leftAt,
      classroom: {
        id: classrooms.id,
        name: classrooms.name,
        shift: classrooms.shift,
        room: classrooms.room,
      },
    })
    .from(studentEnrollments)
    .innerJoin(classrooms, eq(classrooms.id, studentEnrollments.classroomId))
    .where(
      and(
        eq(studentEnrollments.studentId, studentId),
        isNull(studentEnrollments.leftAt),
        eq(classrooms.teacherId, userId),
      ),
    )
    .limit(1);

  if (currentEnrollment.length === 0) return null;

  const studentGuardians = await db
    .select()
    .from(guardians)
    .where(eq(guardians.studentId, studentId))
    .orderBy(asc(guardians.createdAt));

  const history = await db
    .select({
      id: studentEnrollments.id,
      studentId: studentEnrollments.studentId,
      classroomId: studentEnrollments.classroomId,
      enrolledAt: studentEnrollments.enrolledAt,
      leftAt: studentEnrollments.leftAt,
      createdAt: studentEnrollments.createdAt,
      classroom: {
        id: classrooms.id,
        name: classrooms.name,
      },
    })
    .from(studentEnrollments)
    .innerJoin(classrooms, eq(classrooms.id, studentEnrollments.classroomId))
    .where(eq(studentEnrollments.studentId, studentId))
    .orderBy(desc(studentEnrollments.enrolledAt));

  return {
    ...student,
    currentClassroom: currentEnrollment[0]?.classroom ?? null,
    guardians: studentGuardians,
    enrollmentHistory: history,
  };
}
