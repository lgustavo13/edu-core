import type { Classroom } from "@/core/db/schema";

export type ClassroomWithStats = Classroom & {
  studentCount: number;
  lastObservationAt: Date | null;
};
