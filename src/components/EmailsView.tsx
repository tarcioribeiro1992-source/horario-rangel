import { Mail, Clock } from 'lucide-react';
import type { Store } from '@/lib/store';

export function EmailsView({ store }: { store: Store }) {
  const { emailLogs } = store;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-800">Registro de E-mails</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Simulação de notificações enviadas via Gmail API aos professores
        </p>
      </div>

      {emailLogs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Nenhum e-mail enviado ainda.</p>
          <p className="text-xs text-slate-400 mt-1">Registre uma ocorrência para gerar uma notificação.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {emailLogs.map((log) => (
            <div key={log.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Email header */}
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{log.subject}</p>
                      <p className="text-xs text-slate-500">Para: {log.toName} &lt;{log.to}&gt;</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(log.sentAt).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
              {/* Email body */}
              <div className="px-5 py-4">
                <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                  {log.body}
                </pre>
              </div>
              {/* Status badge */}
              <div className="px-5 py-2.5 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-700">E-mail entregue (simulado)</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
