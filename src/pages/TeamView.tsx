import { useMemo, useState } from "react";
import { Users, Search } from "lucide-react";
import { usePerfis } from "@/hooks/usePerfis";
import { useTarefas } from "@/hooks/useTarefas";
import { useEventos } from "@/hooks/useEventos";
import type { Perfil, Tarefa, Evento } from "@/types/eventos";

type AvailabilityState = "Livre" | "Ocupado" | "Em evento";

type PerfilWithPermissoes = Perfil & {
  permissoes?: { skills?: string[] } | null;
};

interface TeamMemberCard {
  perfil: Perfil;
  status: "Online" | "Em projeto" | "Offline";
  availability: AvailabilityState;
  workload: number;
  currentEvent?: string;
  tasks: Tarefa[];
  activeTasks: Tarefa[];
  skills: string[];
  avatar: string;
}

const AVAILABILITY_OPTIONS: AvailabilityState[] = ["Livre", "Ocupado", "Em evento"];

const TASK_STATUS_LABEL: Record<Tarefa["status"], string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluida",
  cancelada: "Cancelada",
};

const getAvatar = (perfil: Perfil) =>
  perfil.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(perfil.nome ?? perfil.email)}`;

const extractSkills = (perfil: PerfilWithPermissoes) => {
  const skillsFromPermissao = Array.isArray(perfil.permissoes?.skills)
    ? perfil.permissoes?.skills.filter(Boolean)
    : [];
  if (skillsFromPermissao.length > 0) {
    return skillsFromPermissao;
  }
  const fallback = perfil.papel ? [perfil.papel] : [];
  if (perfil.departamento_id) {
    fallback.push("Departamento " + perfil.departamento_id.slice(0, 4));
  }
    return fallback.length > 0 ? fallback : ["Operacoes"];
};

const deriveAvailability = (activeTasks: Tarefa[], eventosMap: Map<string, Evento>): AvailabilityState => {
  if (activeTasks.length === 0) {
    return "Livre";
  }
  const hasEventInExecution = activeTasks.some((task) => {
    const evento = eventosMap.get(task.evento_id);
    return evento?.status === "execucao";
  });
  return hasEventInExecution ? "Em evento" : "Ocupado";
};

const deriveStatus = (perfil: Perfil, availability: AvailabilityState): TeamMemberCard["status"] => {
  if (!perfil.ativo) return "Offline";
  if (availability === "Livre") return "Online";
  return "Em projeto";
};

export const TeamView = () => {
  const { perfis, loading: perfisLoading } = usePerfis();
  const { tarefas, loading: tarefasLoading } = useTarefas();
  const { eventos, loading: eventosLoading } = useEventos();

  const [searchValue, setSearchValue] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityState | "all">("all");

  const tarefasPorResponsavel = useMemo(() => {
    const map = new Map<string, Tarefa[]>();
    tarefas.forEach((task) => {
      if (!task.responsavel_id) return;
      const current = map.get(task.responsavel_id) ?? [];
      current.push(task);
      map.set(task.responsavel_id, current);
    });
    return map;
  }, [tarefas]);

  const eventosMap = useMemo(() => {
    const map = new Map<string, Evento>();
    eventos.forEach((evento) => {
      map.set(evento.id, evento);
    });
    return map;
  }, [eventos]);

  const members = useMemo<TeamMemberCard[]>(() => {
    return perfis.map((perfil) => {
      const tasks = tarefasPorResponsavel.get(perfil.id) ?? [];
      const activeTasks = tasks.filter((task) => task.status !== "concluida" && task.status !== "cancelada");
      const availability = deriveAvailability(activeTasks, eventosMap);
      const status = deriveStatus(perfil, availability);
      const workload = Math.min(100, activeTasks.length * 25);
      const currentEvent = activeTasks.length > 0 ? eventosMap.get(activeTasks[0].evento_id)?.titulo : undefined;
      return {
        perfil,
        tasks,
        activeTasks,
        availability,
        status,
        workload,
        currentEvent,
        skills: extractSkills(perfil as PerfilWithPermissoes),
        avatar: getAvatar(perfil),
      };
    });
  }, [eventosMap, perfis, tarefasPorResponsavel]);

  const summary = useMemo(() => {
    const total = members.length || 1;
    const livre = members.filter((member) => member.availability === "Livre").length;
    const ocupado = members.filter((member) => member.availability === "Ocupado").length;
    const emEvento = members.filter((member) => member.availability === "Em evento").length;
    const capacity = Math.round(members.reduce((acc, member) => acc + member.workload, 0) / total);
    return { livre, ocupado, emEvento, capacity };
  }, [members]);

  const filteredMembers = members.filter((member) => {
    const term = searchValue.trim().toLowerCase();
    const matchesSearch = term
      ? member.perfil.nome?.toLowerCase().includes(term) ||
        member.perfil.email.toLowerCase().includes(term) ||
        member.skills.some((skill) => skill.toLowerCase().includes(term))
      : true;
    const matchesAvailability =
      availabilityFilter === "all" ? true : member.availability === availabilityFilter;
    return matchesSearch && matchesAvailability;
  });

  const loading = perfisLoading || tarefasLoading || eventosLoading;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-500">Recursos humanos</p>
        <h1 className="text-3xl font-bold text-slate-900">Equipe operacional</h1>
        <p className="text-slate-500">
          Visualize disponibilidade, competências e carga de trabalho para alocar a equipe ideal em cada evento.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard label="Profissionais livres" value={summary.livre.toString()} helper="Sem tarefas ativas" />
        <SummaryCard label="Em planejamento" value={summary.ocupado.toString()} helper="Executando tarefas" />
        <SummaryCard label="Atuando em eventos" value={summary.emEvento.toString()} helper="Evento em execução" />
        <SummaryCard
          label="Capacidade utilizada"
          value={`${summary.capacity}%`}
          helper="Carga média da equipe"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Buscar por nome, e-mail ou skill"
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={availabilityFilter}
            onChange={(event) => setAvailabilityFilter(event.target.value as AvailabilityState | "all")}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Todas as disponibilidades</option>
            {AVAILABILITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3">
          <Users size={16} className="text-brand-600" />
          <span>{members.length} profissionais sincronizados do Supabase</span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Carregando dados da equipe...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Nenhum profissional encontrado para o filtro aplicado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <TeamCard key={member.perfil.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    <p className="text-xs text-slate-500 mt-1">{helper}</p>
  </div>
);

const TeamCard = ({ member }: { member: TeamMemberCard }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <img
        src={member.avatar}
        alt={member.perfil.nome ?? member.perfil.email}
        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
      />
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-slate-900 truncate">
          {member.perfil.nome ?? member.perfil.email}
        </h3>
        <p className="text-sm text-slate-500 truncate">{member.perfil.papel ?? "Colaborador"}</p>
      </div>
      <span
        className={`ml-auto px-2 py-1 text-xs rounded-full font-medium ${
          member.status === "Online"
            ? "bg-emerald-50 text-emerald-700"
            : member.status === "Em projeto"
              ? "bg-amber-50 text-amber-700"
              : "bg-slate-100 text-slate-500"
        }`}
      >
        {member.status}
      </span>
    </div>

    <div className="mt-4 space-y-3">
      <div>
        <p className="text-xs text-slate-500">Disponibilidade</p>
        <p className="text-sm font-medium text-slate-900">{member.availability}</p>
        {member.currentEvent ? (
          <p className="text-xs text-slate-500">Evento: {member.currentEvent}</p>
        ) : null}
      </div>

      <div>
        <p className="text-xs text-slate-500">Carga de trabalho</p>
        <div className="mt-1 h-2 bg-slate-100 rounded-full">
          <div
            className={`h-2 rounded-full ${
              member.workload < 40 ? "bg-emerald-500" : member.workload < 75 ? "bg-amber-500" : "bg-rose-500"
            }`}
            style={{ width: `${member.workload}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">{member.workload}% ocupado</p>
      </div>

      <div>
        <p className="text-xs text-slate-500">Competências</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {member.skills.map((skill) => (
            <span key={skill} className="px-2 py-1 bg-slate-100 text-xs rounded-full text-slate-600">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-slate-500">Tarefas atribuídas</p>
        {member.tasks.length === 0 ? (
          <p className="text-xs text-slate-500">Sem atribuições no momento.</p>
        ) : (
          <ul className="text-xs text-slate-600 space-y-1 max-h-24 overflow-auto pr-1">
            {member.tasks.slice(0, 4).map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{task.titulo}</span>
                <span className="text-[11px] text-slate-400 capitalize">{taskStatusLabel[task.status]}</span>
              </li>
            ))}
            {member.tasks.length > 4 ? (
              <li className="text-[11px] text-slate-400">+{member.tasks.length - 4} tarefas</li>
            ) : null}
          </ul>
        )}
      </div>
    </div>
  </div>
);



