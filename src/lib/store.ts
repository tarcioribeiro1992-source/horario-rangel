import { useState, useEffect, useCallback } from 'react';
import type {
  Teacher,
  Subject,
  SchoolClass,
  GridSlot,
  Occurrence,
  EmailLog,
  Role,
  Weekday,
  OccurrenceType,
} from '@/types';
import {
  SEED_TEACHERS,
  SEED_SUBJECTS,
  SEED_CLASSES,
  SEED_GRID,
  SEED_OCCURRENCES,
  SEED_EMAIL_LOGS,
} from '@/lib/seedData';

const STORAGE_KEY = 'horariorangel_db_v1';

interface DB {
  teachers: Teacher[];
  subjects: Subject[];
  classes: SchoolClass[];
  grid: GridSlot[];
  occurrences: Occurrence[];
  emailLogs: EmailLog[];
}

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    // ignore
  }
  return {
    teachers: SEED_TEACHERS,
    subjects: SEED_SUBJECTS,
    classes: SEED_CLASSES,
    grid: SEED_GRID,
    occurrences: SEED_OCCURRENCES,
    emailLogs: SEED_EMAIL_LOGS,
  };
}

function saveDB(db: DB) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export interface Collision {
  type: 'teacher' | 'class';
  message: string;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function useStore() {
  const [db, setDb] = useState<DB>(loadDB);
  const [role, setRole] = useState<Role>('gestao');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('t1');

  useEffect(() => {
    saveDB(db);
  }, [db]);

  // Teachers
  const addTeacher = useCallback((name: string, email: string, color: string) => {
    setDb((prev) => ({
      ...prev,
      teachers: [...prev.teachers, { id: uid(), name, email, color }],
    }));
  }, []);

  const updateTeacher = useCallback((id: string, name: string, email: string, color: string) => {
    setDb((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => (t.id === id ? { ...t, name, email, color } : t)),
    }));
  }, []);

  const deleteTeacher = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      teachers: prev.teachers.filter((t) => t.id !== id),
      grid: prev.grid.filter((s) => s.teacherId !== id),
    }));
  }, []);

  // Subjects
  const addSubject = useCallback((name: string, color: string) => {
    setDb((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { id: uid(), name, color }],
    }));
  }, []);

  const updateSubject = useCallback((id: string, name: string, color: string) => {
    setDb((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === id ? { ...s, name, color } : s)),
    }));
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== id),
    }));
  }, []);

  // Classes
  const addClass = useCallback((name: string, grade: string) => {
    setDb((prev) => ({
      ...prev,
      classes: [...prev.classes, { id: uid(), name, grade }],
    }));
  }, []);

  const updateClass = useCallback((id: string, name: string, grade: string) => {
    setDb((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === id ? { ...c, name, grade } : c)),
    }));
  }, []);

  const deleteClass = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== id),
      grid: prev.grid.filter((s) => s.classId !== id),
    }));
  }, []);

  // Grid
  const addGridSlot = useCallback(
    (weekday: Weekday, blockId: number, teacherId: string, subjectId: string, classId: string) => {
      setDb((prev) => ({
        ...prev,
        grid: [...prev.grid, { id: uid(), weekday, blockId, teacherId, subjectId, classId }],
      }));
    },
    [],
  );

  const updateGridSlot = useCallback(
    (id: string, teacherId: string, subjectId: string, classId: string) => {
      setDb((prev) => ({
        ...prev,
        grid: prev.grid.map((s) => (s.id === id ? { ...s, teacherId, subjectId, classId } : s)),
      }));
    },
    [],
  );

  const deleteGridSlot = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      grid: prev.grid.filter((s) => s.id !== id),
    }));
  }, []);

  // Occurrences
  const checkCollisions = useCallback(
    (
      weekday: Weekday,
      blockId: number,
      teacherId: string,
      classId: string,
      excludeOccurrenceId?: string,
    ): Collision[] => {
      const collisions: Collision[] = [];

      // Check existing grid: is this teacher already assigned elsewhere at this time?
      const teacherGridSlots = db.grid.filter(
        (s) => s.weekday === weekday && s.blockId === blockId && s.teacherId === teacherId,
      );
      const teacherOtherClasses = teacherGridSlots.filter((s) => s.classId !== classId);
      if (teacherOtherClasses.length > 0) {
        const otherClass = db.classes.find((c) => c.id === teacherOtherClasses[0].classId);
        collisions.push({
          type: 'teacher',
          message: `Professor já alocado na turma ${otherClass?.name ?? 'outra'} neste horário`,
        });
      }

      // Check existing grid: is this class already assigned to another teacher?
      const classGridSlots = db.grid.filter(
        (s) => s.weekday === weekday && s.blockId === blockId && s.classId === classId,
      );
      const classOtherTeachers = classGridSlots.filter((s) => s.teacherId !== teacherId);
      if (classOtherTeachers.length > 0) {
        const otherTeacher = db.teachers.find((t) => t.id === classOtherTeachers[0].teacherId);
        collisions.push({
          type: 'class',
          message: `Turma já possui aula com ${otherTeacher?.name ?? 'outro professor'} neste horário`,
        });
      }

      // Check existing occurrences for same teacher at same time (excluding self)
      const teacherOcc = db.occurrences.filter(
        (o) =>
          o.weekday === weekday &&
          o.blockId === blockId &&
          o.teacherId === teacherId &&
          o.id !== excludeOccurrenceId,
      );
      if (teacherOcc.length > 0) {
        collisions.push({
          type: 'teacher',
          message: `Professor já possui ocorrência registrada neste horário (${teacherOcc[0].type})`,
        });
      }

      // Check substitute teacher collisions
      const subOcc = db.occurrences.filter(
        (o) =>
          o.weekday === weekday &&
          o.blockId === blockId &&
          o.substituteTeacherId === teacherId &&
          o.id !== excludeOccurrenceId,
      );
      if (subOcc.length > 0) {
        collisions.push({
          type: 'teacher',
          message: `Professor já está como substituto em outra ocorrência neste horário`,
        });
      }

      return collisions;
    },
    [db.grid, db.occurrences, db.classes, db.teachers],
  );

  const addOccurrence = useCallback(
    (data: Omit<Occurrence, 'id' | 'createdAt'>) => {
      const id = uid();
      const occurrence: Occurrence = {
        ...data,
        id,
        createdAt: new Date().toISOString(),
      };

      const teacher = db.teachers.find((t) => t.id === data.teacherId);
      const subTeacher = db.teachers.find((t) => t.id === data.substituteTeacherId);
      const schoolClass = db.classes.find((c) => c.id === data.classId);

      const emailLog: EmailLog = {
        id: uid(),
        to: teacher?.email ?? '',
        toName: teacher?.name ?? '',
        subject: `HorárioRangel — Ocorrência: ${data.type}`,
        body: buildEmailBody(occurrence, teacher, subTeacher, schoolClass),
        occurrenceId: id,
        sentAt: new Date().toISOString(),
      };

      setDb((prev) => ({
        ...prev,
        occurrences: [occurrence, ...prev.occurrences],
        emailLogs: [emailLog, ...prev.emailLogs],
      }));

      return emailLog;
    },
    [db.teachers, db.classes],
  );

  const deleteOccurrence = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      occurrences: prev.occurrences.filter((o) => o.id !== id),
    }));
  }, []);

  const resetDB = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setDb(loadDB());
  }, []);

  return {
    ...db,
    role,
    setRole,
    selectedTeacherId,
    setSelectedTeacherId,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addSubject,
    updateSubject,
    deleteSubject,
    addClass,
    updateClass,
    deleteClass,
    addGridSlot,
    updateGridSlot,
    deleteGridSlot,
    checkCollisions,
    addOccurrence,
    deleteOccurrence,
    resetDB,
  };
}

function buildEmailBody(
  occ: Occurrence,
  teacher?: Teacher,
  subTeacher?: Teacher,
  schoolClass?: { name: string; grade: string },
): string {
  const weekdayMap: Record<string, string> = {
    segunda: 'Segunda-feira',
    terca: 'Terça-feira',
    quarta: 'Quarta-feira',
    quinta: 'Quinta-feira',
    sexta: 'Sexta-feira',
  };

  const lines = [
    `Prezado(a) ${teacher?.name ?? 'Professor(a)'},`,
    '',
    `Uma ocorrência foi registrada em sua agenda:`,
    '',
    `  Tipo: ${occ.type}`,
    `  Dia: ${weekdayMap[occ.weekday]}`,
    `  Horário: Bloco ${occ.blockId}`,
    `  Turma: ${schoolClass?.name ?? 'N/A'}`,
    occ.note ? `  Observação: ${occ.note}` : '',
    subTeacher ? `  Professor substituto: ${subTeacher.name}` : '  Sem professor substituto designado.',
    '',
    `Por favor, entre em contato com a Gestão Pedagógica caso tenha dúvidas.`,
    '',
    `Atenciosamente,`,
    `Equipe HorárioRangel`,
  ];
  return lines.filter(Boolean).join('\n');
}

export type Store = ReturnType<typeof useStore>;
