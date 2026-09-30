import { useMemo } from 'react';
import { Clock, MapPin, AlertTriangle, UserCheck, Calendar } from 'lucide-react';
import type { Store } from '@/lib/store';
import { TIME_BLOCKS, WEEKDAYS, formatBlockTime } from '@/lib/timeBlocks';

const occTypeColors: Record<string, string> = {
  Falta: 'bg-red-50 border-red-300 text-red-700',
  Formação: 'bg-violet-50 border-violet-300 text-violet-700',
  'Saída Cedo': 'bg-amber-50 border-amber-300 text-amber-700',
  'Palestra Escolar': 'bg-sky-50 border-sky-300 text-sky-700',
  Projeto: 'bg-emerald-50 border-emerald-300 text-emerald-700',
  Permuta: 'bg-cyan-50 border-cyan-300 text-cyan-700',
};

export function TeacherDashboard({ store }: { store: Store }) {
  const { selectedTeacherId, teachers, subjects, classes, grid, occurrences } = store;
  const teacher = teachers.find((t) => t.id === selectedTeacherId);

  // Função para limpar e normalizar textos (evita quebras por acentos ou maiúsculas)
  const normalizeText = (text: string) => 
    text ? text.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

  // Filtros flexíveis com proteção extra contra espaços e quebras de texto
  const myGrid = useMemo(() => {
    const targetId = (selectedTeacherId || '').trim();
    return grid.filter((s) => {
      if (!s.teacherId) return false;
      const cleanTeacherId = s.teacherId.trim();
      return cleanTeacherId === targetId || cleanTeacherId.split('/').map(id => id.trim()).includes(targetId);
    });
  }, [grid, selectedTeacherId]);
  
  const myOccurrences = useMemo(() => {
    const targetId = (selectedTeacherId || '').trim();
    return occurrences.filter((o) => {
      if (!o.teacherId) return false;
      const cleanTeacherId = o.teacherId.trim();
      return cleanTeacherId === targetId || cleanTeacherId.split('/').map(id => id.trim()).includes(targetId);
    });
  }, [occurrences, selectedTeacherId]);
  
  const mySubstitutions = useMemo(() => {
    const targetId = (selectedTeacherId || '').trim();
    return occurrences.filter((o) => {
      if (!o.substituteTeacherId) return false;
      const cleanSubId = o.substituteTeacherId.trim();
      return cleanSubId === targetId || cleanSubId.split('/').map(id => id.trim()).includes(targetId);
    });
  }, [occurrences, selectedTeacherId]);

  const getSubject = (id: string) => subjects.find((s) => s.id === id);
  const getClass = (id: string) => classes.find((c) => c.id === id);

  if (!teacher) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        Selecione um professor no topo da página.
      </div>
    );
  }

  return (
    <div>
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-teal-500 to-sky-500 rounded-2xl p-6 mb-5 text-white">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white/30"
            style={{ backgroundColor: teacher.color }}
          >
            {teacher.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <h2 className="text-xl font-bold">{teacher.name}</h2>
            <p className="text-sm text-white/80">{teacher.email}</p>
          </div>
          <div className="ml-auto flex gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{myGrid.length}</p>
              <p className="text-xs text-white/70">Aulas/Semana</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{myOccurrences.length}</p>
              <p className="text-xs text-white/70">Ocorrências</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{mySubstitutions.length}</p>
              <p className="text-xs text-white/70">Substituições</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Schedule */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-700">Meu Horário Semanal</h3>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Day headers */}
                <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-1.5 mb-1.5">
                  <div className="text-xs text-slate-400 flex items-center justify-center">Horário</div>
                  {WEEKDAYS.map((d) => (
                    <div key={d.key} className="text-center py-1.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                      {d.short}
                    </div>
                  ))}
                </div>
                {/* Blocks */}
                {TIME_BLOCKS.filter((b) => !b.isBreak).map((block) => (
                  <div key={block.id} className="grid grid-cols-[100px_repeat(5,1fr)] gap-1.5 mb-1.5">
                    <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg py-1 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-600">{block.label}</span>
                      <span className="text-[9px] text-slate-400">{formatBlockTime(block.id)}</span>
                    </div>
                    {WEEKDAYS.map((d) => {
                      const slot = myGrid.find((s) => normalizeText(s.weekday) === normalizeText(d.key) && s.blockId === block.id);
                      const occ = myOccurrences.find((o) => normalizeText(o.weekday) === normalizeText(d.key) && o.blockId === block.id);
                      const sub = mySubstitutions.find((o) => normalizeText(o.weekday) === normalizeText(d.key) && o.blockId === block.id);
                      return (
                        <div key={`${d.key}-${block.id}`} className="min-h-[50px] rounded-lg border border-slate-100 bg-white p-1.5">
                          {slot && !occ && (
                            <div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getSubject(slot.subjectId)?.color }} />
                                <span className="text-[11px] font-semibold text-slate-700 truncate">
                                  {getSubject(slot.subjectId)?.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500">
                                <MapPin className="w-2.5 h-2.5" />
                                {getClass(slot.classId)?.name}
                              </div>
                            </div>
                          )}
                          {occ && (
                            <div className={`p-1 rounded border-l-2 ${occTypeColors[occ.type] ?? 'bg-slate-50'}`}>
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span className="text-[10px] font-bold truncate">{occ.type}</span>
                              </div>
                              {occ.substituteTeacherId && (
                                <p className="text-[9px] text-slate-500 truncate mt-0.5">
                                  Sub: {teachers.find((t) => t.id === occ.substituteTeacherId)?.name}
                                </p>
                              )}
                            </div>
                          )}
                          {sub && (
                            <div className="p-1 rounded bg-teal-50 border-l-2 border-teal-400">
                              <div className="flex items-center gap-1">
                                <UserCheck className="w-2.5 h-2.5 text-teal-600" />
                                <span className="text-[10px] font-bold text-teal-700 truncate">Substituição</span>
                              </div>
                              <p className="text-[9px] text-teal-600 truncate mt-0.5">
                                Por: {teachers.find((t) => t.id === sub.teacherId)?.name}
                              </p>
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

        {/* Recent Occurrences */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-700">Ajustes Recentes</h3>
            </div>
            {myOccurrences.length === 0 && mySubstitutions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Nenhum ajuste registrado.</p>
            ) : (
              <div className="space-y-2.5">
                {[...myOccurrences, ...mySubstitutions]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 8)
                  .map((o) => {
                    const isSub = o.substituteTeacherId === selectedTeacherId;
                    const weekday = WEEKDAYS.find((d) => d.key === o.weekday);
                    return (
                      <div key={o.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          isSub ? 'bg-teal-500' : ''
                        }`} style={{ backgroundColor: isSub ? '#14B8A6' : undefined }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700">
                            {isSub ? `Substituição — ${o.type}` : o.type}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {weekday?.full} • {formatBlockTime(o.blockId)} • {getClass(o.classId)?.name}
                          </p>
                          {o.note && <p className="text-[11px] text-slate-400 mt-0.5 italic truncate">"{o.note}"</p>}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
