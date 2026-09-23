import { useState, useMemo } from 'react';
import { BookOpen, User, AlertTriangle, Clock, Users } from 'lucide-react';
import type { Store } from '@/lib/store';
import { TIME_BLOCKS, WEEKDAYS, formatBlockTime } from '@/lib/timeBlocks';

const occTypeColors: Record<string, string> = {
  Falta: 'bg-red-50 border-red-400 text-red-700',
  Formação: 'bg-violet-50 border-violet-400 text-violet-700',
  'Saída Cedo': 'bg-amber-50 border-amber-400 text-amber-700',
  'Palestra Escolar': 'bg-sky-50 border-sky-400 text-sky-700',
  Projeto: 'bg-emerald-50 border-emerald-400 text-emerald-700',
};

export function ClassDashboard({ store }: { store: Store }) {
  const { teachers, subjects, classes, grid, occurrences } = store;
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id ?? '');

  const currentClass = classes.find((c) => c.id === selectedClassId);

  const classGrid = useMemo(
    () => grid.filter((s) => s.classId === selectedClassId),
    [grid, selectedClassId],
  );

  const classOccurrences = useMemo(
    () => occurrences.filter((o) => o.classId === selectedClassId),
    [occurrences, selectedClassId],
  );

  const getTeacher = (id: string) => teachers.find((t) => t.id === id);
  const getSubject = (id: string) => subjects.find((s) => s.id === id);

  // Stats
  const totalSlots = classGrid.length;
  const uniqueTeachers = new Set(classGrid.map((s) => s.teacherId)).size;
  const uniqueSubjects = new Set(classGrid.map((s) => s.subjectId)).size;
  const totalOccs = classOccurrences.length;

  if (!currentClass) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Nenhuma turma cadastrada.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header + Class Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Horário por Turma</h2>
          <p className="text-sm text-slate-500 mt-0.5">Visualize a grade semanal completa de cada turma</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Turma:</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 min-w-[160px]"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.grade}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Class Banner */}
      <div className="bg-gradient-to-r from-sky-600 to-teal-500 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold">Turma {currentClass.name}</h3>
            <p className="text-sm text-white/80">{currentClass.grade}</p>
          </div>
          <div className="hidden sm:flex items-center gap-5">
            <div className="text-center">
              <p className="text-2xl font-bold">{totalSlots}</p>
              <p className="text-[10px] text-white/70 uppercase">Aulas/Semana</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{uniqueTeachers}</p>
              <p className="text-[10px] text-white/70 uppercase">Professores</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{uniqueSubjects}</p>
              <p className="text-[10px] text-white/70 uppercase">Disciplinas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{totalOccs}</p>
              <p className="text-[10px] text-white/70 uppercase">Ocorrências</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Day headers */}
            <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-1.5 mb-1.5">
              <div className="text-xs text-slate-400 flex items-center justify-center font-semibold uppercase">
                Horário
              </div>
              {WEEKDAYS.map((d) => (
                <div
                  key={d.key}
                  className="text-center py-2 rounded-lg bg-slate-100 text-sm font-semibold text-slate-600"
                >
                  {d.short}
                </div>
              ))}
            </div>

            {/* All time blocks including breaks */}
            {TIME_BLOCKS.map((block) => {
              if (block.isBreak) {
                return (
                  <div key={block.id} className="grid grid-cols-[100px_repeat(5,1fr)] gap-1.5 mb-1.5">
                    <div className="flex items-center justify-center text-[10px] text-slate-400 font-medium bg-amber-50 rounded-lg py-1.5 border border-dashed border-amber-200">
                      {block.start}
                    </div>
                    <div className="col-span-5 flex items-center justify-center text-[10px] text-amber-600 font-medium bg-amber-50 rounded-lg py-1.5 border border-dashed border-amber-200">
                      {block.label}
                    </div>
                  </div>
                );
              }

              return (
                <div key={block.id} className="grid grid-cols-[100px_repeat(5,1fr)] gap-1.5 mb-1.5">
                  {/* Time label */}
                  <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg py-1.5 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-600">{block.label}</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">{formatBlockTime(block.id)}</span>
                  </div>

                  {/* Day cells */}
                  {WEEKDAYS.map((d) => {
                    const slot = classGrid.find(
                      (s) => s.weekday === d.key && s.blockId === block.id,
                    );
                    const occ = classOccurrences.find(
                      (o) => o.weekday === d.key && o.blockId === block.id,
                    );

                    return (
                      <div
                        key={`${d.key}-${block.id}`}
                        className="min-h-[60px] rounded-lg border border-slate-100 bg-white p-1.5 flex flex-col justify-center"
                      >
                        {slot && !occ && (
                          <div>
                            <div className="flex items-center gap-1 mb-0.5">
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: getSubject(slot.subjectId)?.color ?? '#94a3b8' }}
                              />
                              <span className="text-[11px] font-bold text-slate-700 truncate">
                                {getSubject(slot.subjectId)?.name ?? '—'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate">
                              <User className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate">{getTeacher(slot.teacherId)?.name ?? '—'}</span>
                            </div>
                          </div>
                        )}

                        {occ && (
                          <div className={`p-1 rounded border-l-2 ${occTypeColors[occ.type] ?? 'bg-slate-50 border-slate-300'}`}>
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="text-[10px] font-bold truncate">{occ.type}</span>
                            </div>
                            <p className="text-[9px] text-slate-500 truncate mt-0.5">
                              {getTeacher(occ.teacherId)?.name ?? '—'}
                            </p>
                            {occ.substituteTeacherId && (
                              <p className="text-[9px] text-slate-400 truncate mt-0.5">
                                Sub: {getTeacher(occ.substituteTeacherId)?.name ?? '—'}
                              </p>
                            )}
                          </div>
                        )}

                        {!slot && !occ && (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-[10px] text-slate-300">—</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subject summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Disciplinas da Turma</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from(uniqueSubjects).map((subjectId) => {
            const subject = getSubject(subjectId);
            if (!subject) return null;
            const count = classGrid.filter((s) => s.subjectId === subjectId).length;
            return (
              <div
                key={subjectId}
                className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100"
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                <span className="text-xs font-medium text-slate-700">{subject.name}</span>
                <span className="text-[10px] text-slate-400">{count}x</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Teachers summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Professores da Turma</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from(uniqueTeachers).map((teacherId) => {
            const teacher = getTeacher(teacherId);
            if (!teacher) return null;
            const count = classGrid.filter((s) => s.teacherId === teacherId).length;
            return (
              <div
                key={teacherId}
                className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ backgroundColor: teacher.color }}
                >
                  {teacher.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <span className="text-xs font-medium text-slate-700 truncate">{teacher.name}</span>
                <span className="text-[10px] text-slate-400">{count} aulas</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent occurrences */}
      {classOccurrences.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">Ocorrências Recentes da Turma</h3>
          </div>
          <div className="space-y-2">
            {classOccurrences
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 6)
              .map((o) => {
                const weekday = WEEKDAYS.find((d) => d.key === o.weekday);
                return (
                  <div key={o.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700">{o.type}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {weekday?.full} • {formatBlockTime(o.blockId)} • {getTeacher(o.teacherId)?.name ?? '—'}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${occTypeColors[o.type] ?? 'bg-slate-50 border-slate-300'} font-medium whitespace-nowrap`}>
                      {o.type}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
