"use server";

import { db } from "@/core/db";
import {
  students,
  studentEnrollments,
  guardians,
  classrooms,
} from "@/core/db/schema";
import { createSupabaseServerClient } from "@/core/lib/supabase/server";
import {
  createStudentSchema,
  updateStudentSchema,
  transferStudentSchema,
  guardianSchema,
  type CreateStudentInput,
  type UpdateStudentInput,
  type TransferStudentInput,
  type GuardianInput,
} from "@/core/lib/validations/student";
import { eq, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function getAuthContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { error: "Não autenticado", data: null };

  const profile = await db.query.profiles.findFirst({
    where: (profile, { eq }) => eq(profile.id, user.id),
    columns: { schoolId: true, role: true },
  });

  if (!profile) return { error: "Perfil não encontrado", data: null };

  return {
    data: { userId: user.id, schoolId: profile.schoolId, role: profile.role },
    error: null,
  };
}

export async function createStudent(input: CreateStudentInput) {
  const { data: auth, error: authError } = await getAuthContext();
  if (authError || !auth) return { error: authError, data: null };

  const parsed = createStudentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors, data: null };
  }

  const { classroomId, ...studentData } = parsed.data;

  const classroom = await db.query.classrooms.findFirst({
    where: (classroom, { eq, and }) =>
      and(eq(classroom.id, classroomId), eq(classroom.teacherId, auth.userId)),
    columns: { id: true },
  });

  if (!classroom) {
    return { error: "Turma não encontrada ou sem permissão", data: null };
  }

  try {
    const result = await db.transaction(async (transaction) => {
      const [student] = await transaction
        .insert(students)
        .values({
          ...studentData,
          schoolId: auth.schoolId,
          photoUrl: studentData.photoUrl || null,
          parentEmail: studentData.parentEmail || null,
        })
        .returning();

      await transaction.insert(studentEnrollments).values({
        studentId: student.id,
        classroomId,
        enrolledAt: new Date().toISOString().split("T")[0],
      });

      return student;
    });

    revalidatePath(`/dashboard/classrooms/${classroomId}`);
    revalidatePath("/dashboard");

    return { data: result, error: null };
  } catch (err) {
    console.error("createStudent error:", err);
    return { error: "Erro ao criar aluno", data: null };
  }
}

export async function updateStudent(input: UpdateStudentInput) {
  const { data: auth, error: authError } = await getAuthContext();
  if (authError || !auth) return { error: authError, data: null };

  const parsed = updateStudentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors, data: null };
  }

  const { id, ...fields } = parsed.data;

  const enrollment = await db
    .select({ studentId: studentEnrollments.studentId })
    .from(studentEnrollments)
    .innerJoin(classrooms, eq(classrooms.id, studentEnrollments.classroomId))
    .where(
      and(
        eq(studentEnrollments.studentId, id),
        isNull(studentEnrollments.leftAt),
        eq(classrooms.teacherId, auth.userId),
      ),
    )
    .limit(1);

  if (enrollment.length === 0) {
    return { error: "Aluno não encontrado ou sem permissão", data: null };
  }

  try {
    const [student] = await db
      .update(students)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();

    revalidatePath(`/dashboard/students/${id}`);

    return { data: student, error: null };
  } catch (err) {
    console.error("updateStudent error:", err);
    return { error: "Erro ao atualizar aluno", data: null };
  }
}

export async function deactivateStudent(studentId: string) {
  const { data: auth, error: authError } = await getAuthContext();
  if (authError || !auth) return { error: authError, data: null };

  try {
    const [student] = await db
      .update(students)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(students.id, studentId))
      .returning({ id: students.id });

    if (!student) return { error: "Aluno não encontrado", data: null };

    revalidatePath("/dashboard");

    return { data: student, error: null };
  } catch (err) {
    console.error("deactivateStudent error:", err);
    return { error: "Erro ao desativar aluno", data: null };
  }
}

export async function transferStudent(input: TransferStudentInput) {
  const { data: auth, error: authError } = await getAuthContext();
  if (authError || !auth) return { error: authError, data: null };

  const parsed = transferStudentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors, data: null };
  }

  const { studentId, newClassroomId, transferDate } = parsed.data;

  const newClassroom = await db.query.classrooms.findFirst({
    where: (classroom, { eq, and }) =>
      and(
        eq(classroom.id, newClassroomId),
        eq(classroom.teacherId, auth.userId),
      ),
    columns: { id: true },
  });

  if (!newClassroom) {
    return {
      error: "Turma de destino não encontrada ou sem permissão",
      data: null,
    };
  }

  try {
    await db.transaction(async (transaction) => {
      await transaction
        .update(studentEnrollments)
        .set({ leftAt: transferDate })
        .where(
          and(
            eq(studentEnrollments.studentId, studentId),
            isNull(studentEnrollments.leftAt),
          ),
        );

      await transaction.insert(studentEnrollments).values({
        studentId,
        classroomId: newClassroomId,
        enrolledAt: transferDate,
      });
    });

    revalidatePath(`/dashboard/students/${studentId}`);
    revalidatePath(`/dashboard/classrooms/${newClassroomId}`);

    return { data: { studentId, newClassroomId }, error: null };
  } catch (err) {
    console.error("transferStudent error:", err);
    return { error: "Erro ao transferir aluno", data: null };
  }
}

export async function addGuardian(input: GuardianInput) {
  const { data: auth, error: authError } = await getAuthContext();
  if (authError || !auth) return { error: authError, data: null };

  const parsed = guardianSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors, data: null };
  }

  try {
    const [guardian] = await db
      .insert(guardians)
      .values({
        ...parsed.data,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
      })
      .returning();

    revalidatePath(`/dashboard/students/${parsed.data.studentId}`);

    return { data: guardian, error: null };
  } catch (err) {
    console.error("addGuardian error:", err);
    return { error: "Erro ao adicionar responsável", data: null };
  }
}

export async function removeGuardian(guardianId: string) {
  const { data: auth, error: authError } = await getAuthContext();
  if (authError || !auth) return { error: authError, data: null };

  try {
    const [deleted] = await db
      .delete(guardians)
      .where(eq(guardians.id, guardianId))
      .returning({ id: guardians.id, studentId: guardians.studentId });

    if (!deleted) return { error: "Responsável não encontrado", data: null };

    revalidatePath(`/dashboard/students/${deleted.studentId}`);

    return { data: deleted, error: null };
  } catch (err) {
    console.error("removeGuardian error:", err);
    return { error: "Erro ao remover responsável", data: null };
  }
}

export async function updateGuardian(
  guardianId: string,
  input: Omit<GuardianInput, "studentId">,
) {
  const { data: auth, error: authError } = await getAuthContext();
  if (authError || !auth) return { error: authError, data: null };

  const parsed = guardianSchema.omit({ studentId: true }).safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors, data: null };
  }

  try {
    const [guardian] = await db
      .update(guardians)
      .set({
        ...parsed.data,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
      })
      .where(eq(guardians.id, guardianId))
      .returning();

    if (!guardian) return { error: "Responsável não encontrado", data: null };

    revalidatePath(`/dashboard/students/${guardian.studentId}`);

    return { data: guardian, error: null };
  } catch (err) {
    console.error("updateGuardian error:", err);
    return { error: "Erro ao atualizar responsável", data: null };
  }
}
