import { useMemo } from 'react';
import { TrendingUp, AlertCircle, Users, Calendar } from 'lucide-react';
import type { Store } from '@/lib/store';
import type { OccurrenceType } from '@/types';

const TYPE_COLORS: Record<string, string> = {
  Falta: '#EF4444',
  Formação: '#8B5CF6',
  'Saída Cedo': '#F59E0B',
  'Palestra Escolar': '#0EA5E9',
  Projeto: '#10B981',
};

const TYPE_LABELS: OccurrenceType[] = ['Falta', 'Formação', 'Saída Cedo', 'Palestra Escolar', 'Projeto'];

export function StatsView({ store }: { store: Store }) {
  const { occurrences, teachers } = store;

  // Teacher absence ranking
  const teacherRanking = useMemo(() => {
    const counts = new Map<string, number>();
    occurrences.forEach((o) => {
      counts.set(o.teacherId, (counts.get(o.teacherId) ?? 0) + 1);
    });
    return teachers
      .map((t) => ({ ...t, count: counts.get(t.id) ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [occurrences, teachers]);

  const maxCount = Math.max(...teacherRanking.map((t) => t.count), 1);

  // Type breakdown
  const typeBreakdown = useMemo(() => {
    return TYPE_LABELS.map((type) => ({
      type,
      count: occurrences.filter((o) => o.type === type).length,
    }));
  }, [occurrences]);

  const totalOccurrences = occurrences.length;
  const totalTeachers = teachers.length;
  const totalFaltas = occurrences.filter((o) => o.type === 'Falta').length;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-800">Dashboard de Estatísticas</h2>
        <p className="text-sm text-slate-500 mt-0.5">Análise de ocorrências e absências</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Calendar}
          label="Total de Ocorrências"
          value={totalOccurrences}
          color="bg-sky-50 text-sky-600"
        />
        <StatCard
          icon={AlertCircle}
          label="Total de Faltas"
          value={totalFaltas}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          icon={Users}
          label="Professores Ativos"
          value={totalTeachers}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Média por Professor"
          value={totalTeachers > 0 ? (totalOccurrences / totalTeachers).toFixed(1) : '0'}
          color="bg-violet-50 text-violet-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Teacher Ranking Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Ranking de Ocorrências por Professor</h3>
          <div className="space-y-3">
            {teacherRanking.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-500 flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700 truncate">{t.name}</span>
                    <span className="text-xs font-bold text-slate-600 ml-2">{t.count}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(t.count / maxCount) * 100}%`,
                        backgroundColor: t.count > 0 ? t.color : '#e2e8f0',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Type Breakdown — Donut */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Ocorrências por Tipo</h3>
          <div className="flex items-center gap-6">
            {/* Donut */}
            <div className="relative w-36 h-36 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  const total = typeBreakdown.reduce((s, t) => s + t.count, 0);
                  let offset = 0;
                  return typeBreakdown.map((t) => {
                    const pct = total > 0 ? (t.count / total) * 100 : 0;
                    const dash = (t.count / Math.max(total, 1)) * 251.2;
                    const circle = (
                      <circle
                        key={t.type}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={TYPE_COLORS[t.type]}
                        strokeWidth="14"
                        strokeDasharray={`${dash} 251.2`}
                        strokeDashoffset={-offset}
                        className="transition-all duration-500"
                      />
                    );
                    offset += dash;
                    return circle;
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-800">{totalOccurrences}</span>
                <span className="text-[10px] text-slate-400 uppercase">Total</span>
              </div>
            </div>
            {/* Legend */}
            <div className="flex-1 space-y-2">
              {typeBreakdown.map((t) => (
                <div key={t.type} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[t.type] }} />
                  <span className="text-xs text-slate-600 flex-1">{t.type}</span>
                  <span className="text-xs font-bold text-slate-700">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Type Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Distribuição de Ocorrências</h3>
          <div className="flex items-end justify-around gap-4 h-40">
            {typeBreakdown.map((t) => {
              const max = Math.max(...typeBreakdown.map((x) => x.count), 1);
              const height = (t.count / max) * 100;
              return (
                <div key={t.type} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">{t.count}</span>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-lg transition-all duration-500 min-h-[4px]"
                      style={{
                        height: `${height}%`,
                        backgroundColor: TYPE_COLORS[t.type],
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 text-center leading-tight">{t.type}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
