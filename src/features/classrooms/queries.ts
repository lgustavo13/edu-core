import { db } from "@/core/db";
import { classrooms, studentEnrollments, observations } from "@/core/db/schema";
import { createSupabaseServerClient } from "@/core/lib/supabase/server";
import { eq, and, isNull, count, max, desc } from "drizzle-orm";
import type { ClassroomWithStats } from "./types";

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

export async function getClassrooms(): Promise<ClassroomWithStats[]> {
  const { userId } = await getAuthContext();

  const rows = await db
    .select({
      classroom: classrooms,
      studentCount: count(studentEnrollments.id),
      lastObservationAt: max(observations.createdAt),
    })
    .from(classrooms)
    .leftJoin(
      studentEnrollments,
      and(
        eq(studentEnrollments.classroomId, classrooms.id),
        isNull(studentEnrollments.leftAt),
      ),
    )
    .leftJoin(
      observations,
      eq(observations.studentId, studentEnrollments.studentId),
    )
    .where(eq(classrooms.teacherId, userId))
    .groupBy(classrooms.id)
    .orderBy(desc(classrooms.createdAt));

  return rows.map((row) => ({
    ...row.classroom,
    studentCount: Number(row.studentCount),
    lastObservationAt: row.lastObservationAt ?? null,
  }));
}

export async function getClassroomById(id: string) {
  const { userId } = await getAuthContext();

  const classroom = await db.query.classrooms.findFirst({
    where: (room, { eq, and }) =>
      and(eq(room.id, id), eq(room.teacherId, userId)),
  });

  return classroom ?? null;
}
