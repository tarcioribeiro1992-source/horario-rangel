import { useMemo } from 'react';
import { BookOpen, User, Clock } from 'lucide-react';
import type { Store } from '@/lib/store';
import { TIME_BLOCKS, WEEKDAYS, formatBlockTime } from '@/lib/timeBlocks';

export function ClassDashboard({ store }: { store: Store }) {
  const { teachers, subjects, classes, grid, occurrences } = store;
  
  // Pegar a turma selecionada na memória temporária do app (usaremos o campo de ID selecionado do store)
  const selectedClassId = store.selectedTeacherId; 
  const currentClass = classes.find((c) => c.id === selectedClassId);

  const classGrid = useMemo(() => 
    grid.filter((s) => s.classId === selectedClassId), 
    [grid, selectedClassId]
  );

  const getTeacher = (id: string) => teachers.find((t) => t.id === id);
  const getSubject = (id: string) => subjects.find((s) => s.id === id || s.name === id);

  if (!currentClass) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Selecione sua turma no topo da página para ver os horários.
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Cabeçalho da Turma */}
      <div className="bg-gradient-to-r from-sky-600 to-indigo-600 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Turma: {currentClass.name}</h2>
            <p className="text-sm text-white/80">{currentClass.grade || 'Ensino Médio / Técnico'}</p>
          </div>
        </div>
      </div>

      {/* Calendário da Turma */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Dias da semana */}
            <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-1.5 mb-1.5">
              <div className="text-xs text-slate-400 flex items-center justify-center">Horário</div>
              {WEEKDAYS.map((d) => (
                <div key={d.key} className="text-center py-1.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                  {d.short}
                </div>
              ))}
            </div>

            {/* Blocos de Horário */}
            {TIME_BLOCKS.filter((b) => !b.isBreak).map((block) => (
              <div key={block.id} className="grid grid-cols-[100px_repeat(5,1fr)] gap-1.5 mb-1.5">
                <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg py-1 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-600">{block.label}</span>
                  <span className="text-[9px] text-slate-400">{formatBlockTime(block.id)}</span>
                </div>

                {WEEKDAYS.map((d) => {
                  const slot = classGrid.find((s) => s.weekday.toLowerCase() === d.key && s.blockId === block.id);
                  const occ = occurrences.find((o) => o.classId === selectedClassId && o.weekday.toLowerCase() === d.key && o.blockId === block.id);

                  return (
                    <div key={`${d.key}-${block.id}`} className="min-h-[55px] rounded-lg border border-slate-100 bg-white p-1.5 flex flex-col justify-center">
                      {slot && !occ && (
                        <div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getSubject(slot.subjectId)?.color ?? '#94a3b8' }} />
                            <span className="text-[11px] font-bold text-slate-700 truncate">
                              {getSubject(slot.subjectId)?.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-0.5">
                            <User className="w-2.5 h-2.5" />
                            {getTeacher(slot.teacherId)?.name || 'Clube'}
                          </div>
                        </div>
                      )}

                      {occ && (
                        <div className="p-1 rounded bg-red-50 border-l-2 border-red-400 text-red-700 text-[10px]">
                          <span className="font-bold block">{occ.type}</span>
                          <span className="text-slate-500 truncate block">Falta: {getTeacher(occ.teacherId)?.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
