"use server";

import { db } from "@/core/db";
import { classrooms } from "@/core/db/schema";
import { createSupabaseServerClient } from "@/core/lib/supabase/server";
import {
  createClassroomSchema,
  updateClassroomSchema,
  type CreateClassroomInput,
  type UpdateClassroomInput,
} from "@/core/lib/validations/classroom";
import { eq, and } from "drizzle-orm";
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

export async function createClassroom(input: CreateClassroomInput) {
  const { data: auth, error: authError } = await getAuthContext();
  if (authError || !auth) return { error: authError, data: null };

  const parsed = createClassroomSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors, data: null };
  }

  try {
    const [classroom] = await db
      .insert(classrooms)
      .values({
        ...parsed.data,
        schoolId: auth.schoolId,
        teacherId: auth.userId,
      })
      .returning();

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/classrooms");

    return { data: classroom, error: null };
  } catch (err) {
    console.error("createClassroom error:", err);
    return { error: "Erro ao criar turma", data: null };
  }
}

export async function updateClassroom(input: UpdateClassroomInput) {
  const { data: auth, error: authError } = await getAuthContext();
  if (authError || !auth) return { error: authError, data: null };

  const parsed = updateClassroomSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors, data: null };
  }

  const { id, ...fields } = parsed.data;

  try {
    const [classroom] = await db
      .update(classrooms)
      .set({ ...fields, updatedAt: new Date() })
      .where(and(eq(classrooms.id, id), eq(classrooms.teacherId, auth.userId)))
      .returning();

    if (!classroom) return { error: "Turma não encontrada", data: null };

    revalidatePath("/dashboard/classrooms");
    revalidatePath(`/dashboard/classrooms/${id}`);

    return { data: classroom, error: null };
  } catch (err) {
    console.error("updateClassroom error:", err);
    return { error: "Erro ao atualizar turma", data: null };
  }
}

export async function deleteClassroom(id: string) {
  const { data: auth, error: authError } = await getAuthContext();
  if (authError || !auth) return { error: authError, data: null };

  try {
    const [deleted] = await db
      .delete(classrooms)
      .where(and(eq(classrooms.id, id), eq(classrooms.teacherId, auth.userId)))
      .returning({ id: classrooms.id });

    if (!deleted) return { error: "Turma não encontrada", data: null };

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/classrooms");

    return { data: deleted, error: null };
  } catch (err) {
    console.error("deleteClassroom error:", err);
    return { error: "Erro ao deletar turma", data: null };
  }
}
