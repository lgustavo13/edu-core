import { z } from "zod";

export const createStudentSchema = z.object({
  fullName: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(150, "Nome muito longo"),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida — use o formato YYYY-MM-DD"),
  gender: z
    .enum(["male", "female", "other", "not_informed"])
    .default("not_informed"),
  photoUrl: z.string().url("URL inválida").optional().or(z.literal("")),

  bloodType: z.string().max(5).optional(),
  pediatrician: z.string().max(200).optional(),
  medications: z.string().max(500).optional(),
  medicalAlerts: z.string().max(500).optional(),
  parentEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  classroomId: z.string().uuid("Turma inválida"),
});

export const updateStudentSchema = createStudentSchema
  .omit({ classroomId: true })
  .partial()
  .extend({
    id: z.string().uuid(),
  });

export const transferStudentSchema = z.object({
  studentId: z.string().uuid(),
  newClassroomId: z.string().uuid(),
  transferDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .default(() => new Date().toISOString().split("T")[0]),
});

export const guardianSchema = z.object({
  studentId: z.string().uuid(),
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(150),
  relationship: z.string().min(1, "Parentesco obrigatório").max(50),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type TransferStudentInput = z.infer<typeof transferStudentSchema>;
export type GuardianInput = z.infer<typeof guardianSchema>;
