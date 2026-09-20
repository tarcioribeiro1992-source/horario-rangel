import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import type { Store } from '@/lib/store';
import type { SchoolClass } from '@/types';

export function ClassesView({ store }: { store: Store }) {
  const { classes, grid, addClass, updateClass, deleteClass } = store;
  const [editing, setEditing] = useState<SchoolClass | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');

  function openAdd() {
    setEditing(null);
    setName('');
    setGrade('');
    setShowForm(true);
  }

  function openEdit(c: SchoolClass) {
    setEditing(c);
    setName(c.name);
    setGrade(c.grade);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) updateClass(editing.id, name, grade);
    else addClass(name, grade);
    setShowForm(false);
  }

  function getSlotCount(classId: string) {
    return grid.filter((s) => s.classId === classId).length;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Turmas</h2>
          <p className="text-sm text-slate-500 mt-0.5">{classes.length} turmas cadastradas</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Turma
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {classes.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800 text-base">{c.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{c.grade}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-sky-600">{getSlotCount(c.id)}</p>
                <p className="text-[10px] text-slate-400 uppercase">aulas/semana</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => openEdit(c)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-sky-600 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </button>
              <button
                onClick={() => {
                  if (confirm(`Remover turma ${c.name}?`)) deleteClass(c.id);
                }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition-colors ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">{editing ? 'Editar Turma' : 'Nova Turma'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nome da Turma</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: 6º A"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Ano/Série</label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="Ex: 6º ano"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-sm"
                >
                  {editing ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
