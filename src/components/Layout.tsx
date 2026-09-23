import { useState, type ReactNode } from 'react';
import { GraduationCap, Calendar, BarChart3, Users, Settings, Mail, Clock } from 'lucide-react';
import type { Role } from '@/types';
import type { Store } from '@/lib/store';
import { PasswordModal } from '@/components/PasswordModal';

export type AdminView = 'calendario' | 'estatisticas' | 'professores' | 'disciplinas' | 'turmas' | 'grade' | 'emails';

interface LayoutProps {
  store: Store;
  adminView: AdminView;
  setAdminView: (v: AdminView) => void;
  children: ReactNode;
}

const ADMIN_NAV: { key: AdminView; label: string; icon: typeof Calendar }[] = [
  { key: 'calendario', label: 'Horário', icon: Calendar },
  { key: 'estatisticas', label: 'Estatísticas', icon: BarChart3 },
  { key: 'professores', label: 'Professores', icon: Users },
  { key: 'disciplinas', label: 'Disciplinas', icon: GraduationCap },
  { key: 'turmas', label: 'Turmas', icon: Settings },
  { key: 'grade', label: 'Editar Horários', icon: Clock },
  { key: 'emails', label: 'E-mails', icon: Mail },
];

export function Layout({ store, adminView, setAdminView, children }: LayoutProps) {
  const { role, setRole, teachers, selectedTeacherId, setSelectedTeacherId } = store;
  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);
  const [passwordOpen, setPasswordOpen] = useState(false);

  function handleGestaoClick() {
    if (role !== 'gestao') {
      setPasswordOpen(true);
    }
  }

  function handlePasswordSuccess() {
    setPasswordOpen(false);
    setRole('gestao');
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

          {/* Admin Nav */}
          {role === 'gestao' && (
            <nav className="flex items-center gap-1 overflow-x-auto pb-2 -mt-1 scrollbar-thin">
              {ADMIN_NAV.map((item) => {
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
