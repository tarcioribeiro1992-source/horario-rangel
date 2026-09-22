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
  const [role, setRole] = useState<Role>('professor');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('t1');

    // Sincronização inicial completa com o Supabase
  useEffect(() => {
    async function syncWithCloud() {
      try {
        const [tRes, sRes, cRes, gRes, oRes] = await Promise.all([
          supabase.from('professores').select('*'),
          supabase.from('disciplinas').select('*'),
          supabase.from('turmas').select('*'),
          supabase.from('grade_horaria').select('*'),
          supabase.from('ocorrencias').select('*')
        ]);
        
        let updatedDb = { ...db };
        
        if (tRes.data && tRes.data.length > 0) {
          updatedDb.teachers = tRes.data.map((t: any) => ({
            id: t.id, name: t.nome, email: t.email, phone: t.telefone || '', color: '#2563eb'
          }));
        }
        if (sRes.data && sRes.data.length > 0) {
          updatedDb.subjects = sRes.data.map((s: any) => ({
            id: s.id, name: s.nome, color: s.cor || '#2563eb'
          }));
        }
        if (cRes.data && cRes.data.length > 0) {
          updatedDb.classes = cRes.data.map((c: any) => ({
            id: c.id, name: c.nome, grade: c.ano_serie || ''
          }));
        }
        if (gRes.data && gRes.data.length > 0) {
          updatedDb.grid = gRes.data.map((g: any) => ({
            id: g.id, weekday: g.dia_semana, blockId: Number(g.bloco_horario), teacherId: g.professor_id, subjectId: g.disciplina, classId: g.turma
          }));
        }
        if (oRes.data && oRes.data.length > 0) {
          updatedDb.occurrences = oRes.data.map((o: any) => ({
            id: o.id, date: o.data, blockId: Number(o.bloco_horario), type: o.tipo, teacherId: o.professor_id, motivo: o.motivo || ''
          }));
        }
        
        setDb(updatedDb);
      } catch (err) {
        console.warn('Usando modo local offline.');
      }
    }
    syncWithCloud();
  }, []);


  const addTeacher = useCallback((name: string, email: string, phone: string, color: string) => {
    const newId = uid();
    setDb((prev) => ({
      ...prev,
      teachers: [...prev.teachers, { id: newId, name, email, phone, color }],
    }));
   supabase.from('professores').insert([{ id: newId, nome: name, email: email, telefone: phone }]).then();
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

     // Subjects (Disciplinas)
  const addSubject = useCallback((name: string, color: string) => {
    const newId = uid();
    setDb((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { id: newId, name, color }],
    }));
    supabase.from('disciplinas').insert([{ id: newId, nome: name, cor: color }]).then();
  }, []);

  const updateSubject = useCallback((id: string, name: string, color: string) => {
    setDb((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === id ? { ...s, name, color } : s)),
    }));
    supabase.from('disciplinas').update({ nome: name, cor: color }).eq('id', id).then();
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== id),
    }));
    supabase.from('disciplinas').delete().eq('id', id).then();
  }, []);

    // Classes (Turmas)
  const addClass = useCallback((name: string, grade: string) => {
    const newId = uid();
    setDb((prev) => ({
      ...prev,
      classes: [...prev.classes, { id: newId, name, grade }],
    }));
    supabase.from('turmas').insert([{ id: newId, nome: name, ano_serie: grade }]).then();
  }, []);

  const updateClass = useCallback((id: string, name: string, grade: string) => {
    setDb((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === id ? { ...c, name, grade } : c)),
    }));
    supabase.from('turmas').update({ nome: name, ano_serie: grade }).eq('id', id).then();
  }, []);

  const deleteClass = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== id),
      grid: prev.grid.filter((s) => s.classId !== id),
    }));
    supabase.from('turmas').delete().eq('id', id).then();
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

supabase.from('ocorrencias').insert([{ id, data: occurrence.weekday || new Date().toLocaleDateString('pt-BR'), bloco_horario: String(occurrence.blockId), tipo: occurrence.type, professor_id: occurrence.teacherId || 'sem-professor', motivo: occurrence.motivo || '' }]).then();

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
