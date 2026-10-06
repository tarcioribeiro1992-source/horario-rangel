import { useState } from 'react';
import { Plus, Copy, Trash2, Pencil, Calendar, Check, X, Layers } from 'lucide-react';
import type { Store } from '@/lib/store';

export function ScheduleVersionsView({ store }: { store: Store }) {
  const { schedules, activeScheduleId, setActiveScheduleId, addSchedule, renameSchedule, deleteSchedule, duplicateSchedule, allGrid } = store;
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [duplicateFrom, setDuplicateFrom] = useState<string | null>(null);
  const [dupName, setDupName] = useState('');

  const slotCount = (scheduleId: string) =>
    allGrid.filter((s) => (s.scheduleId || 'regular') === scheduleId).length;

  function handleCreate() {
    if (!newName.trim()) return;
    const id = addSchedule(newName.trim());
    setActiveScheduleId(id);
    setNewName('');
    setShowCreate(false);
  }

  function handleDuplicate() {
    if (!duplicateFrom || !dupName.trim()) return;
    const id = duplicateSchedule(duplicateFrom, dupName.trim());
    setActiveScheduleId(id);
    setDuplicateFrom(null);
    setDupName('');
  }

  function handleRename(id: string) {
    if (!editName.trim()) return;
    renameSchedule(id, editName.trim());
    setEditingId(null);
    setEditName('');
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-800">Versões de Horário</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Crie horários temporários sem alterar a grade regular. Selecione qual versão está ativa para visualização e edição.
        </p>
      </div>

      {/* Active schedule banner */}
      <div className="bg-gradient-to-r from-sky-600 to-teal-500 rounded-2xl p-5 text-white shadow-sm mb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-white/70 uppercase tracking-wide">Versão ativa</p>
            <h3 className="text-lg font-bold">
              {schedules.find((s) => s.id === activeScheduleId)?.name ?? 'Grade Regular'}
            </h3>
          </div>
          <div className="hidden sm:block text-center">
            <p className="text-2xl font-bold">{slotCount(activeScheduleId)}</p>
            <p className="text-[10px] text-white/70 uppercase">Aulas</p>
          </div>
        </div>
      </div>

      {/* Schedule list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Todas as versões</h3>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova versão
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {schedules.map((sched) => {
            const isActive = sched.id === activeScheduleId;
            const count = slotCount(sched.id);
            return (
              <div
                key={sched.id}
                className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                  isActive ? 'bg-sky-50' : 'hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  {editingId === sched.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(sched.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-400 w-full max-w-[240px]"
                      />
                      <button onClick={() => handleRename(sched.id)} className="text-sky-600 hover:text-sky-700">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800 truncate">{sched.name}</span>
                        {sched.isRegular && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">
                            Regular
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full font-medium">
                            Ativa
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{count} aulas na grade</p>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {!isActive && (
                    <button
                      onClick={() => setActiveScheduleId(sched.id)}
                      className="text-xs font-medium text-sky-600 hover:text-sky-700 px-3 py-1.5 rounded-lg hover:bg-sky-100 transition-colors"
                    >
                      Ativar
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setDuplicateFrom(sched.id);
                      setDupName(`${sched.name} (cópia)`);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {!sched.isRegular && (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(sched.id);
                          setEditName(sched.name);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Renomear"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Excluir a versão "${sched.name}"? Todas as aulas desta versão serão removidas.`)) {
                            deleteSchedule(sched.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Nova versão de horário</h3>
            <p className="text-sm text-slate-500 mb-4">
              A nova versão começará vazia. Você pode adicionar aulas em "Editar Horários" ou duplicar uma versão existente.
            </p>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nome da versão</label>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setShowCreate(false);
              }}
              placeholder="Ex: Semana de Provas, Horário de Feveriro..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="px-4 py-2 text-sm font-medium bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
              >
                Criar e ativar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate modal */}
      {duplicateFrom && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Duplicar versão</h3>
            <p className="text-sm text-slate-500 mb-4">
              A cópia terá todas as aulas da versão original. Você pode editá-la sem afetar o original.
            </p>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nome da cópia</label>
            <input
              autoFocus
              value={dupName}
              onChange={(e) => setDupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDuplicate();
                if (e.key === 'Escape') setDuplicateFrom(null);
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDuplicateFrom(null)}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDuplicate}
                disabled={!dupName.trim()}
                className="px-4 py-2 text-sm font-medium bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
              >
                Duplicar e ativar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
