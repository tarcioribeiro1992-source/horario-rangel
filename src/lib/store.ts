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

export function useStore() {
  const [db, setDb] = useState<DB>(loadDB);
  const [role, setRole] = useState<Role>('professor');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('t1');
  const [activeScheduleId, setActiveScheduleId] = useState<string>(REGULAR_SCHEDULE_ID);
  const [cloudSynced, setCloudSynced] = useState(false);
  const syncLock = useRef(false);

  // Sincronização inicial completa com o Supabase
  useEffect(() => {
    if (syncLock.current) return;
    syncLock.current = true;

    async function syncWithCloud() {
      try {
        const [tRes, sRes, cRes, gRes, oRes, vRes] = await Promise.all([
          supabase.from('professores').select('*'),
          supabase.from('disciplinas').select('*'),
          supabase.from('turmas').select('*'),
          supabase.from('grade_horaria').select('*'),
          supabase.from('ocorrencias').select('*'),
          supabase.from('versoes_horario').select('*'),
        ]);

        const localDb = loadDB();

        // Build cloud data maps
        const cloudTeacherIds = new Set((tRes.data || []).map((t: any) => t.id));
        const cloudSubjectIds = new Set((sRes.data || []).map((s: any) => s.id));
        const cloudClassIds = new Set((cRes.data || []).map((c: any) => c.id));
        const cloudScheduleIds = new Set((vRes.data || []).map((v: any) => v.id));
        const cloudGridIds = new Set((gRes.data || []).map((g: any) => g.id));
        const cloudOccIds = new Set((oRes.data || []).map((o: any) => o.id));

        // Merge: start with cloud data, then add local-only items
        const mergedTeachers = [
          ...(tRes.data || []).map((t: any) => ({
            id: t.id, name: t.nome, email: t.email || '', phone: t.telefone || '', color: '#2563eb',
          })),
          ...localDb.teachers.filter((t) => !cloudTeacherIds.has(t.id)),
        ];
        const mergedSubjects = [
          ...(sRes.data || []).map((s: any) => ({
            id: s.id, name: s.nome, color: s.cor || '#2563eb',
          })),
          ...localDb.subjects.filter((s) => !cloudSubjectIds.has(s.id)),
        ];
        const mergedClasses = [
          ...(cRes.data || []).map((c: any) => ({
            id: c.id, name: c.nome, grade: c.ano_serie || '',
          })),
          ...localDb.classes.filter((c) => !cloudClassIds.has(c.id)),
        ];
        const mergedSchedules: ScheduleVersion[] = [
          ...(vRes.data || []).map((v: any) => ({
            id: v.id, name: v.nome, isRegular: v.is_regular || false,
            active: false, createdAt: v.created_at || new Date().toISOString(),
          })),
          ...localDb.schedules.filter((s) => !cloudScheduleIds.has(s.id)),
        ];
        if (!mergedSchedules.some((s) => s.id === REGULAR_SCHEDULE_ID)) {
          mergedSchedules.unshift({
            id: REGULAR_SCHEDULE_ID, name: 'Grade Regular', isRegular: true, active: true, createdAt: new Date().toISOString(),
          });
        }
        const mergedGrid = [
          ...(gRes.data || []).map((g: any) => ({
            id: g.id, weekday: g.dia_semana, blockId: Number(g.bloco_horario),
            teacherId: g.professor_id || 'sem-professor', subjectId: g.disciplina || '',
            classId: g.turma || '', scheduleId: g.versao_id || REGULAR_SCHEDULE_ID,
          })),
          ...localDb.grid.filter((s) => !cloudGridIds.has(s.id)),
        ];
        const mergedOccurrences = [
          ...(oRes.data || []).map((o: any) => ({
            id: o.id, weekday: o.data, blockId: Number(o.bloco_horario),
            type: o.tipo, teacherId: o.professor_id || 'sem-professor',
            classId: '', note: o.motivo || '', substituteTeacherId: null,
            createdAt: o.created_at || new Date().toISOString(),
          })),
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

        // Push local-only items up to the cloud so other devices can see them
        const localOnlySchedules = localDb.schedules.filter((s) => !cloudScheduleIds.has(s.id) && s.id !== REGULAR_SCHEDULE_ID);
        if (localOnlySchedules.length > 0) {
          supabase.from('versoes_horario').insert(
            localOnlySchedules.map((s) => ({ id: s.id, nome: s.name, is_regular: false })),
          ).then(({ error }) => { if (error) console.error('Erro ao subir versões locais:', error); });
        }

        const localOnlyGrid = localDb.grid.filter((s) => !cloudGridIds.has(s.id));
        if (localOnlyGrid.length > 0) {
          supabase.from('grade_horaria').insert(
            localOnlyGrid.map((s) => ({
              id: s.id, dia_semana: s.weekday, bloco_horario: String(s.blockId),
              professor_id: s.teacherId, disciplina: s.subjectId, turma: s.classId,
              versao_id: s.scheduleId || REGULAR_SCHEDULE_ID,
            })),
          ).then(({ error }) => { if (error) console.error('Erro ao subir aulas locais:', error); });
        }

        const localOnlyTeachers = localDb.teachers.filter((t) => !cloudTeacherIds.has(t.id));
        if (localOnlyTeachers.length > 0) {
          supabase.from('professores').insert(
            localOnlyTeachers.map((t) => ({ id: t.id, nome: t.name, email: t.email, telefone: t.phone })),
          ).then(({ error }) => { if (error) console.error('Erro ao subir professores locais:', error); });
        }

        const localOnlySubjects = localDb.subjects.filter((s) => !cloudSubjectIds.has(s.id));
        if (localOnlySubjects.length > 0) {
          supabase.from('disciplinas').insert(
            localOnlySubjects.map((s) => ({ id: s.id, nome: s.name, cor: s.color })),
          ).then(({ error }) => { if (error) console.error('Erro ao subir disciplinas locais:', error); });
        }

        const localOnlyClasses = localDb.classes.filter((c) => !cloudClassIds.has(c.id));
        if (localOnlyClasses.length > 0) {
          supabase.from('turmas').insert(
            localOnlyClasses.map((c) => ({ id: c.id, nome: c.name, ano_serie: c.grade })),
          ).then(({ error }) => { if (error) console.error('Erro ao subir turmas locais:', error); });
        }

        const localOnlyOccs = localDb.occurrences.filter((o) => !cloudOccIds.has(o.id));
        if (localOnlyOccs.length > 0) {
          supabase.from('ocorrencias').insert(
            localOnlyOccs.map((o) => ({
              id: o.id, data: o.weekday || '', bloco_horario: String(o.blockId),
              tipo: o.type, professor_id: o.teacherId || 'sem-professor', motivo: o.note || '',
            })),
          ).then(({ error }) => { if (error) console.error('Erro ao subir ocorrências locais:', error); });
        }
      } catch (err) {
        console.warn('Usando modo local offline.', err);
      }
    }
    syncWithCloud();
  }, []);

  // Realtime subscriptions — reload from Supabase when any table changes
  useEffect(() => {
    if (!cloudSynced) return;

    async function handleRealtimeChange() {
      try {
        const [tRes, sRes, cRes, gRes, oRes, vRes] = await Promise.all([
          supabase.from('professores').select('*'),
          supabase.from('disciplinas').select('*'),
          supabase.from('turmas').select('*'),
          supabase.from('grade_horaria').select('*'),
          supabase.from('ocorrencias').select('*'),
          supabase.from('versoes_horario').select('*'),
        ]);

        setDb((prev) => {
          const updatedDb = { ...prev };
          if (tRes.data) updatedDb.teachers = tRes.data.map((t: any) => ({
            id: t.id, name: t.nome, email: t.email || '', phone: t.telefone || '', color: '#2563eb',
          }));
          if (sRes.data) updatedDb.subjects = sRes.data.map((s: any) => ({
            id: s.id, name: s.nome, color: s.cor || '#2563eb',
          }));
          if (cRes.data) updatedDb.classes = cRes.data.map((c: any) => ({
            id: c.id, name: c.nome, grade: c.ano_serie || '',
          }));
          if (gRes.data) updatedDb.grid = gRes.data.map((g: any) => ({
            id: g.id, weekday: g.dia_semana, blockId: Number(g.bloco_horario),
            teacherId: g.professor_id || 'sem-professor', subjectId: g.disciplina || '',
            classId: g.turma || '', scheduleId: g.versao_id || REGULAR_SCHEDULE_ID,
          }));
          if (oRes.data) updatedDb.occurrences = oRes.data.map((o: any) => ({
            id: o.id, weekday: o.data, blockId: Number(o.bloco_horario),
            type: o.tipo, teacherId: o.professor_id || 'sem-professor',
            classId: '', note: o.motivo || '', substituteTeacherId: null,
            createdAt: o.created_at || new Date().toISOString(),
          }));
          if (vRes.data) {
            const cloudSchedules = vRes.data.map((v: any) => ({
              id: v.id, name: v.nome, isRegular: v.is_regular || false,
              active: false, createdAt: v.created_at || new Date().toISOString(),
            }));
            if (!cloudSchedules.some((s: ScheduleVersion) => s.id === REGULAR_SCHEDULE_ID)) {
              cloudSchedules.unshift({
                id: REGULAR_SCHEDULE_ID, name: 'Grade Regular', isRegular: true, active: true, createdAt: new Date().toISOString(),
              });
            }
            updatedDb.schedules = cloudSchedules;
          }
          return updatedDb;
        });
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
    supabase.from('professores').insert([{ id: newId, nome: name, email: email, telefone: phone }]).then();
  }, []);

  const updateTeacher = useCallback((id: string, name: string, email: string, phone: string, color: string) => {
    setDb((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => (t.id === id ? { ...t, name, email, phone, color } : t)),
    }));
    supabase.from('professores').update({ nome: name, email: email, telefone: phone }).eq('id', id).then();
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
    (weekday: Weekday, blockId: number, teacherId: string, subjectId: string, classId: string, scheduleId?: string) => {
      const newId = uid();
      const sid = scheduleId || REGULAR_SCHEDULE_ID;
      setDb((prev) => ({
        ...prev,
        grid: [...prev.grid, { id: newId, weekday, blockId, teacherId, subjectId, classId, scheduleId: sid }],
      }));
      supabase.from('grade_horaria').insert([{ id: newId, dia_semana: weekday, bloco_horario: String(blockId), professor_id: teacherId, disciplina: subjectId, turma: classId, versao_id: sid }]).then();
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
    supabase.from('versoes_horario').insert([{ id: newId, nome: name, is_regular: false }])
      .then(({ error }) => { if (error) console.error('Erro ao salvar versão no Supabase:', error); });
    return newId;
  }, []);

  const renameSchedule = useCallback((id: string, name: string) => {
    setDb((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s) => (s.id === id ? { ...s, name } : s)),
    }));
    supabase.from('versoes_horario').update({ nome: name }).eq('id', id)
      .then(({ error }) => { if (error) console.error('Erro ao renomear versão:', error); });
  }, []);

  const deleteSchedule = useCallback((id: string) => {
    if (id === REGULAR_SCHEDULE_ID) return;
    setDb((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((s) => s.id !== id),
      grid: prev.grid.filter((s) => s.scheduleId !== id),
    }));
    supabase.from('versoes_horario').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('Erro ao excluir versão:', error); });
    supabase.from('grade_horaria').delete().eq('versao_id', id)
      .then(({ error }) => { if (error) console.error('Erro ao excluir aulas da versão:', error); });
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
      return {
        ...prev,
        schedules: [...prev.schedules, newSchedule],
        grid: [...prev.grid, ...clonedSlots],
      };
    });
    supabase.from('versoes_horario').insert([{ id: newId, nome: newName, is_regular: false }])
      .then(({ error }) => { if (error) console.error('Erro ao duplicar versão:', error); });
    // Insert cloned slots into Supabase — use a microtask to ensure state has settled
    setTimeout(() => {
      setDb((prev) => {
        const cloned = prev.grid.filter((s) => s.scheduleId === newId);
        if (cloned.length > 0) {
          supabase.from('grade_horaria').insert(
            cloned.map((s) => ({
              id: s.id, dia_semana: s.weekday, bloco_horario: String(s.blockId),
              professor_id: s.teacherId, disciplina: s.subjectId, turma: s.classId, versao_id: newId,
            })),
          ).then(({ error }) => { if (error) console.error('Erro ao clonar aulas:', error); });
        }
        return prev;
      });
    }, 0);
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

      supabase.from('ocorrencias').insert([{
        id,
        data: data.weekday || new Date().toLocaleDateString('pt-BR'),
        bloco_horario: String(occurrence.blockId),
        tipo: occurrence.type,
        professor_id: occurrence.teacherId || 'sem-professor',
        motivo: data.note || ''
      }]).then();

      return emailLog;
    },
    [db.teachers, db.classes, db.occurrences, db.emailLogs],
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
