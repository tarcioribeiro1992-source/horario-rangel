import { useState, useMemo } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { Store } from '@/lib/store';
import type { Weekday } from '@/types';
import { TIME_BLOCKS, WEEKDAYS, formatBlockTime } from '@/lib/timeBlocks';

export function GridView({ store }: { store: Store }) {
  const { grid, teachers, subjects, classes, addGridSlot, deleteGridSlot, checkCollisions } = store;
  const [weekday, setWeekday] = useState<Weekday>('segunda');
  const [blockId, setBlockId] = useState<number>(1);
  const [teacherId, setTeacherId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');

  const gridMap = useMemo(() => {
    const map = new Map<string, typeof grid>();
    grid.forEach((s) => {
      const key = `${s.weekday}-${s.blockId}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [grid]);

  const getTeacher = (id: string) => teachers.find((t) => t.id === id);
  const getSubject = (id: string) => subjects.find((s) => s.id === id);
  const getClass = (id: string) => classes.find((c) => c.id === id);

  const collisions = useMemo(() => {
    if (!classId || !subjectId || !teacherId) return [];
    return checkCollisions(weekday, blockId, teacherId, classId);
  }, [weekday, blockId, teacherId, classId, subjectId, checkCollisions]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectId || !classId) return; // Removida a obrigatoriedade do professor
    // Se o professor estiver vazio, envia uma string vazia ou nula para o banco
    addGridSlot(weekday, blockId, teacherId || '', subjectId, classId);
    setTeacherId('');
    setSubjectId('');
    setClassId('');
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-800">Grade Curricular</h2>
        <p className="text-sm text-slate-500 mt-0.5">Monte a grade regular de aulas da semana</p>
      </div>

      {/* Add Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Adicionar Aula à Grade</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Dia</label>
            <select
              value={weekday}
              onChange={(e) => setWeekday(e.target.value as Weekday)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {WEEKDAYS.map((d) => (
                <option key={d.key} value={d.key}>{d.short}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Horário</label>
            <select
              value={blockId}
              onChange={(e) => setBlockId(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {TIME_BLOCKS.filter((b) => !b.isBreak).map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Professor</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="">Clube/Eletiva</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Disciplina</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="">Selecione...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Turma</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="">Selecione...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!subjectId || !classId} // Removida a trava do professor no botão de adicionar
              className="w-full flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </div>
        </form>

        {collisions.length > 0 && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Conflito detectado:
            </div>
            {collisions.map((c, i) => (
              <p key={i} className="text-xs text-red-600 pl-5">{c.message}</p>
            ))}
          </div>
        )}
      </div>

      {/* Grid Display */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[140px_repeat(5,1fr)] gap-1.5 mb-1.5">
            <div className="text-xs font-semibold text-slate-400 uppercase flex items-center justify-center">
              Horário
            </div>
            {WEEKDAYS.map((d) => (
              <div key={d.key} className="text-center py-2 rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
                {d.short}
              </div>
            ))}
          </div>
          {TIME_BLOCKS.filter((b) => !b.isBreak).map((block) => (
            <div key={block.id} className="grid grid-cols-[140px_repeat(5,1fr)] gap-1.5 mb-1.5">
              <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg py-1.5 border border-slate-100">
                <span className="text-xs font-bold text-slate-600">{block.label}</span>
                <span className="text-[10px] text-slate-400">{formatBlockTime(block.id)}</span>
              </div>
              {WEEKDAYS.map((d) => {
                const key = `${d.key}-${block.id}`;
                const slots = gridMap.get(key) ?? [];
                return (
                  <div key={key} className="min-h-[60px] rounded-lg border border-slate-100 bg-white p-1.5 space-y-1">
                    {slots.map((s) => {
                      const teacherObj = getTeacher(s.teacherId);
                      return (
                        <div
                          key={s.id}
                          className="group flex items-center gap-1 bg-slate-50 rounded-md px-1.5 py-1 text-[11px]"
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getSubject(s.subjectId)?.color }}
                          />
                          <span className="font-medium text-slate-700 truncate flex-1">
                            {getSubject(s.subjectId)?.name}
                          </span>
                          <span className="text-slate-400 hidden lg:inline truncate">
                            {teacherObj ? teacherObj.name.split(' ')[0] : 'Sem Prof.'}
                          </span>
                          <span className="text-slate-400">{getClass(s.classId)?.name}</span>
                          <button
                            onClick={() => deleteGridSlot(s.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
