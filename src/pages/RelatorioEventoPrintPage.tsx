import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEventos } from "@/hooks/useEventos";
import { useTarefas } from "@/hooks/useTarefas";
import { useBudgetItems } from "@/hooks/useBudgetItems";
import { usePerfis } from "@/hooks/usePerfis";
import { useEquipes } from "@/hooks/useEquipes";
import { useAprovacoes } from "@/hooks/useAprovacoes";
import type { Evento, Tarefa } from "@/types/eventos";

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(Number(value)) ? Number(value) : 0
  );

const formatDate = (value?: string | null) => {
  if (!value) return "Nao informado";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch {
    return "Nao informado";
  }
};

const calculateBudgetItemTotal = (item: {
  valor_total?: number | string | null;
  quantidade?: number | string | null;
  valor_unitario?: number | string | null;
}) => {
  const stored = Number(item.valor_total);
  if (!Number.isNaN(stored) && stored > 0) return stored;
  const qty = Number(item.quantidade ?? 0);
  const unit = Number(item.valor_unitario ?? 0);
  if (Number.isNaN(qty) || Number.isNaN(unit)) return 0;
  return qty * unit;
};

const taskStatusLabel: Record<Tarefa["status"], string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluida",
  cancelada: "Cancelada",
};

export const RelatorioEventoPrintPage = () => {
  const { eventoId } = useParams<{ eventoId: string }>();
  const navigate = useNavigate();
  const { eventos, loading: eventosLoading } = useEventos();
  const { perfis } = usePerfis();
  const { equipes } = useEquipes();
  const { aprovacoes } = useAprovacoes();
  const { tarefas, loading: tarefasLoading } = useTarefas(eventoId);
  const { items: budgetItems, loading: budgetLoading } = useBudgetItems(eventoId);



  const evento = useMemo(
    () => eventos.find((item) => item.id === eventoId) ?? null,
    [eventos, eventoId]
  );

  const perfisMap = useMemo(() => {
    const map = new Map<string, string>();
    perfis.forEach((perfil) => map.set(perfil.id, perfil.nome ?? perfil.email));
    return map;
  }, [perfis]);

  const equipesMap = useMemo(() => {
    const map = new Map<string, string>();
    equipes.forEach((team) => map.set(team.id, team.nome));
    return map;
  }, [equipes]);

  const eventApprovals = useMemo(
    () =>
      aprovacoes
        .filter((approval) => approval.evento_id === eventoId)
        .sort(
          (a, b) => new Date(b.data_solicitacao).getTime() - new Date(a.data_solicitacao).getTime()
        ),
    [aprovacoes, eventoId]
  );

  const latestApproval = eventApprovals[0];
  const detailedBudgetTotal = budgetItems.reduce(
    (sum, item) => sum + calculateBudgetItemTotal(item),
    0
  );
  const approvedBudget = budgetItems
    .filter((item) => item.aprovado)
    .reduce((sum, item) => sum + calculateBudgetItemTotal(item), 0);
  const completedTasksCount = tarefas.filter((task) => task.status === "concluida").length;

  const portfolioSummary = `Eventos ativos: ${eventos.length}. Participantes previstos (total): ${eventos
    .reduce((sum, item) => sum + Number(item.participantes_esperados ?? 0), 0)
    .toLocaleString("pt-BR")}. Orçamento aprovado agregado: ${formatCurrency(
    eventos.reduce((sum, item) => sum + Number(item.orcamento_aprovado ?? 0), 0)
  )}.`;

  if (!eventoId) {
    return (
      <div className="min-h-screen bg-white p-8 text-slate-900">
        <p className="text-sm text-slate-500">Evento nao informado.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm"
        >
          Voltar
        </button>
      </div>
    );
  }

  const loading = eventosLoading || tarefasLoading || budgetLoading;

  useEffect(() => {
    if (loading || !evento) {
      return;
    }
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, [loading, evento]);

  if (loading && !evento) {
    return (
      <div className="min-h-screen bg-white p-8 text-slate-900">
        <p>Carregando dados...</p>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen bg-white p-8 text-slate-900">
        <p className="text-sm text-slate-500">Evento nao encontrado.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm"
        >
          Voltar
        </button>
      </div>
    );
  }

  const reportingPeriod =
    evento.data_inicio && evento.data_fim
      ? `${formatDate(evento.data_inicio)} - ${formatDate(evento.data_fim)}`
      : "Periodo nao informado";

  const audienceText = `Participantes previstos: ${
    evento.participantes_esperados ?? 0
  }. Atualize este campo apos o evento para comparar metas e presenca real.`;

  const upcomingTasks = tarefas
    .filter((task) => task.status !== "concluida")
    .map((task) => `${task.titulo} - ${taskStatusLabel[task.status]}`);

  const executiveSummary = `O evento ${evento.titulo} encontra-se no estagio "${statusLabel(
    evento
  ).toLowerCase()}". O periodo planejado compreende ${reportingPeriod}, com ${
    evento.participantes_esperados ?? 0
  } participante(s) previstos e ${tarefas.length} atividade(s) cadastradas. A equipe responsavel é ${
    evento.equipe_id ? equipesMap.get(evento.equipe_id) ?? "nao informada" : "nao informada"
  }. ${completedTasksCount} entrega(s) foram concluidas ate o momento.`;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-4xl p-8 space-y-8 print:p-8">
        <header className="space-y-2">
          <p className="text-xs text-slate-500">Gestão de Eventos/Serviços • Relatorio exclusivo para impressao</p>
          <h1 className="text-3xl font-semibold">Relatorio do evento: {evento.titulo}</h1>
          <p className="text-sm text-slate-600">
            Emitido em {formatDate(new Date().toISOString().slice(0, 10))}
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Resumo executivo</h2>
          <p className="text-sm leading-relaxed text-slate-700">{executiveSummary}</p>
          <DocTable
            rows={[
              ["Periodo", reportingPeriod],
              ["Status atual", statusLabel(evento)],
              [
                "Equipe responsavel",
                evento.equipe_id ? equipesMap.get(evento.equipe_id) ?? "Nao informado" : "Nao informado",
              ],
              [
                "Cliente / patrocinador",
                evento.solicitante_id
                  ? perfisMap.get(evento.solicitante_id) ?? "Nao informado"
                  : "Nao informado",
              ],
              ["Ultima atualizacao", formatDate(evento.updated_at)],
            ]}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Objetivos e metas</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            {evento.descricao ||
              "Nenhuma descrição detalhada foi registrada. Utilize o campo de descrição do evento para documentar metas e briefing fornecido pelo cliente."}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Publico-alvo e participação</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{audienceText}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Programação e atividades</h2>
          <DocTable
            rows={[
              ["Tarefas cadastradas", `${tarefas.length}`],
              ["Concluidas", `${completedTasksCount}`],
              ["Pendentes", `${tarefas.length - completedTasksCount}`],
              ["Principais pendencias", upcomingTasks.length > 0 ? upcomingTasks.join("; ") : "Sem pendencias"],
            ]}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Analise financeira</h2>
          <DocTable
            rows={[
              ["Orcamento previsto", formatCurrency(evento.orcamento_previsto)],
              ["Orcamento aprovado", formatCurrency(evento.orcamento_aprovado)],
              ["Custos registrados", formatCurrency(detailedBudgetTotal)],
              ["Custos aprovados", formatCurrency(approvedBudget)],
              ["Itens cadastrados", `${budgetItems.length}`],
            ]}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Resultados e indicadores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <MetricCard
              label="Participantes previstos"
              value={evento.participantes_esperados?.toLocaleString("pt-BR") ?? "0"}
              helper="Estimativa declarada"
            />
            <MetricCard
              label="Custo por participante"
              value={
                evento.participantes_esperados && approvedBudget > 0
                  ? formatCurrency(approvedBudget / evento.participantes_esperados)
                  : "R$ 0,00"
              }
              helper="Baseado em custos aprovados"
            />
            <MetricCard
              label="Tarefas concluidas"
              value={`${completedTasksCount}`}
              helper={`${tarefas.length - completedTasksCount} pendentes`}
            />
            <MetricCard
              label="Itens de orcamento"
              value={`${budgetItems.length}`}
              helper={`${budgetItems.filter((item) => item.aprovado).length} aprovados`}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Dificuldades e solucoes</h2>
          <ul className="list-disc pl-6 text-sm text-slate-700 space-y-2">
            <li>
              {upcomingTasks.length > 0
                ? `Pendencias em aberto: ${upcomingTasks.join("; ")}`
                : "Nenhuma pendencia operacional registrada."}
            </li>
            <li>
              {latestApproval?.status === "rejeitado"
                ? `Reprovacao registrada em ${formatDate(
                    latestApproval.data_resposta ?? latestApproval.data_solicitacao
                  )}. Observacao: ${latestApproval.observacoes || "nao informada"}.`
                : "Nao ha reprovacoes registradas recentemente."}
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Conclusoes e recomendacoes</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            {`Considerando o estagio atual (${statusLabel(
              evento
            )}), recomenda-se acompanhar as pendencias listadas e alinhar os proximos marcos com o cliente. Registre feedbacks e faça upload dos documentos comprobatórios antes de enviar este relatório.`}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Registro de tarefas</h2>
          <DocTable
            rows={
              tarefas.length === 0
                ? [["Sem tarefas cadastradas", "-"]]
                : tarefas.map((task) => [
                    task.titulo,
                    `${taskStatusLabel[task.status]} • ${formatDate(task.prazo)}`,
                    task.responsavel_id ? perfisMap.get(task.responsavel_id) ?? "Equipe" : "Equipe",
                  ])
            }
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Itens de orcamento</h2>
          <DocTable
            rows={
              budgetItems.length === 0
                ? [["Sem itens cadastrados", "-"]]
                : budgetItems.map((item) => [
                    `${item.categoria ?? "Categoria"} - ${item.descricao ?? "Sem descricao"}`,
                    `${formatCurrency(calculateBudgetItemTotal(item))} (${item.aprovado ? "Aprovado" : "Pendente"})`,
                    item.fornecedor ?? "Fornecedor nao informado",
                  ])
            }
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Historico de aprovacoes</h2>
          <DocTable
            rows={
              eventApprovals.length === 0
                ? [["Sem registros", "-"]]
                : eventApprovals.map((approval) => [
                    `${approval.tipo ?? "Aprovacao"} - ${approval.status}`,
                    formatDate(approval.data_resposta ?? approval.data_solicitacao),
                    approval.observacoes ?? "Sem observacoes",
                  ])
            }
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Anexos sugeridos</h2>
          <p className="text-sm text-slate-700">
            Inclua fotos, listas de presenca, contratos assinados, comprovantes de pagamento e pesquisas de satisfacao.
            Este espaço serve como checklist antes de arquivar o PDF.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Visao geral do portfolio</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{portfolioSummary}</p>
        </section>
      </div>
    </div>
  );
};

const DocTable = ({ rows }: { rows: string[][] }) => (
  <table className="w-full text-sm text-slate-700 border border-slate-200 rounded-md overflow-hidden">
    <tbody>
      {rows.map((row, index) => (
        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
          {row.map((cell, cellIndex) => (
            <td key={cellIndex} className="px-4 py-2 border-b border-slate-100">
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const MetricCard = ({ label, value, helper }: { label: string; value: string; helper?: string }) => (
  <div className="border border-slate-200 rounded-xl p-4">
    <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
    <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    {helper ? <p className="text-xs text-slate-500 mt-1">{helper}</p> : null}
  </div>
);

const statusLabel = (evento: Evento) => {
  const map: Record<Evento["status"], string> = {
    input: "Input do evento",
    criacao_tarefas: "Criacao de tarefas",
    geracao_orcamento: "Geracao de orcamento",
    aguardando_aprovacao: "Aguardando aprovacao",
    execucao: "Em execucao",
    pos_evento: "Pos-evento",
    cancelado: "Cancelado",
  };
  return map[evento.status] ?? evento.status;
};

const pendingTasksSummary = (tasks: Tarefa[]) => {
  const pending = tasks.filter((task) => task.status !== "concluida");
  if (pending.length === 0) {
    return "Sem pendencias criticas registradas.";
  }
  return `${pending.length} tarefa(s) aguardando conclusao: ${pending
    .slice(0, 3)
    .map((task) => task.titulo)
    .join(", ")}${pending.length > 3 ? "..." : ""}`;
};
