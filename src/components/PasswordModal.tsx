import { useState, useEffect, useRef } from 'react';
import { Lock, X, ShieldAlert } from 'lucide-react';

const ADMIN_PASSWORD = '2227';

interface PasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PasswordModal({ open, onClose, onSuccess }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPassword('');
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError(true);
      setPassword('');
      inputRef.current?.focus();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setPassword(digitsOnly);
    if (error) setError(false);
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-[slideIn_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center">
              <Lock className="w-5 h-5 text-sky-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Acesso Restrito</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-slate-500 text-center mb-1">
              Para acessar o perfil da <span className="font-semibold text-slate-700">Gestão Pedagógica</span>,
            </p>
            <p className="text-sm text-slate-500 text-center">
              digite a senha de acesso:
            </p>
          </div>

          <div>
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              value={password}
              onChange={handleInputChange}
              maxLength={4}
              placeholder="••••"
              className={`w-full text-center text-2xl tracking-[0.5em] font-bold border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                error
                  ? 'border-red-300 focus:ring-red-400 text-red-600'
                  : 'border-slate-200 focus:ring-sky-400 text-slate-800'
              }`}
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-sm text-red-600">
              <ShieldAlert className="w-4 h-4" />
              <span className="font-medium">Senha incorreta</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-sm"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { ADMIN_PASSWORD };
