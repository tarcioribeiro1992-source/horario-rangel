import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import type {
  Teacher,
  Subject,
  SchoolClass,
  GridSlot,
  Occurrence,
  EmailLog,
  Role,
  Weekday,
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

function buildEmailBody(occ: any, teacher: any, subTeacher: any, schoolClass: any) {
  return `Olá, ${teacher?.name || 'Professor'}.\nHouve uma alteração de horário marcada como: ${occ.type}.\nMotivo: ${occ.motivo || 'Não informado'}.\nPor favor, consulte o aplicativo HorárioRangel para mais informações.`;
}

export function useStore() {
  const [db, setDb] = useState<DB>(loadDB);
  const [role, setRole] = useState<Role>('gestao');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('t1');

  useEffect(() => {
    async function syncWithCloud() {
      try {
        const { data: cloudTeachers } = await supabase.from('professores').select('*');
        if (cloudTeachers && cloudTeachers.length > 0) {
          const formattedTeachers: Teacher[] = cloudTeachers.map((t: any) => ({
            id: t.id,
            name: t.nome,
            email: t.email,
            phone: t.telefone || '',
            color: '#2563eb'
          }));
          setDb(prev => ({ ...prev, teachers: formattedTeachers }));
        }
      } catch (err) {
        console.warn('Usando modo local offline.');
      }
    }
    syncWithCloud();
  }, []);

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const addTeacher = useCallback((name: string, email: string, phone: string, color: string) => {
    const newId = uid();
    setDb((prev) => ({
      ...prev,
      teachers: [...prev.teachers, { id: newId, name, email, phone, color }],
    }));
    supabase.from('professores').insert([{ id: newId, nome: name, email, telefone: phone }]).then();
  }, []);

  const updateTeacher = useCallback((id: string, name: string, email: string, phone: string, color: string) => {
    setDb((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => (t.id === id ? { ...t, name, email, phone, color } : t)),
    }));
    supabase.from('professores').update({ nome: name, email, telefone: phone }).eq('id', id).then();
  }, []);

  const deleteTeacher = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      teachers: prev.teachers.filter((t) => t.id !== id),
      grid: prev.grid.filter((s) => s.teacherId !== id),
    }));
    supabase.from('professores').delete().eq('id', id).then();
  }, []);

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

  const addGridSlot = useCallback(
    (weekday: Weekday, blockId: number, teacherId: string, subjectId: string, classId: string) => {
      const newId = uid();
      setDb((prev) => ({
        ...prev,
        grid: [...prev.grid, { id: newId, weekday, blockId, teacherId, subjectId, classId }],
      }));
      supabase.from('grade_horaria').insert([{ id: newId, dia_semana: weekday, bloco_horario: String(blockId), professor_id: teacherId, disciplina: subjectId, turma: classId }]).then();
    },
    [],
  );

  const updateGridSlot = useCallback(
    (id: string, teacherId: string, subjectId: string, classId: string) => {
      setDb((prev) => ({
        ...prev,
        grid: prev.grid.map((s) => (s.id === id ? { ...s, teacherId, subjectId, classId } : s)),
      }));
      supabase.from('grade_horaria').update({ professor_id: teacherId, disciplina: subjectId, turma: classId }).eq('id', id).then();
    },
    [],
  );

  const deleteGridSlot = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      grid: prev.grid.filter((s) => s.id !== id),
    }));
    supabase.from('grade_horaria').delete().eq('id', id).then();
  }, []);

  const checkCollisions = useCallback(
    (
      weekday: Weekday,
      blockId: number,
      teacherId: string,
      classId: string,
      excludeOccurrenceId?: string,
    ): Collision[] => {
      const collisions: Collision[] = [];

      const teacherGridSlots = db.grid.filter(
        (s) => s.weekday === weekday && s.blockId === blockId && s.teacherId === teacherId,
      );
      const teacherOtherClasses = teacherGridSlots.filter((s) => s.classId !== classId);
      if (teacherOtherClasses.length > 0) {
        const firstMatch = teacherOtherClasses[0];
        const otherClass = db.classes.find((c) => c.id === firstMatch.classId);
        collisions.push({
          type: 'teacher',
          message: `Professor já alocado na turma ${otherClass?.name ?? 'outra'} neste horário`,
        });
      }

      const classGridSlots = db.grid.filter(
        (s) => s.weekday === weekday && s.blockId === blockId && s.classId === classId,
      );
      const classOtherTeachers = classGridSlots.filter((s) => s.teacherId !== teacherId);
      if (classOtherTeachers.length > 0) {
        const firstMatch = classOtherTeachers[0];
        const otherTeacher = db.teachers.find((t) => t.id === firstMatch.teacherId);
        collisions.push({
          type: 'class',
          message: `Turma já possui aula com ${otherTeacher?.name ?? 'outro professor'} neste horário`,
        });
      }

      const teacherOcc = db.occurrences.filter(
        (o) =>
          o.weekday === weekday &&
          o.blockId === blockId &&
          o.teacherId === teacherId &&
          o.id !== excludeOccurrenceId,
      );
      if (teacherOcc.length > 0) {
        const firstMatch = teacherOcc[0];
        collisions.push({
          type: 'teacher',
          message: `Professor já possui ocorrência registrada neste horário (${firstMatch.type})`,
        });
      }

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

      supabase.from('ocorrencias').insert([{ id, data: occurrence.date, bloco_horario: String(occurrence.blockId), tipo: occurrence.type, professor_id: occurrence.teacherId, motivo: occurrence.motivo }]).then();

      return emailLog;
    },
    [db.teachers, db.classes],
  );

  const deleteOccurrence = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      occurrences: prev.occurrences.filter((o) => o.id !== id),
    }));
    supabase.from('ocorrencias').delete().eq('id', id).then();
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
