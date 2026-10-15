import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  ScheduleVersion,
} from '@/types';

const STORAGE_KEY = 'horariorangel_db_v2';
const REGULAR_SCHEDULE_ID = 'regular';

interface DB {
  teachers: Teacher[];
  subjects: Subject[];
  classes: SchoolClass[];
  grid: GridSlot[];
  occurrences: Occurrence[];
  emailLogs: EmailLog[];
  schedules: ScheduleVersion[];
}

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (!parsed.schedules || parsed.schedules.length === 0) {
        parsed.schedules = [
          { id: REGULAR_SCHEDULE_ID, name: 'Grade Regular', isRegular: true, active: true, createdAt: new Date().toISOString() },
        ];
      }
      if (!parsed.grid.every((s) => s.scheduleId)) {
        parsed.grid = parsed.grid.map((s) => ({ ...s, scheduleId: s.scheduleId || REGULAR_SCHEDULE_ID }));
      }
      return parsed;
    }
  } catch {
    // ignore
  }
  return {
    teachers: [],
    subjects: [],
    classes: [],
    grid: [],
    occurrences: [],
    emailLogs: [],
    schedules: [
      { id: REGULAR_SCHEDULE_ID, name: 'Grade Regular', isRegular: true, active: true, createdAt: new Date().toISOString() },
    ],
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

function getFunctionUrl(name: string): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;
}

async function cloudFetchAll(): Promise<DB> {
  const res = await fetch(getFunctionUrl('fetch-db'), {
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  const data = await res.json();

  const schedules: ScheduleVersion[] = (data.schedules || []).map((v: any) => ({
    id: v.id, name: v.nome, isRegular: v.is_regular || false,
    active: false, createdAt: v.created_at || new Date().toISOString(),
  }));
  if (!schedules.some((s) => s.id === REGULAR_SCHEDULE_ID)) {
    schedules.unshift({
      id: REGULAR_SCHEDULE_ID, name: 'Grade Regular', isRegular: true, active: true, createdAt: new Date().toISOString(),
    });
  }

  return {
    teachers: (data.teachers || []).map((t: any) => ({
      id: t.id, name: t.nome, email: t.email || '', phone: t.telefone || '', color: '#2563eb',
    })),
    subjects: (data.subjects || []).map((s: any) => ({
      id: s.id, name: s.nome, color: s.cor || '#2563eb',
    })),
    classes: (data.classes || []).map((c: any) => ({
      id: c.id, name: c.nome, grade: c.ano_serie || '',
    })),
    grid: (data.grid || []).map((g: any) => ({
      id: g.id, weekday: g.dia_semana, blockId: Number(g.bloco_horario),
      teacherId: g.professor_id || 'sem-professor', subjectId: g.disciplina || '',
      classId: g.turma || '', scheduleId: g.versao_id || REGULAR_SCHEDULE_ID,
    })),
    occurrences: (data.occurrences || []).map((o: any) => ({
      id: o.id, weekday: o.data, blockId: Number(o.bloco_horario),
      type: o.tipo, teacherId: o.professor_id || 'sem-professor',
      classId: '', note: o.motivo || '', substituteTeacherId: null,
      createdAt: o.created_at || new Date().toISOString(),
    })),
    emailLogs: [],
    schedules,
  };
}

async function cloudUpsert(payload: {
  teachers?: any[];
  subjects?: any[];
  classes?: any[];
  schedules?: any[];
  grid?: any[];
  occurrences?: any[];
}): Promise<void> {
  const res = await fetch(getFunctionUrl('sync-db'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
}

export function useStore() {
  const [db, setDb] = useState<DB>(loadDB);
  const [role, setRole] = useState<Role>('professor');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('t1');
  const [activeScheduleId, setActiveScheduleId] = useState<string>(REGULAR_SCHEDULE_ID);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const syncLock = useRef(false);

  function trackWrite(promise: Promise<void>, label: string) {
    promise
      .then(() => {
        setSyncError(null);
      })
      .catch((err: any) => {
        console.error(`Erro ao salvar (${label}):`, err);
        setSyncError(`${label}: ${err?.message || 'erro desconhecido'}`);
      });
  }

  // Sincronização inicial completa com o Supabase (via edge function)
  useEffect(() => {
    if (syncLock.current) return;
    syncLock.current = true;

    async function syncWithCloud() {
      try {
        setSyncing(true);
        const cloudData = await cloudFetchAll();
        const localDb = loadDB();

        const cloudTeacherIds = new Set(cloudData.teachers.map((t) => t.id));
        const cloudSubjectIds = new Set(cloudData.subjects.map((s) => s.id));
        const cloudClassIds = new Set(cloudData.classes.map((c) => c.id));
        const cloudScheduleIds = new Set(cloudData.schedules.map((s) => s.id));
        const cloudGridIds = new Set(cloudData.grid.map((g) => g.id));
        const cloudOccIds = new Set(cloudData.occurrences.map((o) => o.id));

        const mergedTeachers = [
          ...cloudData.teachers,
          ...localDb.teachers.filter((t) => !cloudTeacherIds.has(t.id)),
        ];
        const mergedSubjects = [
          ...cloudData.subjects,
          ...localDb.subjects.filter((s) => !cloudSubjectIds.has(s.id)),
        ];
        const mergedClasses = [
          ...cloudData.classes,
          ...localDb.classes.filter((c) => !cloudClassIds.has(c.id)),
        ];
        const mergedSchedules: ScheduleVersion[] = [
          ...cloudData.schedules,
          ...localDb.schedules.filter((s) => !cloudScheduleIds.has(s.id)),
        ];
        if (!mergedSchedules.some((s) => s.id === REGULAR_SCHEDULE_ID)) {
          mergedSchedules.unshift({
            id: REGULAR_SCHEDULE_ID, name: 'Grade Regular', isRegular: true, active: true, createdAt: new Date().toISOString(),
          });
        }
        const mergedGrid = [
          ...cloudData.grid,
          ...localDb.grid.filter((s) => !cloudGridIds.has(s.id)),
        ];
        const mergedOccurrences = [
          ...cloudData.occurrences,
          ...localDb.occurrences.filter((o) => !cloudOccIds.has(o.id)),
        ];

        setDb({
          teachers: mergedTeachers,
          subjects: mergedSubjects,
          classes: mergedClasses,
          grid: mergedGrid,
          occurrences: mergedOccurrences,
          emailLogs: localDb.emailLogs || [],
          schedules: mergedSchedules,
        });
        setCloudSynced(true);
        setSyncError(null);

        // Push local-only items up to the cloud via edge function
        const localOnlySchedules = localDb.schedules.filter((s) => !cloudScheduleIds.has(s.id) && s.id !== REGULAR_SCHEDULE_ID);
        const localOnlyGrid = localDb.grid.filter((s) => !cloudGridIds.has(s.id));
        const localOnlyTeachers = localDb.teachers.filter((t) => !cloudTeacherIds.has(t.id));
        const localOnlySubjects = localDb.subjects.filter((s) => !cloudSubjectIds.has(s.id));
        const localOnlyClasses = localDb.classes.filter((c) => !cloudClassIds.has(c.id));
        const localOnlyOccs = localDb.occurrences.filter((o) => !cloudOccIds.has(o.id));

        const hasLocalOnly = localOnlySchedules.length > 0 || localOnlyGrid.length > 0 ||
          localOnlyTeachers.length > 0 || localOnlySubjects.length > 0 ||
          localOnlyClasses.length > 0 || localOnlyOccs.length > 0;

        if (hasLocalOnly) {
          trackWrite(cloudUpsert({
            teachers: localOnlyTeachers.map((t) => ({ id: t.id, nome: t.name, email: t.email, telefone: t.phone })),
            subjects: localOnlySubjects.map((s) => ({ id: s.id, nome: s.name, cor: s.color })),
            classes: localOnlyClasses.map((c) => ({ id: c.id, nome: c.name, ano_serie: c.grade })),
            schedules: localOnlySchedules.map((s) => ({ id: s.id, nome: s.name, is_regular: false })),
            grid: localOnlyGrid.map((s) => ({
              id: s.id, dia_semana: s.weekday, bloco_horario: String(s.blockId),
              professor_id: s.teacherId, disciplina: s.subjectId, turma: s.classId,
              versao_id: s.scheduleId || REGULAR_SCHEDULE_ID,
            })),
            occurrences: localOnlyOccs.map((o) => ({
              id: o.id, data: o.weekday || '', bloco_horario: String(o.blockId),
              tipo: o.type, professor_id: o.teacherId || 'sem-professor', motivo: o.note || '',
            })),
          }), 'versão local');
        }
      } catch (err: any) {
        console.error('Erro de sincronização:', err);
        setSyncError(err?.message || 'Falha ao conectar com a nuvem');
      } finally {
        setSyncing(false);
      }
    }
    syncWithCloud();
  }, []);

  // Realtime subscriptions — reload from Supabase when any table changes
  useEffect(() => {
    if (!cloudSynced) return;

    let active = true;

    async function handleRealtimeChange() {
      try {
        const cloudData = await cloudFetchAll();
        if (!active) return;
        setDb((prev) => ({
          ...cloudData,
          emailLogs: prev.emailLogs || [],
        }));
      } catch (err) {
        console.warn('Erro ao recarregar dados em tempo real.', err);
      }
    }

    const channel = supabase
      .channel('horariorangel-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'professores' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disciplinas' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turmas' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grade_horaria' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ocorrencias' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'versoes_horario' }, handleRealtimeChange)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [cloudSynced]);

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const addTeacher = useCallback((name: string, email: string, phone: string, color: string) => {
    const newId = uid();
    setDb((prev) => ({
      ...prev,
      teachers: [...prev.teachers, { id: newId, name, email, phone, color }],
    }));
    trackWrite(cloudUpsert({ teachers: [{ id: newId, nome: name, email, telefone: phone }] }), 'professor');
  }, []);

  const updateTeacher = useCallback((id: string, name: string, email: string, phone: string, color: string) => {
    setDb((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => (t.id === id ? { ...t, name, email, phone, color } : t)),
    }));
    trackWrite(cloudUpsert({ teachers: [{ id, nome: name, email, telefone: phone }] }), 'professor');
  }, []);

  const deleteTeacher = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      teachers: prev.teachers.filter((t) => t.id !== id),
      grid: prev.grid.filter((s) => s.teacherId !== id),
    }));
    trackWrite(supabase.from('professores').delete().eq('id', id).then(() => undefined), 'professor');
  }, []);

  const addSubject = useCallback((name: string, color: string) => {
    const newId = uid();
    setDb((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { id: newId, name, color }],
    }));
    trackWrite(cloudUpsert({ subjects: [{ id: newId, nome: name, cor: color }] }), 'disciplina');
  }, []);

  const updateSubject = useCallback((id: string, name: string, color: string) => {
    setDb((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === id ? { ...s, name, color } : s)),
    }));
    trackWrite(cloudUpsert({ subjects: [{ id, nome: name, cor: color }] }), 'disciplina');
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== id),
    }));
    trackWrite(supabase.from('disciplinas').delete().eq('id', id).then(() => undefined), 'disciplina');
  }, []);

  const addClass = useCallback((name: string, grade: string) => {
    const newId = uid();
    setDb((prev) => ({
      ...prev,
      classes: [...prev.classes, { id: newId, name, grade }],
    }));
    trackWrite(cloudUpsert({ classes: [{ id: newId, nome: name, ano_serie: grade }] }), 'turma');
  }, []);

  const updateClass = useCallback((id: string, name: string, grade: string) => {
    setDb((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === id ? { ...c, name, grade } : c)),
    }));
    trackWrite(cloudUpsert({ classes: [{ id, nome: name, ano_serie: grade }] }), 'turma');
  }, []);

  const deleteClass = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== id),
      grid: prev.grid.filter((s) => s.classId !== id),
    }));
    trackWrite(supabase.from('turmas').delete().eq('id', id).then(() => undefined), 'turma');
  }, []);

  const addGridSlot = useCallback(
    (weekday: Weekday, blockId: number, teacherId: string, subjectId: string, classId: string, scheduleId?: string) => {
      const newId = uid();
      const sid = scheduleId || REGULAR_SCHEDULE_ID;
      setDb((prev) => ({
        ...prev,
        grid: [...prev.grid, { id: newId, weekday, blockId, teacherId, subjectId, classId, scheduleId: sid }],
      }));
      trackWrite(cloudUpsert({ grid: [{ id: newId, dia_semana: weekday, bloco_horario: String(blockId), professor_id: teacherId, disciplina: subjectId, turma: classId, versao_id: sid }] }), 'aula');
    },
    [],
  );

  const updateGridSlot = useCallback(
    (id: string, teacherId: string, subjectId: string, classId: string) => {
      setDb((prev) => ({
        ...prev,
        grid: prev.grid.map((s) => (s.id === id ? { ...s, teacherId, subjectId, classId } : s)),
      }));
      trackWrite(supabase.from('grade_horaria').update({ professor_id: teacherId, disciplina: subjectId, turma: classId }).eq('id', id).then(() => undefined), 'aula');
    },
    [],
  );

  const deleteGridSlot = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      grid: prev.grid.filter((s) => s.id !== id),
    }));
    trackWrite(supabase.from('grade_horaria').delete().eq('id', id).then(() => undefined), 'aula');
  }, []);

  const addSchedule = useCallback((name: string): string => {
    const newId = uid();
    const newSchedule: ScheduleVersion = {
      id: newId,
      name,
      isRegular: false,
      active: false,
      createdAt: new Date().toISOString(),
    };
    setDb((prev) => ({
      ...prev,
      schedules: [...prev.schedules, newSchedule],
    }));
    trackWrite(cloudUpsert({ schedules: [{ id: newId, nome: name, is_regular: false }] }), 'versão');
    return newId;
  }, []);

  const renameSchedule = useCallback((id: string, name: string) => {
    setDb((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s) => (s.id === id ? { ...s, name } : s)),
    }));
    trackWrite(cloudUpsert({ schedules: [{ id, nome: name, is_regular: false }] }), 'versão');
  }, []);

  const deleteSchedule = useCallback((id: string) => {
    if (id === REGULAR_SCHEDULE_ID) return;
    setDb((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((s) => s.id !== id),
      grid: prev.grid.filter((s) => s.scheduleId !== id),
    }));
    trackWrite(supabase.from('versoes_horario').delete().eq('id', id).then(() => undefined), 'versão');
    trackWrite(supabase.from('grade_horaria').delete().eq('versao_id', id).then(() => undefined), 'aulas da versão');
    setActiveScheduleId((prev) => (prev === id ? REGULAR_SCHEDULE_ID : prev));
  }, []);

  const duplicateSchedule = useCallback((sourceId: string, newName: string): string => {
    const newId = uid();
    const newSchedule: ScheduleVersion = {
      id: newId,
      name: newName,
      isRegular: false,
      active: false,
      createdAt: new Date().toISOString(),
    };
    setDb((prev) => {
      const sourceSlots = prev.grid.filter((s) => (s.scheduleId || REGULAR_SCHEDULE_ID) === sourceId);
      const clonedSlots = sourceSlots.map((s) => ({
        ...s,
        id: uid(),
        scheduleId: newId,
      }));

      trackWrite(cloudUpsert({
        schedules: [{ id: newId, nome: newName, is_regular: false }],
        grid: clonedSlots.map((s) => ({
          id: s.id, dia_semana: s.weekday, bloco_horario: String(s.blockId),
          professor_id: s.teacherId, disciplina: s.subjectId, turma: s.classId, versao_id: newId,
        })),
      }), 'versão duplicada');

      return {
        ...prev,
        schedules: [...prev.schedules, newSchedule],
        grid: [...prev.grid, ...clonedSlots],
      };
    });
    return newId;
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
      if (!classId) return collisions;

      const scheduleGrid = db.grid.filter(
        (s) => (s.scheduleId || REGULAR_SCHEDULE_ID) === activeScheduleId,
      );

      const classSlots = scheduleGrid.filter(
        (s) => s.weekday === weekday && s.blockId === blockId && s.classId === classId
      );
      if (classSlots.length > 0) {
        collisions.push({
          type: 'class',
          message: `Esta turma já possui uma aula agendada neste mesmo horário.`,
        });
      }

      if (!teacherId || teacherId === 'sem-professor') return collisions;

      const incomingIds = teacherId.split('/').map(id => id.trim());
      const teacherSlots = scheduleGrid.filter((s) => s.weekday === weekday && s.blockId === blockId);

      for (const slot of teacherSlots) {
        if (!slot.teacherId || slot.teacherId === 'sem-professor') continue;
        const existingIds = slot.teacherId.split('/').map(id => id.trim());
        const standardMatch = incomingIds.some(id => existingIds.includes(id));
        if (standardMatch && slot.classId !== classId) {
          const otherClass = db.classes.find((c) => c.id === slot.classId);
          collisions.push({
            type: 'teacher',
            message: `O professor já está alocado na turma ${otherClass?.name ?? 'outra'} neste horário.`,
          });
          break;
        }
      }

      return collisions;
    },
    [db.grid, db.classes, activeScheduleId],
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
      const schoolClass = db.classes.find((c) => c.id === data.classId);

      const emailLog: EmailLog = {
        id: uid(),
        to: teacher?.email ?? '',
        toName: teacher?.name ?? '',
        subject: `HorárioRangel — Ocorrência: ${data.type}`,
        body: buildEmailBody(occurrence, teacher, null, schoolClass),
        occurrenceId: id,
        sentAt: new Date().toISOString(),
      };

      setDb((prev) => ({
        ...prev,
        occurrences: [occurrence, ...prev.occurrences],
        emailLogs: [emailLog, ...prev.emailLogs],
      }));

      trackWrite(cloudUpsert({ occurrences: [{
        id,
        data: data.weekday || new Date().toLocaleDateString('pt-BR'),
        bloco_horario: String(occurrence.blockId),
        tipo: occurrence.type,
        professor_id: occurrence.teacherId || 'sem-professor',
        motivo: data.note || '',
      }] }), 'ocorrência');

      return emailLog;
    },
    [db.teachers, db.classes, db.occurrences, db.emailLogs],
  );

  const deleteOccurrence = useCallback((id: string) => {
    setDb((prev) => ({
      ...prev,
      occurrences: prev.occurrences.filter((o) => o.id !== id),
    }));
    trackWrite(supabase.from('ocorrencias').delete().eq('id', id).then(() => undefined), 'ocorrência');
  }, []);

  const forceSync = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const localDb = loadDB();
      const localSchedules = localDb.schedules.filter((s) => s.id !== REGULAR_SCHEDULE_ID);

      await cloudUpsert({
        teachers: localDb.teachers.map((t) => ({ id: t.id, nome: t.name, email: t.email, telefone: t.phone })),
        subjects: localDb.subjects.map((s) => ({ id: s.id, nome: s.name, cor: s.color })),
        classes: localDb.classes.map((c) => ({ id: c.id, nome: c.name, ano_serie: c.grade })),
        schedules: localSchedules.map((s) => ({ id: s.id, nome: s.name, is_regular: false })),
        grid: localDb.grid.map((s) => ({
          id: s.id, dia_semana: s.weekday, bloco_horario: String(s.blockId),
          professor_id: s.teacherId, disciplina: s.subjectId, turma: s.classId,
          versao_id: s.scheduleId || REGULAR_SCHEDULE_ID,
        })),
        occurrences: localDb.occurrences.map((o) => ({
          id: o.id, data: o.weekday || '', bloco_horario: String(o.blockId),
          tipo: o.type, professor_id: o.teacherId || 'sem-professor', motivo: o.note || '',
        })),
      });

      const cloudData = await cloudFetchAll();
      setDb({
        ...cloudData,
        emailLogs: localDb.emailLogs || [],
      });
      setCloudSynced(true);
      setSyncError(null);
    } catch (err: any) {
      console.error('forceSync error:', err);
      setSyncError(err?.message || 'Falha ao sincronizar');
    } finally {
      setSyncing(false);
    }
  }, []);

  const resetDB = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setDb(loadDB());
  }, []);

  const gridForActiveSchedule = useMemo(
    () => db.grid.filter((s) => (s.scheduleId || REGULAR_SCHEDULE_ID) === activeScheduleId),
    [db.grid, activeScheduleId],
  );

  return {
    ...db,
    teachers: [...db.teachers].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    subjects: [...db.subjects].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    grid: gridForActiveSchedule,
    allGrid: db.grid,
    role,
    setRole,
    selectedTeacherId,
    setSelectedTeacherId,
    activeScheduleId,
    setActiveScheduleId,
    cloudSynced,
    syncError,
    syncing,
    forceSync,
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
    addSchedule,
    renameSchedule,
    deleteSchedule,
    duplicateSchedule,
    resetDB,
  };
}

export type Store = ReturnType<typeof useStore>;
