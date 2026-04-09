import { z } from "zod";

export const createClassroomSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  room: z.string().max(50).optional(),
  iconKey: z.string().optional(),
  schoolYear: z.string().regex(/^\d{4}$/, "Ano letivo inválido"),
  shift: z.enum(["morning", "afternoon", "full"], {
    message: "Período inválido",
  }),
  description: z.string().max(1000).optional(),
});

export const updateClassroomSchema = createClassroomSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type UpdateClassroomInput = z.infer<typeof updateClassroomSchema>;
