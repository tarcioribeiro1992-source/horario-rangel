import { useState, useMemo } from 'react';
import { Plus, AlertTriangle, Printer, Trash2 } from 'lucide-react';
import type { Store } from '@/lib/store';
import type { Weekday } from '@/types';
import { TIME_BLOCKS, WEEKDAYS } from '@/lib/timeBlocks';
import { useToast } from '@/components/Toast';
import { buildWhatsAppMessage, buildWhatsAppURL } from '@/lib/whatsapp';
import { OccurrenceModal } from '@/components/OccurrenceModal';
import type { Occurrence } from '@/types';

type ViewMode = 'semanal' | 'diaria';

export function CalendarView({ store }: { store: Store }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [preselect, setPreselect] = useState<{ weekday: Weekday; blockId: number } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('semanal');
  const [selectedDay, setSelectedDay] = useState<Weekday>('segunda');
  const { showToast } = useToast();

  const { grid, occurrences, teachers, subjects, classes, deleteOccurrence } = store;

  const normalizeKey = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const gridMap = useMemo(() => {
    const map = new Map<string, typeof grid>();
    grid.forEach((s) => {
      const dayKey = normalizeKey(s.weekday || '');
      const mapKey = `${dayKey}-${s.blockId}`;
      const existing = map.get(mapKey) || [];
      map.set(mapKey, [...existing, s]);
    });
    return map;
  }, [grid]);

  const occMap = useMemo(() => {
    const map = new Map<string, typeof occurrences>();
    occurrences.forEach((o) => {
      const dayKey = normalizeKey(o.weekday || '');
      const mapKey = `${dayKey}-${o.blockId}`;
      const existing = map.get(mapKey) || [];
      map.set(mapKey, [...existing, o]);
    });
    return map;
  }, [occurrences]);

  const getTeacher = (id: string) => teachers.find((t) => t.id === id);
  const getSubject = (id: string) => subjects.find((s) => s.id === id || s.name === id);
  const getClass = (id: string) => classes.find((c) => c.id === id || c.name === id);

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
    const schoolClass = classes.find((c) => c.id === occurrence.classId || c.name === occurrence.classId);
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
  const gridColsClass = viewMode === 'semanal' ? 'grid-cols-[140px_repeat(5,1fr)]' : 'grid-cols-[140px_1fr]';

  return (
    <div>
      {/* Estilo secreto para forçar a impressão em apenas uma página A4 */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: landscape;
            margin: 0.5cm;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 11px !important;
          }
          .no-print {
            display: none !important;
          }
          /* Encolher a grade para caber na folha */
          main, div, .overflow-x-auto, .grid {
            margin: 0 !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
          }
          .min-h-\\[72px\\], .min-h-\\[48px\\] {
            min-height: 42px !important;
            height: 42px !important;
            padding: 2px !important;
          }
          span, p {
            font-size: 9px !important;
            line-height: 1.1 !important;
            margin: 0 !important;
          }
        }
      `}} />

      {/* Print-only header */}
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-2xl font-bold text-black">Horário Rangel — Grade de Horários</h1>
        <p className="text-sm text-black mt-1">
          {viewMode === 'semanal' ? 'Visão Semanal — Segunda a Sexta' : selectedDayFull}
        </p>
      </div>

      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Calendário {viewMode === 'semanal' ? 'Semanal' : 'Diário'}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {viewMode === 'semanal' ? 'Segunda a Sexta — Grade de horários e ocorrências' : `Grade de ${selectedDayFull}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('semanal')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'semanal' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Semanal
            </button>
            <button
              onClick={() => setViewMode('diaria')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'diaria' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Diária
            </button>
          </div>

          {viewMode === 'diaria' && (
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value as Weekday)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {WEEKDAYS.map((d) => (
                <option key={d.key} value={d.key}>{d.full}</option>
              ))}
            </select>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimir Grade {viewMode === 'semanal' ? 'Semanal' : 'Diária'}
          </button>

          <button
            onClick={handleQuickAddNoPreselect}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar Ocorrência
          </button>
        </div>
      </div>
      <div className={`overflow-x-auto ${viewMode === 'semanal' ? 'print-landscape' : 'print-portrait'}`}>
        <div className={viewMode === 'semanal' ? 'min-w-[1000px] print:min-w-0' : 'min-w-[400px] print:min-w-0'}>
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
                <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg py-1.5 border border-slate-100 print:bg-slate-100 print:text-black print:border-slate-300">
                  <span className="text-xs font-bold text-slate-600 print:text-black">{block.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 print:text-black/60">{block.start}–{block.end}</span>
                </div>

                {daysToShow.map((d) => {
                  const key = `${normalizeKey(d.key)}-${block.id}`;
                  const slots = gridMap.get(key) || [];
                  const occs = occMap.get(key) || [];

                  return (
                    <div
                      key={key}
                      className="group relative min-h-[72px] rounded-lg border border-slate-100 bg-white hover:border-slate-200 transition-colors overflow-hidden print:border-slate-300 print:min-h-[48px] flex flex-col gap-1 p-1"
                    >
                      {slots.map((slot) => {
                        const hasOcc = occs.find(o => o.teacherId === slot.teacherId);
                        if (hasOcc) return null;

                        return (
                          <div key={slot.id} className="p-1 border border-slate-50 rounded bg-slate-50/50 flex flex-col text-[11px]">
                            <div className="flex items-center gap-1 mb-0.5">
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: getSubject(slot.subjectId)?.color ?? '#94a3b8' }}
                              />
                              <span className="font-semibold text-slate-700 truncate">
                                {getSubject(slot.subjectId)?.name ?? '—'}
                              </span>
                            </div>
                            <div className="text-slate-500 truncate font-medium">Prof: {getTeacher(slot.teacherId)?.name ?? '—'}</div>
                            <div className="text-slate-400 truncate">Turma: {getClass(slot.classId)?.name ?? '—'}</div>
                          </div>
                        );
                      })}

                      {occs.map((occ) => (
                        <div key={occ.id} className={`group/occ p-1 border-l-4 rounded ${occTypeColors[occ.type] ?? 'bg-slate-50 border-slate-300'} flex flex-col text-[11px]`}>
                          <div className="flex items-center justify-between gap-1 font-bold mb-0.5 text-xs">
                            <div className="flex items-center gap-1 min-w-0">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{occ.type}</span>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm('Excluir esta ocorrência?')) {
                                  deleteOccurrence(occ.id);
                                }
                              }}
                              className="no-print w-5 h-5 rounded-full bg-white/60 hover:bg-red-100 text-slate-400 hover:text-red-600 flex items-center justify-center transition-all flex-shrink-0"
                              title="Excluir ocorrência"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="truncate">Prof: {getTeacher(occ.teacherId)?.name ?? '—'}</div>
                          <div className="truncate">Turma: {getClass(occ.classId)?.name ?? '—'}</div>
                          {occ.substituteTeacherId && (
                            <div className="text-[10px] text-slate-400 truncate">Sub: {getTeacher(occ.substituteTeacherId)?.name ?? '—'}</div>
                          )}
                        </div>
                      ))}

                      <button
                        onClick={() => handleQuickAdd(d.key, block.id)}
                        className="no-print absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-100 hover:bg-sky-100 text-slate-400 hover:text-sky-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
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

      <OccurrenceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={onSaved}
        preselect={preselect}
        store={store}
      />
    </div>
  );
}
