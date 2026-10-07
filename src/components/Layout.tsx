import { useState, type ReactNode } from 'react';
import { GraduationCap, Calendar, BarChart3, Users, Settings, Mail, Clock, BookOpen, ChevronDown, FolderOpen, Layers, RefreshCw, Cloud, CloudOff, Loader2 } from 'lucide-react';
import type { Role } from '@/types';
import type { Store } from '@/lib/store';
import { PasswordModal } from '@/components/PasswordModal';

export type AdminView = 'calendario' | 'estatisticas' | 'professores' | 'disciplinas' | 'turmas' | 'horario-turmas' | 'grade' | 'emails' | 'versoes';

interface LayoutProps {
  store: Store;
  adminView: AdminView;
  setAdminView: (v: AdminView) => void;
  children: ReactNode;
}

type NavLeaf = { key: AdminView; label: string; icon: typeof Calendar };
type NavGroup = { group: true; label: string; icon: typeof Calendar; items: NavLeaf[] };
type NavItem = NavLeaf | NavGroup;

const ADMIN_NAV: NavItem[] = [
  { key: 'calendario', label: 'Horário Completo', icon: Calendar },
  { key: 'horario-turmas', label: 'Horário por Turma', icon: BookOpen },
  { key: 'grade', label: 'Editar Horários', icon: Clock },
  { key: 'versoes', label: 'Versões de Horário', icon: Layers },
  { key: 'professores', label: 'Professores', icon: Users },
  { key: 'disciplinas', label: 'Disciplinas', icon: BookOpen },
  { key: 'turmas', label: 'Turmas', icon: Settings },
  { key: 'emails', label: 'E-mails', icon: Mail },
  { key: 'estatisticas', label: 'Estatísticas', icon: BarChart3 },
];

export function Layout({ store, adminView, setAdminView, children }: LayoutProps) {
  const { role, setRole, teachers, selectedTeacherId, setSelectedTeacherId, schedules, activeScheduleId, setActiveScheduleId, cloudSynced, syncError, syncing, forceSync } = store;
  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  function handleGestaoClick() {
    if (role !== 'gestao') {
      setPasswordOpen(true);
    }
  }

  function handlePasswordSuccess() {
    setPasswordOpen(false);
    setRole('gestao');
  }

  function isGroupActive(group: NavGroup) {
    return group.items.some((item) => item.key === adminView);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo corrigida e limpa (sem quadrado) */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="flex items-center justify-center">
                <img src="/logo.png" alt="HorárioRangel" className="h-10 w-auto object-contain" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-800 leading-none">Horário Rangel</h1>
                <p className="text-xs text-slate-400 mt-0.5">Gestão de Horários</p>
              </div>
            </div>

            {/* Selector and Role Toggle */}
            <div className="flex items-center gap-3">
              {/* Sync status */}
              <div className="relative">
                <button
                  onClick={() => forceSync()}
                  disabled={syncing}
                  title={syncError ? `Erro: ${syncError}` : cloudSynced ? 'Sincronizado com a nuvem' : 'Clique para sincronizar'}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    syncError
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : cloudSynced
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                  } ${syncing ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {syncing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : syncError ? (
                    <CloudOff className="w-3.5 h-3.5" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {syncing ? 'Sincronizando...' : syncError ? 'Erro' : cloudSynced ? 'Na nuvem' : 'Sincronizar'}
                  </span>
                </button>
                {syncError && !syncing && (
                  <div className="absolute top-full right-0 mt-1 max-w-[320px] bg-red-600 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-50">
                    {syncError}
                  </div>
                )}
              </div>

              <select
                value={selectedTeacherId || ''}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 max-w-[200px] sm:max-w-xs"
              >
                <option value="">Escolha seu nome aqui👇</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {role === 'gestao' ? `Simular: ${t.name}` : t.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button
                  onClick={handleGestaoClick}
                  className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    role === 'gestao'
                      ? 'bg-white text-sky-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Gestão
                </button>
                <button
                  onClick={() => setRole('professor')}
                  className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    role === 'professor'
                      ? 'bg-white text-teal-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Professor
                </button>
              </div>
            </div>
          </div>

          {/* Schedule selector (gestao only) */}
          {role === 'gestao' && schedules.length > 1 && (
            <div className="flex items-center gap-2 pb-2 -mt-1">
              <Layers className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <select
                value={activeScheduleId}
                onChange={(e) => setActiveScheduleId(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 max-w-[260px]"
              >
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.isRegular ? ' (regular)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Admin Nav */}
          {role === 'gestao' && (
            <nav className="flex items-center gap-1 overflow-x-auto pb-2 -mt-1 scrollbar-thin">
              {ADMIN_NAV.map((item) => {
                if ('group' in item) {
                  const GroupIcon = item.icon;
                  const active = isGroupActive(item);
                  const isOpen = openGroup === item.label;
                  return (
                    <div
                      key={item.label}
                      className="relative"
                      onMouseEnter={() => setOpenGroup(item.label)}
                      onMouseLeave={() => setOpenGroup(null)}
                    >
                      <button
                        onClick={() => setOpenGroup(isOpen ? null : item.label)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                          active
                            ? 'bg-sky-50 text-sky-700'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                      >
                        <GroupIcon className="w-4 h-4" />
                        {item.label}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isOpen && (
                        <div className="absolute top-full left-0 mt-1 min-w-[180px] bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-[slideIn_0.15s_ease-out]">
                          {item.items.map((sub) => {
                            const SubIcon = sub.icon;
                            return (
                              <button
                                key={sub.key}
                                onClick={() => {
                                  setAdminView(sub.key);
                                  setOpenGroup(null);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors text-left ${
                                  adminView === sub.key
                                    ? 'text-sky-700 bg-sky-50'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <SubIcon className="w-4 h-4 flex-shrink-0" />
                                {sub.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => setAdminView(item.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      adminView === item.key
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6">
        {role === 'professor' && selectedTeacher && (
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
            <span>Visualizando como:</span>
            <span className="font-semibold text-slate-700">{selectedTeacher.name}</span>
          </div>
        )}
        {children}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white py-4">
        <div className="max-w-[1600px] mx-auto px-6 text-center text-xs text-slate-400">
          Sistema de Gestão de Horários - Desenvolvido por Tárcio Ribeiro
        </div>
      </footer>

      <PasswordModal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  );
}
