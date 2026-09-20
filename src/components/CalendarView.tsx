import { useState, useMemo } from 'react';
import { Plus, AlertTriangle, User, BookOpen, Printer, CalendarDays } from 'lucide-react';
import type { Store } from '@/lib/store';
import type { Weekday } from '@/types';
import { TIME_BLOCKS, WEEKDAYS, formatBlockTime } from '@/lib/timeBlocks';
import { OccurrenceModal } from '@/components/OccurrenceModal';
import { useToast } from '@/components/Toast';
import { buildWhatsAppMessage, buildWhatsAppURL } from '@/lib/whatsapp';
import type { Occurrence } from '@/types';

type ViewMode = 'semanal' | 'diaria';

export function CalendarView({ store }: { store: Store }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [preselect, setPreselect] = useState<{ weekday: Weekday; blockId: number } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('semanal');
  const [selectedDay, setSelectedDay] = useState<Weekday>('segunda');
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

  function onSaved(occurrence: Occurrence, teacherName: string, type: string, email: string) {
    const teacher = teachers.find((t) => t.id === occurrence.teacherId);
    const schoolClass = classes.find((c) => c.id === occurrence.classId);
    const substituteTeacher = teachers.find((t) => t.id === occurrence.substituteTeacherId);

    let whatsappUrl: string | undefined;
    if (teacher && teacher.phone) {
      const message = buildWhatsAppMessage(occurrence, teacher, schoolClass, substituteTeacher);
      whatsappUrl = buildWhatsAppURL(teacher.phone, message);
    }

    showToast({
      title: 'Ocorrência registrada!',
      message: `${type} — ${teacherName}`,
      emailPreview: `E-mail enviado para ${email}`,
      whatsappUrl,
    });
  }

  function handlePrint() {
    window.print();
  }

  const selectedDayFull = WEEKDAYS.find((d) => d.key === selectedDay)?.full ?? '';

  const daysToShow = viewMode === 'semanal' ? WEEKDAYS : WEEKDAYS.filter((d) => d.key === selectedDay);
  const gridColsClass =
    viewMode === 'semanal'
      ? 'grid-cols-[140px_repeat(5,1fr)]'
      : 'grid-cols-[140px_1fr]';

  return (
    <div>
      {/* Print-only header */}
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-2xl font-bold text-black">HorárioRangel — Grade de Horários</h1>
        <p className="text-sm text-black mt-1">
          {viewMode === 'semanal' ? 'Visão Semanal — Segunda a Sexta' : selectedDayFull}
        </p>
      </div>

      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Calendário {viewMode === 'semanal' ? 'Semanal' : 'Diário'}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {viewMode === 'semanal'
              ? 'Segunda a Sexta — Grade de horários e ocorrências'
              : `Grade de ${selectedDayFull}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('semanal')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'semanal'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setViewMode('diaria')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'diaria'
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Diária
            </button>
          </div>

          {/* Day selector (only in daily mode) */}
          {viewMode === 'diaria' && (
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value as Weekday)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {WEEKDAYS.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.full}
                </option>
              ))}
            </select>
          )}

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimir Grade {viewMode === 'semanal' ? 'Semanal' : 'Diária'}
          </button>

          {/* Register occurrence */}
          <button
            onClick={handleQuickAddNoPreselect}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar Ocorrência
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className={`overflow-x-auto ${viewMode === 'semanal' ? 'print-landscape' : 'print-portrait'}`}>
        <div className={viewMode === 'semanal' ? 'min-w-[1000px] print:min-w-0' : 'min-w-[400px] print:min-w-0'}>
          {/* Header Row */}
          <div className={`grid ${gridColsClass} gap-1.5 mb-1.5`}>
            <div className="flex items-center justify-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Horário
            </div>
            {daysToShow.map((d) => (
              <div
                key={d.key}
                className="text-center py-2 rounded-lg bg-slate-100 text-sm font-semibold text-slate-600 print:bg-slate-200 print:text-black"
              >
                {d.short}
                <span className="hidden sm:inline text-slate-400 font-normal print:text-black/60"> — {d.full.replace('-feira', '')}</span>
              </div>
            ))}
          </div>

          {/* Time Blocks */}
          {TIME_BLOCKS.map((block) => {
            if (block.isBreak) {
              return (
                <div key={block.id} className={`grid ${gridColsClass} gap-1.5 mb-1.5`}>
                  <div className="flex items-center justify-center text-[11px] text-slate-400 font-medium bg-amber-50 rounded-lg py-1.5 border border-dashed border-amber-200 print:text-black print:bg-amber-100 print:border-amber-400">
                    {block.start}
                  </div>
                  <div className={`flex items-center justify-center text-[11px] text-amber-600 font-medium bg-amber-50 rounded-lg py-1.5 border border-dashed border-amber-200 print:text-black print:bg-amber-100 print:border-amber-400 ${viewMode === 'semanal' ? 'col-span-5' : ''}`}>
                    {block.label}
                  </div>
                </div>
              );
            }

            return (
              <div key={block.id} className={`grid ${gridColsClass} gap-1.5 mb-1.5`}>
                {/* Time label */}
                <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg py-1.5 border border-slate-100 print:bg-slate-100 print:text-black print:border-slate-300">
                  <span className="text-xs font-bold text-slate-600 print:text-black">{block.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 print:text-black/60">{block.start}–{block.end}</span>
                </div>

                {/* Day cells */}
                {daysToShow.map((d) => {
                  const key = `${d.key}-${block.id}`;
                  const slot = gridMap.get(key);
                  const occ = occMap.get(key);

                  return (
                    <div
                      key={key}
                      className="group relative min-h-[72px] rounded-lg border border-slate-100 bg-white hover:border-slate-200 transition-colors overflow-hidden print:border-slate-300 print:min-h-[48px]"
                    >
                      {slot && !occ && (
                        <div className="p-2 h-full flex flex-col">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0 print:border print:border-slate-400"
                              style={{ backgroundColor: getSubject(slot.subjectId)?.color ?? '#94a3b8' }}
                            />
                            <span className="text-xs font-semibold text-slate-700 truncate print:text-black">
                              {getSubject(slot.subjectId)?.name ?? '—'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 print:text-black">
                            <User className="w-3 h-3 flex-shrink-0 print:hidden" />
                            <span className="truncate">{getTeacher(slot.teacherId)?.name ?? '—'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 print:text-black">
                            <BookOpen className="w-3 h-3 flex-shrink-0 print:hidden" />
                            <span className="truncate">{getClass(slot.classId)?.name ?? '—'}</span>
                          </div>
                        </div>
                      )}

                      {occ && (
                        <div className={`p-2 h-full border-l-4 ${occTypeColors[occ.type] ?? 'bg-slate-50 border-slate-300'} print:border-l-4 print:border-slate-500 print:bg-white`}>
                          <div className="flex items-center gap-1 mb-0.5">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0 print:hidden" />
                            <span className="text-xs font-bold truncate print:text-black">{occ.type}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 truncate print:text-black">
                            {getTeacher(occ.teacherId)?.name ?? '—'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate print:text-black">
                            {getClass(occ.classId)?.name ?? '—'}
                          </p>
                          {occ.substituteTeacherId && (
                            <p className="text-[10px] text-slate-400 truncate mt-0.5 print:text-black">
                              Sub: {getTeacher(occ.substituteTeacherId)?.name ?? '—'}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Quick add button */}
                      <button
                        onClick={() => handleQuickAdd(d.key, block.id)}
                        className="no-print absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-100 hover:bg-sky-100 text-slate-400 hover:text-sky-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
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
      <div className="no-print mt-5 flex flex-wrap items-center gap-3 text-xs">
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
