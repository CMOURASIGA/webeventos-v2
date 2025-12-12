import { useMemo, useState } from "react";
import { Circle, Clock, CheckCircle2, AlertCircle, Filter, Calendar, User, ArrowRight } from "lucide-react";
import { useTarefas } from "@/hooks/useTarefas";
import { useEventos } from "@/hooks/useEventos";
import { usePerfis } from "@/hooks/usePerfis";
import { supabase } from "@/lib/supabaseClient";
import type { TaskStatus, Tarefa, Evento } from "@/types/eventos";
import { syncEventoProgress } from "@/services/eventProgressService";

const statusLabels: Record<TaskStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const priorityLabels = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

const formatDate = (value?: string | null) => {
  if (!value) return "Sem prazo";
  return new Date(value).toLocaleDateString("pt-BR");
};

const daysUntil = (value?: string | null) => {
  if (!value) return Infinity;
  const today = new Date();
  const target = new Date(value);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const statusOptions: { value: TaskStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos os Status" },
  { value: "pendente", label: "Pendentes" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluídas" },
  { value: "cancelada", label: "Canceladas" },
];

export const TarefasPage = () => {
  const { tarefas, loading, error, listarTarefas } = useTarefas();
  const { eventos } = useEventos();
  const { perfis } = usePerfis();

  const [statusFilter, setStatusFilter] = useState<TaskStatus | "todos">("todos");
  const [responsavelFilter, setResponsavelFilter] = useState<string>("todos");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const perfisMap = useMemo(() => {
    const map = new Map<string, string>();
    perfis.forEach((perfil) => map.set(perfil.id, perfil.nome ?? perfil.email));
    return map;
  }, [perfis]);

  const eventosMap = useMemo(() => {
    const map = new Map<string, Evento>();
    eventos.forEach((evento) => map.set(evento.id, evento));
    return map;
  }, [eventos]);

  const responsaveis = useMemo(() => {
    const ids = new Set<string>();
    tarefas.forEach((tarefa) => {
      if (tarefa.responsavel_id) {
        ids.add(tarefa.responsavel_id);
      }
    });
    return Array.from(ids);
  }, [tarefas]);

  const filteredTarefas = tarefas.filter((tarefa) => {
    const matchesStatus = statusFilter === "todos" || tarefa.status === statusFilter;
    const matchesResponsavel =
      responsavelFilter === "todos" || tarefa.responsavel_id === responsavelFilter;
    return matchesStatus && matchesResponsavel;
  });

  const resumo = {
    pendentes: filteredTarefas.filter((t) => t.status === "pendente").length,
    emAndamento: filteredTarefas.filter((t) => t.status === "em_andamento").length,
    concluidas: filteredTarefas.filter((t) => t.status === "concluida").length,
    canceladas: filteredTarefas.filter((t) => t.status === "cancelada").length,
    atrasadas: filteredTarefas.filter((t) => t.status !== "concluida" && daysUntil(t.prazo) < 0).length,
  };

  const handleChangeStatus = async (tarefa: Tarefa, newStatus: TaskStatus) => {
    setActionError(null);
    setUpdatingId(tarefa.id);
    try {
      const updates: Record<string, any> = { status: newStatus };
      const evento = eventosMap.get(tarefa.evento_id);
      if (!tarefa.equipe_id && evento?.equipe_id) {
        updates.equipe_id = evento.equipe_id;
      }
      if (newStatus === "concluida") {
        updates.data_conclusao = new Date().toISOString().slice(0, 10);
      } else if (tarefa.data_conclusao) {
        updates.data_conclusao = null;
      }
      const { error } = await supabase.from("tarefas").update(updates).eq("id", tarefa.id);
      if (error) throw error;
      await listarTarefas();
      await syncEventoProgress(tarefa.evento_id);
    } catch (err: any) {
      setActionError(err?.message ?? "Não foi possível atualizar a tarefa.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-slate-500">Gestão de Tarefas</p>
        <h1 className="text-3xl font-bold text-slate-900">Todas as tarefas dos eventos</h1>
        <p className="text-slate-500">Acompanhe entregas por status, responsável e evento.</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {actionError ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {actionError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <SummaryCard label="Pendentes" value={resumo.pendentes} icon={<Circle className="w-5 h-5 text-slate-500" />} />
        <SummaryCard label="Em andamento" value={resumo.emAndamento} icon={<Clock className="w-5 h-5 text-blue-600" />} accent="bg-blue-50" />
        <SummaryCard label="Concluídas" value={resumo.concluidas} icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} accent="bg-emerald-50" />
        <SummaryCard label="Canceladas" value={resumo.canceladas} icon={<AlertCircle className="w-5 h-5 text-amber-600" />} accent="bg-amber-50" />
        <SummaryCard label="Atrasadas" value={resumo.atrasadas} icon={<AlertCircle className="w-5 h-5 text-rose-600" />} accent="bg-rose-50" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Filter size={18} />
          <span>Filtros rápidos</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as TaskStatus | "todos")}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={responsavelFilter}
            onChange={(event) => setResponsavelFilter(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="todos">Todos os responsáveis</option>
            {responsaveis.map((id) => (
              <option key={id} value={id}>
                {perfisMap.get(id) ?? id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando tarefas...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {(["pendente", "em_andamento", "concluida", "cancelada"] as TaskStatus[]).map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tarefas={filteredTarefas.filter((t) => t.status === status)}
              eventosMap={eventosMap}
              perfisMap={perfisMap}
              onStatusChange={handleChangeStatus}
              updatingId={updatingId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface SummaryProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: string;
}

const SummaryCard = ({ label, value, icon, accent = "bg-slate-100" }: SummaryProps) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div>
  </div>
);

interface TaskColumnProps {
  status: TaskStatus;
  tarefas: Tarefa[];
  eventosMap: Map<string, Evento>;
  perfisMap: Map<string, string>;
  onStatusChange: (tarefa: Tarefa, status: TaskStatus) => void;
  updatingId: string | null;
}

const TaskColumn = ({
  status,
  tarefas,
  eventosMap,
  perfisMap,
  updatingId,
  onStatusChange,
}: TaskColumnProps) => {
  const title =
    status === "pendente"
      ? "Pendentes"
      : status === "em_andamento"
        ? "Em andamento"
        : status === "concluida"
          ? "Concluídas"
          : "Canceladas";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 flex flex-col">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{tarefas.length} tarefas</p>
      </div>
      <div className="flex-1 p-4 space-y-3 max-h-[620px] overflow-y-auto">
        {tarefas.map((tarefa) => {
          const evento = eventosMap.get(tarefa.evento_id);
          const overdue = tarefa.status !== "concluida" && daysUntil(tarefa.prazo) < 0;
          return (
            <div
              key={tarefa.id}
              className="border border-slate-100 rounded-2xl p-3 shadow-sm flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{tarefa.titulo}</p>
                  <p className="text-xs text-slate-500 truncate">{evento?.titulo ?? "Evento"}</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <ArrowRight size={14} />
                  {priorityLabels[tarefa.prioridade]}
                </span>
              </div>
              <div className="flex flex-wrap gap-3 items-center text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <User size={14} />
                  <span>{tarefa.responsavel_id ? perfisMap.get(tarefa.responsavel_id) ?? "Responsável" : "Sem responsável"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{formatDate(tarefa.prazo)}</span>
                  {overdue ? <span className="text-rose-600 font-medium">(Atrasada)</span> : null}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{statusLabels[tarefa.status]}</span>
                <select
                  value={tarefa.status}
                  disabled={updatingId === tarefa.id}
                  onChange={(event) => onStatusChange(tarefa, event.target.value as TaskStatus)}
                  className="rounded-xl border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
        {tarefas.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">Nenhuma tarefa {title.toLowerCase()}</p>
        ) : null}
      </div>
    </div>
  );
};
