import { useState, useMemo } from 'react';
import { Plus, AlertTriangle, User, BookOpen, X } from 'lucide-react';
import type { Store } from '@/lib/store';
import type { Weekday } from '@/types';
import { TIME_BLOCKS, WEEKDAYS, formatBlockTime } from '@/lib/timeBlocks';
import { OccurrenceModal } from '@/components/OccurrenceModal';
import { useToast } from '@/components/Toast';

export function CalendarView({ store }: { store: Store }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [preselect, setPreselect] = useState<{ weekday: Weekday; blockId: number } | null>(null);
  const { showToast } = useToast();

  const { grid, occurrences, teachers, subjects, classes } = store;

  const gridMap = useMemo(() => {
    const map = new Map<string, typeof grid[number]>();
    grid.forEach((s) => map.set(`${s.weekday}-${s.blockId}`, s));
    return map;
  }, [grid]);

  const occMap = useMemo(() => {
    const map = new Map<string, typeof occurrences[number]>();
    occurrences.forEach((o) => map.set(`${o.weekday}-${o.blockId}`, o));
    return map;
  }, [occurrences]);

  const getTeacher = (id: string) => teachers.find((t) => t.id === id);
  const getSubject = (id: string) => subjects.find((s) => s.id === id);
  const getClass = (id: string) => classes.find((c) => c.id === id);

  const occTypeColors: Record<string, string> = {
    Falta: 'bg-red-50 border-red-300 text-red-700',
    Formação: 'bg-violet-50 border-violet-300 text-violet-700',
    'Saída Cedo': 'bg-amber-50 border-amber-300 text-amber-700',
    'Palestra Escolar': 'bg-sky-50 border-sky-300 text-sky-700',
    Projeto: 'bg-emerald-50 border-emerald-300 text-emerald-700',
  };

  function handleQuickAdd(weekday: Weekday, blockId: number) {
    setPreselect({ weekday, blockId });
    setModalOpen(true);
  }

  function handleQuickAddNoPreselect() {
    setPreselect(null);
    setModalOpen(true);
  }

  function onSaved(teacherName: string, type: string, email: string) {
    showToast({
      title: 'Ocorrência registrada!',
      message: `${type} — ${teacherName}`,
      emailPreview: `E-mail enviado para ${email}`,
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Calendário Semanal</h2>
          <p className="text-sm text-slate-500 mt-0.5">Segunda a Sexta — Grade de horários e ocorrências</p>
        </div>
        <button
          onClick={handleQuickAddNoPreselect}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Registrar Ocorrência
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Header Row */}
          <div className="grid grid-cols-[140px_repeat(5,1fr)] gap-1.5 mb-1.5">
            <div className="flex items-center justify-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Horário
            </div>
            {WEEKDAYS.map((d) => (
              <div
                key={d.key}
                className="text-center py-2 rounded-lg bg-slate-100 text-sm font-semibold text-slate-600"
              >
                {d.short}
                <span className="hidden sm:inline text-slate-400 font-normal"> — {d.full.replace('-feira', '')}</span>
              </div>
            ))}
          </div>

          {/* Time Blocks */}
          {TIME_BLOCKS.map((block) => {
            if (block.isBreak) {
              return (
                <div key={block.id} className="grid grid-cols-[140px_repeat(5,1fr)] gap-1.5 mb-1.5">
                  <div className="flex items-center justify-center text-[11px] text-slate-400 font-medium bg-amber-50 rounded-lg py-1.5 border border-dashed border-amber-200">
                    {block.start}
                  </div>
                  <div className="col-span-5 flex items-center justify-center text-[11px] text-amber-600 font-medium bg-amber-50 rounded-lg py-1.5 border border-dashed border-amber-200">
                    {block.label}
                  </div>
                </div>
              );
            }

            return (
              <div key={block.id} className="grid grid-cols-[140px_repeat(5,1fr)] gap-1.5 mb-1.5">
                {/* Time label */}
                <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg py-1.5 border border-slate-100">
                  <span className="text-xs font-bold text-slate-600">{block.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{block.start}–{block.end}</span>
                </div>

                {/* Day cells */}
                {WEEKDAYS.map((d) => {
                  const key = `${d.key}-${block.id}`;
                  const slot = gridMap.get(key);
                  const occ = occMap.get(key);

                  return (
                    <div
                      key={key}
                      className="group relative min-h-[72px] rounded-lg border border-slate-100 bg-white hover:border-slate-200 transition-colors overflow-hidden"
                    >
                      {slot && !occ && (
                        <div className="p-2 h-full flex flex-col">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getSubject(slot.subjectId)?.color ?? '#94a3b8' }}
                            />
                            <span className="text-xs font-semibold text-slate-700 truncate">
                              {getSubject(slot.subjectId)?.name ?? '—'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{getTeacher(slot.teacherId)?.name ?? '—'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                            <BookOpen className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{getClass(slot.classId)?.name ?? '—'}</span>
                          </div>
                        </div>
                      )}

                      {occ && (
                        <div className={`p-2 h-full border-l-4 ${occTypeColors[occ.type] ?? 'bg-slate-50 border-slate-300'}`}>
                          <div className="flex items-center gap-1 mb-0.5">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                            <span className="text-xs font-bold truncate">{occ.type}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 truncate">
                            {getTeacher(occ.teacherId)?.name ?? '—'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {getClass(occ.classId)?.name ?? '—'}
                          </p>
                          {occ.substituteTeacherId && (
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              Sub: {getTeacher(occ.substituteTeacherId)?.name ?? '—'}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Quick add button */}
                      <button
                        onClick={() => handleQuickAdd(d.key, block.id)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-100 hover:bg-sky-100 text-slate-400 hover:text-sky-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        title="Registrar ocorrência"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
        <span className="font-semibold text-slate-500">Tipos de Ocorrência:</span>
        {Object.entries(occTypeColors).map(([type, cls]) => (
          <span key={type} className={`px-2.5 py-1 rounded-full border ${cls} font-medium`}>
            {type}
          </span>
        ))}
      </div>

      <OccurrenceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        store={store}
        preselect={preselect}
        onSaved={onSaved}
      />
    </div>
  );
}
