export type Role = 'gestao' | 'professor' | 'aluno';

export type Weekday = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta';

export type OccurrenceType =
  | 'Falta'
  | 'Formação'
  | 'Saída Cedo'
  | 'Palestra Escolar'
  | 'Projeto'
  | 'Permuta';

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  color: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: string;
}

export interface GridSlot {
  id: string;
  weekday: Weekday;
  blockId: number;
  teacherId: string;
  subjectId: string;
  classId: string;
  scheduleId?: string;
}

export interface ScheduleVersion {
  id: string;
  name: string;
  isRegular: boolean;
  active: boolean;
  createdAt: string;
}

export interface Occurrence {
  id: string;
  weekday: Weekday;
  blockId: number;
  teacherId: string;
  classId: string;
  type: OccurrenceType;
  note: string;
  substituteTeacherId?: string | null;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  to: string;
  toName: string;
  subject: string;
  body: string;
  occurrenceId: string;
  sentAt: string;
}

export interface TimeBlock {
  id: number;
  label: string;
  start: string;
  end: string;
  isBreak: boolean;
}
