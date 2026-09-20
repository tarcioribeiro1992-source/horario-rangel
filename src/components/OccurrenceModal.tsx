import { useState, useEffect, useMemo } from 'react';
import { X, AlertTriangle, CheckCircle2, Mail } from 'lucide-react';
import type { Store } from '@/lib/store';
import type { Weekday, OccurrenceType } from '@/types';
import { WEEKDAYS, TEACHING_BLOCK_IDS, formatBlockTime } from '@/lib/timeBlocks';

const OCCURRENCE_TYPES: OccurrenceType[] = [
  'Falta',
  'Formação',
  'Saída Cedo',
  'Palestra Escolar',
  'Projeto',
];

interface Props {
  open: boolean;
  onClose: () => void;
  store: Store;
  preselect: { weekday: Weekday; blockId: number } | null;
  onSaved: (teacherName: string, type: string, email: string) => void;
}

export function OccurrenceModal({ open, onClose, store, preselect, onSaved }: Props) {
  const [weekday, setWeekday] = useState<Weekday>('segunda');
  const [blockId, setBlockId] = useState<number>(1);
  const [teacherId, setTeacherId] = useState<string>('');
  const [classId, setClassId] = useState<string>('');
  const [type, setType] = useState<OccurrenceType>('Falta');
  const [note, setNote] = useState('');
  const [substituteTeacherId, setSubstituteTeacherId] = useState<string>('');

  const { teachers, classes, checkCollisions, addOccurrence } = store;

  useEffect(() => {
    if (open) {
      if (preselect) {
        setWeekday(preselect.weekday);
        setBlockId(preselect.blockId);
        const slot = store.grid.find(
          (s) => s.weekday === preselect.weekday && s.blockId === preselect.blockId,
        );
        if (slot) {
          setTeacherId(slot.teacherId);
          setClassId(slot.classId);
        } else {
          setTeacherId(teachers[0]?.id ?? '');
          setClassId(classes[0]?.id ?? '');
        }
      } else {
        setTeacherId(teachers[0]?.id ?? '');
        setClassId(classes[0]?.id ?? '');
      }
      setType('Falta');
      setNote('');
      setSubstituteTeacherId('');
    }
  }, [open, preselect, store.grid, teachers, classes]);

  const collisions = useMemo(() => {
    if (!teacherId || !classId) return [];
    return checkCollisions(weekday, blockId, teacherId, classId);
  }, [weekday, blockId, teacherId, classId, checkCollisions]);

  const teacher = teachers.find((t) => t.id === teacherId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teacherId || !classId) return;

    const emailLog = addOccurrence({
      weekday,
      blockId,
      teacherId,
      classId,
      type,
      note,
      substituteTeacherId: substituteTeacherId || null,
    });

    onSaved(teacher?.name ?? 'Professor', type, emailLog.to);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-lg font-bold text-slate-800">Registrar Ocorrência</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Day + Block */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Dia da Semana</label>
              <select
                value={weekday}
                onChange={(e) => setWeekday(e.target.value as Weekday)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {WEEKDAYS.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.full}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Horário</label>
              <select
                value={blockId}
                onChange={(e) => setBlockId(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {TEACHING_BLOCK_IDS.map((id) => (
                  <option key={id} value={id}>
                    {formatBlockTime(id)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Teacher + Class */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Professor</label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Turma</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tipo de Ocorrência</label>
            <div className="flex flex-wrap gap-2">
              {OCCURRENCE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    type === t
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Substitute */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Professor Substituto (opcional)
            </label>
            <select
              value={substituteTeacherId}
              onChange={(e) => setSubstituteTeacherId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="">Nenhum</option>
              {teachers
                .filter((t) => t.id !== teacherId)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Observação</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Motivo ou detalhes da ocorrência..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
            />
          </div>

          {/* Collision Warnings */}
          {collisions.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-red-700">
                <AlertTriangle className="w-4 h-4" />
                Conflito Detectado
              </div>
              {collisions.map((c, i) => (
                <p key={i} className="text-xs text-red-600 pl-5">
                  {c.message}
                </p>
              ))}
            </div>
          )}

          {/* Email Preview */}
          {teacher && (
            <div className="bg-sky-50 border border-sky-100 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 mb-1">
                <Mail className="w-3.5 h-3.5" />
                E-mail de notificação será enviado para:
              </div>
              <p className="text-xs text-sky-600 pl-5">{teacher.email}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Salvar Ocorrência
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
