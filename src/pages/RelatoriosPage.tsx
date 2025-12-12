import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FileDown } from "lucide-react";
import { useEventos } from "@/hooks/useEventos";
import { useTarefas } from "@/hooks/useTarefas";
import { useBudgetItems } from "@/hooks/useBudgetItems";
import { usePerfis } from "@/hooks/usePerfis";
import { useEquipes } from "@/hooks/useEquipes";
import { useAprovacoes } from "@/hooks/useAprovacoes";
import type { Evento, Tarefa } from "@/types/eventos";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(value) ? value : 0
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

export const RelatoriosPage = () => {
  const { eventos, loading: eventosLoading } = useEventos();
  const { tarefas, loading: tarefasLoading } = useTarefas();
  const { items: budgetItems, loading: budgetLoading } = useBudgetItems();
  const { perfis, loading: perfisLoading } = usePerfis();
  const { equipes, loading: equipesLoading } = useEquipes();
  const { aprovacoes, loading: aprovacoesLoading } = useAprovacoes();

  const [selectedEventoId, setSelectedEventoId] = useState<string | null>(null);

  const isLoading =
    eventosLoading ||
    tarefasLoading ||
    budgetLoading ||
    perfisLoading ||
    equipesLoading ||
    aprovacoesLoading;

  useEffect(() => {
    if (!selectedEventoId && eventos.length > 0) {
      setSelectedEventoId(eventos[0].id);
    }
  }, [eventos, selectedEventoId]);

  const perfisMap = useMemo(() => {
    const map = new Map<string, string>();
    perfis.forEach((perfil) => map.set(perfil.id, perfil.nome ?? perfil.email));
    return map;
  }, [perfis]);

  const equipesMap = useMemo(() => {
    const map = new Map<string, string>();
    equipes.forEach((equipe) => map.set(equipe.id, equipe.nome));
    return map;
  }, [equipes]);

  const selectedEvento = useMemo(
    () => (selectedEventoId ? eventos.find((evento) => evento.id === selectedEventoId) ?? null : null),
    [eventos, selectedEventoId]
  );

  const eventTasks = useMemo(
    () => tarefas.filter((tarefa) => tarefa.evento_id === selectedEventoId),
    [tarefas, selectedEventoId]
  );

  const eventBudgetItems = useMemo(
    () => budgetItems.filter((item) => item.evento_id === selectedEventoId),
    [budgetItems, selectedEventoId]
  );

  const eventApprovals = useMemo(
    () =>
      aprovacoes
        .filter((approval) => approval.evento_id === selectedEventoId)
        .sort(
          (a, b) => new Date(b.data_solicitacao).getTime() - new Date(a.data_solicitacao).getTime()
        ),
    [aprovacoes, selectedEventoId]
  );

  const latestApproval = eventApprovals[0];
  const detailedBudgetTotal = eventBudgetItems.reduce(
    (sum, item) => sum + calculateBudgetItemTotal(item),
    0
  );
  const approvedBudget = eventBudgetItems
    .filter((item) => item.aprovado)
    .reduce((sum, item) => sum + calculateBudgetItemTotal(item), 0);
  const completedTasksCount = eventTasks.filter((task) => task.status === "concluida").length;

  const eventosPorStatus = useMemo(() => {
    const entries: Record<string, number> = {
      input: 0,
      criacao_tarefas: 0,
      geracao_orcamento: 0,
      aguardando_aprovacao: 0,
      execucao: 0,
      pos_evento: 0,
      cancelado: 0,
    };
    eventos.forEach((evento) => {
      entries[evento.status] = (entries[evento.status] ?? 0) + 1;
    });
    return entries;
  }, [eventos]);

  const totalOrcamentoAprovado = eventos.reduce(
    (sum, evento) => sum + Number(evento.orcamento_aprovado ?? 0),
    0
  );
  const totalParticipantes = eventos.reduce(
    (sum, evento) => sum + Number(evento.participantes_esperados ?? 0),
    0
  );

  const tarefasStats = {
    total: tarefas.length,
    concluidas: tarefas.filter((t) => t.status === "concluida").length,
    pendentes: tarefas.filter((t) => t.status !== "concluida").length,
  };

  const reportingPeriod =
    selectedEvento?.data_inicio && selectedEvento?.data_fim
      ? `${formatDate(selectedEvento.data_inicio)} - ${formatDate(selectedEvento.data_fim)}`
      : "Periodo nao informado";

  const metrics = [
    {
      label: "Participantes previstos",
      value: selectedEvento?.participantes_esperados
        ? selectedEvento.participantes_esperados.toLocaleString("pt-BR")
        : "0",
      helper: "Estimativa declarada",
    },
    {
      label: "Custo por participante",
      value:
        selectedEvento?.participantes_esperados && approvedBudget > 0
          ? formatCurrency(approvedBudget / selectedEvento.participantes_esperados)
          : "R$ 0,00",
      helper: "Baseado nos custos aprovados",
    },
    {
      label: "Itens orcamentarios",
      value: `${eventBudgetItems.length}`,
      helper: `${eventBudgetItems.filter((item) => item.aprovado).length} aprovados`,
    },
    {
      label: "Tarefas concluidas",
      value: `${completedTasksCount}`,
      helper: `${eventTasks.length - completedTasksCount} pendentes`,
    },
  ];

  const upcomingTasks = eventTasks
    .filter((task) => task.status !== "concluida")
    .slice(0, 5)
    .map((task) => `${task.titulo} (${taskStatusLabel[task.status]})`);

  const accomplishments = [
    `Planejamento atualizado em ${formatDate(selectedEvento?.updated_at)}`,
    `${completedTasksCount} tarefa(s) registradas como concluidas`,
    `${eventBudgetItems.length} item(ns) de orcamento cadastrados`,
  ];

  const mainChallenges = [
    upcomingTasks.length > 0
      ? `Pendencias operacionais: ${upcomingTasks.join(", ")}`
      : "Todas as atividades cadastradas estao concluídas.",
    latestApproval?.status === "rejeitado"
      ? `Reprovado em ${formatDate(latestApproval.data_resposta ?? latestApproval.data_solicitacao)}. Observacao: ${latestApproval.observacoes || "nao informada"}.`
      : "Nao ha historico recente de reprovacao.",
  ];

  const executiveSummary = selectedEvento
    ? `O evento ${selectedEvento.titulo} encontra-se no estágio "${statusLabel(selectedEvento).toLowerCase()}". O periodo planejado compreende ${reportingPeriod}, com ${selectedEvento.participantes_esperados || 0} participantes previstos e ${eventTasks.length} atividades registradas. A organização é conduzida pela equipe ${selectedEvento.equipe_id ? equipesMap.get(selectedEvento.equipe_id) ?? "nao informada" : "nao informada"} e o status geral indica ${completedTasksCount} entrega(s) realizadas.`
    : "Selecione um evento para gerar o relatório.";

  const objectivesText = selectedEvento?.descricao
    ? selectedEvento.descricao
    : "Nenhum objetivo detalhado foi informado para este evento. Utilize o campo de descrição para registrar as metas estratégicas combinadas com o cliente.";

  const audienceText = selectedEvento
    ? `O público-alvo previsto e de ${selectedEvento.participantes_esperados || 0} participante(s). Ainda nao ha registro de participacao real dentro da plataforma; recomenda-se atualizar este campo apos a execucao do evento para comparar metas e resultados.`
    : "";

  const programacaoText = selectedEvento
    ? upcomingTasks.length > 0
      ? `Existem ${upcomingTasks.length} atividade(s) em aberto. Priorize: ${upcomingTasks.join("; ")}.`
      : "Todas as atividades cadastradas foram dadas como concluidas. Registre novas tarefas se houver etapas adicionais."
    : "";

  const financeNarrative = selectedEvento
    ? `O orçamento previsto e aprovado ainda nao foi informado para este evento. Os custos registrados na plataforma somam ${formatCurrency(detailedBudgetTotal)} e ${formatCurrency(approvedBudget)} foram marcados como aprovados. Revise os itens cadastrados para garantir que receitas e despesas estejam alinhadas.`
    : "";

  const recommendationsText = selectedEvento
    ? `Considerando o estagio atual, recomendamos revisar as pendencias operacionais e alinhar a nova data de aprovacao com o patrocinador. Registre feedbacks e anexos no campo a seguir antes de compartilhar o relatorio oficial.`
    : "Selecione um evento para visualizar as recomendacoes.";

  const portfolioHighlights = `O portfólio possui ${eventos.length} evento(s) em andamento, totalizando ${totalParticipantes.toLocaleString("pt-BR")} participante(s) previstos e ${formatCurrency(totalOrcamentoAprovado)} em orçamento aprovado. Distribuição por status: ${Object.entries(eventosPorStatus)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `${count} ${statusLabelText(status)}`)
    .join(", ") || "sem registros"}.`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-slate-500">Relatorios e Indicadores</p>
        <h1 className="text-3xl font-bold text-slate-900">Relatorio de gestao de eventos</h1>
        <p className="text-slate-500">
          Documento consolidado com panorama executivo, dados financeiros, dificuldades e recomendacoes.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
          Carregando relatorios...
        </div>
      ) : null}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Selecione o evento</h2>
            <p className="text-sm text-slate-500">
              Todas as seções abaixo são alimentadas automaticamente pelo Supabase.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedEventoId ?? ""}
              onChange={(event) => setSelectedEventoId(event.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>
                  {evento.titulo}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                if (!selectedEventoId) return;
                window.open(`/relatorios/${selectedEventoId}/impressao`, "_blank", "noopener");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <FileDown className="w-4 h-4" />
              Gerar PDF
            </button>
          </div>
        </div>
      </div>

      {selectedEvento ? (
        <div className="space-y-8">
          <DocumentSection title="1. Resumo executivo">
            <p className="text-sm text-slate-600 leading-relaxed">{executiveSummary}</p>
            <InfoTable
              rows={[
                ["Nome do evento", selectedEvento.titulo],
                ["Periodo", reportingPeriod],
                ["Status", statusLabel(selectedEvento)],
                [
                  "Equipe responsavel",
                  selectedEvento.equipe_id
                    ? equipesMap.get(selectedEvento.equipe_id) ?? "Nao informado"
                    : "Nao informado",
                ],
                [
                  "Patrocinador / cliente",
                  selectedEvento.solicitante_id
                    ? perfisMap.get(selectedEvento.solicitante_id) ?? "Nao informado"
                    : "Nao informado",
                ],
                ["Ultima atualizacao", formatDate(selectedEvento.updated_at)],
              ]}
            />
          </DocumentSection>

          <DocumentSection title="2. Objetivos e metas">
            <p className="text-sm text-slate-600 leading-relaxed">{objectivesText}</p>
          </DocumentSection>

          <DocumentSection title="3. Publico-alvo e participacao">
            <p className="text-sm text-slate-600 leading-relaxed">{audienceText}</p>
          </DocumentSection>

          <DocumentSection title="4. Programacao e atividades">
            <p className="text-sm text-slate-600 leading-relaxed">{programacaoText}</p>
            <InfoTable
              rows={[
                ["Tarefas cadastradas", `${eventTasks.length}`],
                ["Concluidas", `${completedTasksCount}`],
                ["Pendentes", `${eventTasks.length - completedTasksCount}`],
              ]}
            />
          </DocumentSection>

          <DocumentSection title="5. Analise financeira">
            <p className="text-sm text-slate-600 leading-relaxed">{financeNarrative}</p>
            <InfoTable
              rows={[
                ["Orcamento aprovado (evento)", formatCurrency(Number(selectedEvento.orcamento_aprovado ?? 0))],
                ["Orcamento previsto", formatCurrency(Number(selectedEvento.orcamento_previsto ?? 0))],
                ["Custos registrados", formatCurrency(detailedBudgetTotal)],
                ["Custos aprovados", formatCurrency(approvedBudget)],
              ]}
            />
          </DocumentSection>

          <DocumentSection title="6. Resultados e metricas">
            <p className="text-sm text-slate-600 leading-relaxed">
              Os indicadores a seguir ajudam a avaliar a maturidade do evento e direcionar proximas decisoes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.map((metric) => (
                <InfoTile key={metric.label} label={metric.label} value={metric.value} helper={metric.helper} accent="bg-slate-50" />
              ))}
            </div>
          </DocumentSection>

          <DocumentSection title="7. Dificuldades e solucoes">
            <BulletList items={mainChallenges} />
          </DocumentSection>

          <DocumentSection title="8. Conclusoes e recomendacoes">
            <p className="text-sm text-slate-600 leading-relaxed">{recommendationsText}</p>
            <BulletList title="Realizacoes" items={accomplishments} />
          </DocumentSection>

          <DocumentSection title="9. Relatorio de progresso">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WorkTable
                title="Entregas registradas"
                data={eventTasks
                  .filter((task) => task.status === "concluida")
                  .map((task) => ({
                    action: task.titulo,
                    date: formatDate(task.data_conclusao ?? task.prazo),
                    status: taskStatusLabel[task.status],
                    owner: task.responsavel_id
                      ? perfisMap.get(task.responsavel_id) ?? "Equipe"
                      : "Equipe",
                    comments: task.descricao ?? "",
                  }))}
                emptyMessage="Nao ha entregas marcadas como concluidas."
              />
              <WorkTable
                title="Atividades futuras"
                data={eventTasks
                  .filter((task) => task.status !== "concluida")
                  .map((task) => ({
                    action: task.titulo,
                    date: formatDate(task.prazo),
                    status: taskStatusLabel[task.status],
                    owner: task.responsavel_id
                      ? perfisMap.get(task.responsavel_id) ?? "Equipe"
                      : "Equipe",
                    comments: task.descricao ?? "",
                  }))}
                emptyMessage="Nenhuma atividade pendente registrada."
              />
            </div>
          </DocumentSection>

          <DocumentSection title="10. Anexos e evidencias">
            <p className="text-sm text-slate-600">
              Registre aqui os documentos complementares (imagens, listas de presenca, contratos ou pesquisas de satisfacao).
              A plataforma ainda nao possui upload automatico para esta secao; utilize este espaco como guia ao gerar o PDF.
            </p>
          </DocumentSection>

          <DocumentSection title="11. Visao geral do portfolio">
            <p className="text-sm text-slate-600 leading-relaxed">{portfolioHighlights}</p>
            <InfoTable
              rows={[
                ["Eventos cadastrados", `${eventos.length}`],
                ["Participantes previstos (total)", totalParticipantes.toLocaleString("pt-BR")],
                ["Orcamento aprovado (total)", formatCurrency(totalOrcamentoAprovado)],
                ["Tarefas registradas", `${tarefasStats.total}`],
                ["Tarefas concluidas", `${tarefasStats.concluidas}`],
              ]}
            />
          </DocumentSection>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Selecione um evento para gerar o relatorio detalhado.</p>
      )}
    </div>
  );
};

const DocumentSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    {children}
  </section>
);

const InfoTable = ({ rows }: { rows: [string, string][] }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200">
    <table className="min-w-full divide-y divide-slate-100 text-sm">
      <tbody className="divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th className="w-1/3 bg-slate-50 px-4 py-2 text-left text-slate-600 font-medium">
              {label}
            </th>
            <td className="px-4 py-2 text-slate-900">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const InfoTile = ({
  label,
  value,
  helper,
  accent,
}: {
  label: string;
  value: string;
  helper?: string;
  accent: string;
}) => (
  <div className={`rounded-2xl px-4 py-3 ${accent}`}>
    <p className="text-sm text-slate-600">{label}</p>
    <p className="text-lg font-semibold text-slate-900 mt-1">{value}</p>
    {helper ? <p className="text-xs text-slate-600 mt-1">{helper}</p> : null}
  </div>
);

const BulletList = ({ title, items }: { title?: string; items: string[] }) => (
  <div>
    {title ? <p className="text-sm font-semibold text-slate-700 mb-2">{title}</p> : null}
    <ul className="space-y-2 text-sm text-slate-600">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

interface WorkTableRow {
  action: string;
  date: string;
  status: string;
  owner: string;
  comments?: string;
}

const WorkTable = ({
  title,
  data,
  emptyMessage,
}: {
  title: string;
  data: WorkTableRow[];
  emptyMessage: string;
}) => (
  <div className="space-y-3">
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    {data.length === 0 ? (
      <p className="text-sm text-slate-500">{emptyMessage}</p>
    ) : (
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Atividade</th>
              <th className="px-4 py-2">Data</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Responsavel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {data.map((row) => (
              <tr key={`${row.action}-${row.date}`}>
                <td className="px-4 py-2">
                  <p className="font-medium text-slate-900">{row.action}</p>
                  {row.comments ? <p className="text-xs text-slate-500">{row.comments}</p> : null}
                </td>
                <td className="px-4 py-2">{row.date}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-2">{row.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
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
  return map[evento.status];
};

const statusLabelText = (status: string) => {
  const map: Record<string, string> = {
    input: "em input",
    criacao_tarefas: "em criacao de tarefas",
    geracao_orcamento: "em geracao de orcamento",
    aguardando_aprovacao: "aguardando aprovacao",
    execucao: "em execucao",
    pos_evento: "em pos-evento",
    cancelado: "cancelado",
  };
  return map[status] ?? status;
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
