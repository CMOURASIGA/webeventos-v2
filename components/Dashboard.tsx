import React, { useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useEventos } from '@/hooks/useEventos';
import { useTarefas } from '@/hooks/useTarefas';
import { useAprovacoes } from '@/hooks/useAprovacoes';
import { useBudgetItems } from '@/hooks/useBudgetItems';

const formatCompact = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toLocaleString();
};

const parseNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const calculateBudgetItemTotal = (item: {
  valor_total?: number | string | null;
  quantidade?: number | string | null;
  valor_unitario?: number | string | null;
}) => {
  const stored = parseNumber(item.valor_total);
  if (stored > 0) return stored;
  const qty = parseNumber(item.quantidade);
  const unit = parseNumber(item.valor_unitario);
  return qty * unit;
};

const formatDateLabel = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const getInitial = (text?: string | null) => (text?.[0]?.toUpperCase() ?? 'E');

export const Dashboard: React.FC = () => {
  const { eventos, loading: eventosLoading, error: eventosError } = useEventos();
  const { tarefas, loading: tarefasLoading, error: tarefasError } = useTarefas();
  const { aprovacoes, loading: aprovacoesLoading, error: aprovacoesError } = useAprovacoes();
  const { items: budgetItems, loading: budgetLoading, error: budgetError } = useBudgetItems();

  const isLoading = eventosLoading || tarefasLoading || aprovacoesLoading || budgetLoading;
  const errorMessage = eventosError || tarefasError || aprovacoesError || budgetError;

  const eventMap = useMemo(() => {
    const map = new Map<string, (typeof eventos)[number]>();
    eventos.forEach((evento) => map.set(evento.id, evento));
    return map;
  }, [eventos]);

  const stats = useMemo(() => {
    const totals = eventos.reduce(
      (acc, evento) => {
        acc.totalProjected += parseNumber(evento.orcamento_previsto ?? evento.orcamento_aprovado);
        acc.attendees += parseNumber(evento.participantes_esperados);
        if (!['cancelado'].includes(evento.status)) {
          acc.activeEvents += 1;
        }
        return acc;
      },
      { totalProjected: 0, attendees: 0, activeEvents: 0 }
    );

    const pendingTasks = tarefas.filter(task => task.status !== 'concluida' && task.status !== 'cancelada').length;
    const totalSpent = budgetItems.reduce((sum, item) => sum + calculateBudgetItemTotal(item), 0);
    const budgetUsed = totals.totalProjected > 0 ? Math.round((totalSpent / totals.totalProjected) * 100) : 0;

    return [
      { label: 'Active Events', value: totals.activeEvents.toString(), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Pending Tasks', value: pendingTasks.toString(), icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: 'Total Attendees', value: formatCompact(totals.attendees), icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-50' },
      { label: 'Budget Used', value: `${budgetUsed}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];
  }, [eventos, tarefas, budgetItems]);

  const chartData = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('en', { month: 'short' });
    const now = new Date();
    const months = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return { label: formatter.format(date), month: date.getMonth(), year: date.getFullYear() };
    });

    return months.map(({ label, month, year }) => ({
      name: label,
      events: eventos.filter(evento => {
        if (!evento.data_inicio) return false;
        const start = new Date(evento.data_inicio);
        return start.getMonth() === month && start.getFullYear() === year;
      }).length
    }));
  }, [eventos]);

  const topMonthIndex = chartData.reduce((topIndex, entry, index, array) => {
    if ((array[topIndex]?.events ?? 0) < entry.events) {
      return index;
    }
    return topIndex;
  }, 0);

  const upcomingEvents = useMemo(() => {
    const sorted = eventos
      .filter((evento) => evento.data_inicio)
      .sort((a, b) => {
        const aDate = new Date(a.data_inicio ?? '').getTime();
        const bDate = new Date(b.data_inicio ?? '').getTime();
        return aDate - bDate;
      });
    const futureEvents = sorted.filter((evento) => {
      if (!evento.data_inicio) return false;
      const start = new Date(evento.data_inicio);
      return start.getTime() >= new Date().setHours(0, 0, 0, 0);
    });
    const list = futureEvents.length > 0 ? futureEvents : sorted;
    return list.slice(0, 3);
  }, [eventos]);

  const pendingApprovals = useMemo(
    () => aprovacoes.filter((approval) => approval.status === 'pendente'),
    [aprovacoes]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your event portfolio and performance.</p>
        </div>
        <div className="text-sm text-slate-500">{isLoading ? 'Carregando dados...' : 'Atualizado agora'}</div>
      </div>

      {errorMessage ? (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-2 rounded-2xl text-sm">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800">Event Volume</h3>
            <select className="text-sm border-none bg-slate-50 text-slate-600 rounded-lg px-2 py-1 focus:ring-0">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="events" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === topMonthIndex ? '#7c3aed' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800">Upcoming Events</h3>
            <button className="text-brand-600 text-sm font-medium hover:text-brand-700">View All</button>
          </div>
          <div className="space-y-4">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum evento cadastrado ainda.</p>
            ) : (
              upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 group cursor-pointer p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-brand-50 flex-shrink-0 overflow-hidden flex items-center justify-center text-brand-600 font-semibold">
                    {getInitial(event.titulo)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 text-sm truncate group-hover:text-brand-600 transition-colors">{event.titulo}</h4>
                    <p className="text-xs text-slate-500 truncate">
                      {formatDateLabel(event.data_inicio)} - {event.local || 'Local indefinido'}
                    </p>
                  </div>
                  <button className="text-slate-300 hover:text-slate-600">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
             <h3 className="font-semibold text-slate-800 mb-4">Pending Approvals</h3>
             <div className="space-y-3">
               {pendingApprovals.length === 0 ? (
                 <p className="text-xs text-amber-700">Nenhuma aprovação pendente.</p>
               ) : (
                 pendingApprovals.slice(0, 3).map((approval) => {
                   const approvalEvent = approval.evento_id ? eventMap.get(approval.evento_id) : undefined;
                   return (
                     <div key={approval.id} className="bg-amber-50 rounded-lg p-3 border border-amber-100 flex items-start gap-3">
                       <AlertCircle size={18} className="text-amber-600 mt-0.5" />
                       <div className="flex-1">
                         <p className="text-sm font-medium text-amber-900">
                           {approvalEvent?.titulo ?? 'Solicitação sem evento'}
                         </p>
                         <p className="text-xs text-amber-700 mt-1">
                           {approval.tipo ? `Tipo: ${approval.tipo}` : 'Aguardando análise'} - {formatDateLabel(approval.data_solicitacao)}
                         </p>
                         <div className="mt-2 flex gap-2">
                           <button className="text-xs bg-white border border-amber-200 text-amber-800 px-2 py-1 rounded shadow-sm hover:bg-amber-100">Review</button>
                         </div>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
