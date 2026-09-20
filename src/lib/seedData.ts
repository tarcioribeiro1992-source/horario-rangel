import type {
  Teacher,
  Subject,
  SchoolClass,
  GridSlot,
  Occurrence,
  EmailLog,
} from '@/types';

export const SEED_TEACHERS: Teacher[] = [];

export const SEED_SUBJECTS: Subject[] = [];

export const SEED_CLASSES: SchoolClass[] = [];

function slot(
  weekday: 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta',
  blockId: number,
  teacherId: string,
  subjectId: string,
  classId: string,
): GridSlot {
  return { id: `${weekday}-${blockId}-${teacherId}-${classId}`, weekday, blockId, teacherId, subjectId, classId };
}

export const SEED_GRID: GridSlot[] = [];

export const SEED_OCCURRENCES: Occurrence[] = [];

export const SEED_EMAIL_LOGS: EmailLog[] = [];
