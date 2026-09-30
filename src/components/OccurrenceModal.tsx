import { useState, useEffect } from 'react';
import type { Store } from '@/lib/store';
import type { Weekday } from '@/types';
import { WEEKDAYS, TIME_BLOCKS } from '@/lib/timeBlocks';

interface OccurrenceModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (occurrence: any, teacherName: string, type: string, email: string) => void;
  preselect: { weekday: Weekday; blockId: number } | null;
  store: Store;
}

export function OccurrenceModal({ open, onClose, onSaved, preselect, store }: OccurrenceModalProps) {
  const { teachers, classes, addOccurrence } = store;

  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [weekday, setWeekday] = useState<Weekday>('segunda');
  const [blockId, setBlockId] = useState<number>(1);
  const [type, setType] = useState('Falta');
  const [motivo, setMotivo] = useState('');

  // Sincronizar o formulário caso a gestão clique em um horário específico do calendário
  useEffect(() => {
    if (preselect) {
      setWeekday(preselect.weekday);
      setBlockId(preselect.blockId);
    }
  }, [preselect, open]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teacherId || !classId) return;

    const teacher = teachers.find((t) => t.id === teacherId);

    const log = addOccurrence({
      teacherId,
      classId,
      weekday,
      blockId,
      type,
      motivo,
      substituteTeacherId: '',
      date: new Date().toLocaleDateString('pt-BR'),
    });

    onSaved(
      { teacherId, classId, weekday, blockId, type, motivo },
      teacher?.name || 'Professor',
      type,
      teacher?.email || ''
    );

    // Limpar o formulário
    setTeacherId('');
    setClassId('');
    setMotivo('');
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">Registrar Ocorrência</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-medium">
            Fechar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Professor Ausente / Envolvido</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              required
            >
              <option value="">Selecione o professor...</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Turma Afetada</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              required
            >
              <option value="">Selecione a turma...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Dia da Semana</label>
              <select
                value={weekday}
                onChange={(e) => setWeekday(e.target.value as Weekday)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {WEEKDAYS.map((d) => (
                  <option key={d.key} value={d.key}>{d.full}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Horário / Bloco</label>
              <select
                value={blockId}
                onChange={(e) => setBlockId(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {TIME_BLOCKS.filter(b => !b.isBreak).map((b) => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo de Ocorrência</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="Falta">Falta</option>
              <option value="Formação">Formação</option>
              <option value="Saída Cedo">Saída Cedo</option>
              <option value="Palestra Escolar">Palestra Escolar</option>
              <option value="Projeto">Projeto</option>
              <option value="Permuta">Permuta</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Motivo / Observações (Opcional)</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Licença médica, atraso de ônibus..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 h-20 resize-none"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-2 rounded-lg text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 rounded-lg text-sm transition-colors shadow-sm"
            >
              Confirmar e Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

   
     
