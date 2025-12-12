import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  User,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAprovacoes } from "@/hooks/useAprovacoes";
import { useEventos } from "@/hooks/useEventos";
import { usePerfis } from "@/hooks/usePerfis";
import { useBudgetItems } from "@/hooks/useBudgetItems";
import { useTarefas } from "@/hooks/useTarefas";
import { useAuth } from "@/contexts/AuthContext";
import type {
  Aprovacao,
  Evento,
  EventPriority,
  EventStatus,
  OrcamentoItem,
  Tarefa,
} from "@/types/eventos";

const eventStatusLabels: Record<EventStatus, string> = {
  input: "Input do evento",
  criacao_tarefas: "Criação de tarefas",
  geracao_orcamento: "Geração de orçamento",
  aguardando_aprovacao: "Aguardando aprovação",
  execucao: "Em execução",
  pos_evento: "Pós-evento",
  cancelado: "Cancelado",
};

const priorityLabels: Record<EventPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

const formatDate = (value?: string | null) => {
  if (!value) return "Não informado";
  try {
    return new Date(value).toLocaleDateString("pt-BR");
  } catch {
    return "Não informado";
  }
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(value) ? value : 0
  );

const calculateBudgetItemTotal = (item: OrcamentoItem) => {
  const stored = Number(item.valor_total);
  if (!Number.isNaN(stored) && stored > 0) {
    return stored;
  }
  const qty = Number(item.quantidade ?? 0);
  const unit = Number(item.valor_unitario ?? 0);
  if (Number.isNaN(qty) || Number.isNaN(unit)) return 0;
  return qty * unit;
};

const approvalTypeLabel = (approval: Aprovacao) =>
  approval.tipo === "orcamento" ? "Aprovação de orçamento" : "Aprovação de evento";

export const AprovacoesPage = () => {
  const { aprovacoes, loading, error, listarAprovacoes } = useAprovacoes();
  const { eventos, listarEventos } = useEventos();
  const { perfis } = usePerfis();
  const { items: budgetItems } = useBudgetItems();
  const { tarefas } = useTarefas();
  const { profile } = useAuth();

  const [selectedApproval, setSelectedApproval] = useState<Aprovacao | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

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

  const budgetByEvent = useMemo(() => {
    const map = new Map<string, OrcamentoItem[]>();
    budgetItems.forEach((item) => {
      if (!item.evento_id) return;
      const list = map.get(item.evento_id) ?? [];
      list.push(item);
      map.set(item.evento_id, list);
    });
    return map;
  }, [budgetItems]);

  const tasksByEvent = useMemo(() => {
    const map = new Map<string, Tarefa[]>();
    tarefas.forEach((task) => {
      const list = map.get(task.evento_id) ?? [];
      list.push(task);
      map.set(task.evento_id, list);
    });
    return map;
  }, [tarefas]);

  const pendentes = useMemo(
    () =>
      aprovacoes
        .filter((approval) => approval.status === "pendente")
        .sort(
          (a, b) =>
            new Date(b.data_solicitacao).getTime() - new Date(a.data_solicitacao).getTime()
        ),
    [aprovacoes]
  );
  const aprovadas = useMemo(
    () =>
      aprovacoes
        .filter((approval) => approval.status === "aprovado")
        .sort(
          (a, b) =>
            new Date(b.data_resposta ?? b.data_solicitacao).getTime() -
            new Date(a.data_resposta ?? a.data_solicitacao).getTime()
        ),
    [aprovacoes]
  );
  const rejeitadas = useMemo(
    () =>
      aprovacoes
        .filter((approval) => approval.status === "rejeitado")
        .sort(
          (a, b) =>
            new Date(b.data_resposta ?? b.data_solicitacao).getTime() -
            new Date(a.data_resposta ?? a.data_solicitacao).getTime()
        ),
    [aprovacoes]
  );

  const totals = {
    pendentes: pendentes.length,
    aprovadas: aprovadas.length,
    rejeitadas: rejeitadas.length,
  };

  const getProfileName = (id?: string | null) => {
    if (!id) return "Não informado";
    return perfisMap.get(id) ?? "Usuário";
  };

  const handleDecision = async (approval: Aprovacao, decision: "aprovado" | "rejeitado") => {
    if (processingId) return;
    const confirmed = window.confirm(
      `Confirma ${decision === "aprovado" ? "a aprovação" : "a rejeição"} desta solicitação?`
    );
    if (!confirmed) return;

    let observacoes = approval.observacoes ?? "";
    const promptMessage =
      decision === "aprovado"
        ? "Deseja adicionar alguma observação? (opcional)"
        : "Informe o motivo da rejeição:";
    const note = window.prompt(promptMessage, observacoes);
    if (note === null) return;
    const trimmedNote = note.trim();
    if (decision === "rejeitado" && !trimmedNote) {
      alert("Informe o motivo da reprovação.");
      return;
    }
    observacoes = trimmedNote;

    try {
      setFeedback(null);
      setProcessingId(approval.id);
      const payload = {
        status: decision,
        data_resposta: new Date().toISOString(),
        aprovador_id: profile?.id ?? null,
        observacoes: observacoes || null,
      };
      const { error: updateError } = await supabase
        .from("aprovacoes")
        .update(payload)
        .eq("id", approval.id);
      if (updateError) {
        throw updateError;
      }

      if (approval.evento_id) {
        if (decision === "aprovado" && approval.tipo === "evento") {
          await supabase
            .from("eventos")
            .update({ status: "execucao" })
            .eq("id", approval.evento_id);
          await listarEventos();
        }
        if (decision === "rejeitado") {
          await supabase
            .from("eventos")
            .update({ status: "geracao_orcamento" })
            .eq("id", approval.evento_id);
          await listarEventos();
        }
      }

      await listarAprovacoes();
      setSelectedApproval(null);
      setFeedback({
        type: "success",
        message: `Decisão registrada com sucesso (${decision === "aprovado" ? "aprovado" : "rejeitado"}).`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message ?? "Não foi possível registrar a decisão. Tente novamente.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const history = useMemo(() => [...aprovadas, ...rejeitadas], [aprovadas, rejeitadas]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-slate-500">Central de Aprovações</p>
        <h1 className="text-3xl font-bold text-slate-900">Gerencie as solicitações de aprovação</h1>
        <p className="text-slate-500">
          Controle pendências, acompanhe histórico e registre decisões diretamente do painel.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-amber-100 bg-amber-50 text-amber-800"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pendentes"
          value={totals.pendentes}
          icon={<Clock3 className="w-5 h-5 text-amber-600" />}
          accent="bg-amber-50"
        />
        <StatCard
          label="Aprovadas"
          value={totals.aprovadas}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          accent="bg-emerald-50"
        />
        <StatCard
          label="Rejeitadas"
          value={totals.rejeitadas}
          icon={<XCircle className="w-5 h-5 text-rose-600" />}
          accent="bg-rose-50"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Aprovações pendentes</h2>
            <p className="text-sm text-slate-500">
              {pendentes.length > 0
                ? `Existem ${pendentes.length} solicitações aguardando decisão.`
                : "Nenhuma aprovação pendente no momento."}
            </p>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 px-5 py-10 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando aprovações...
          </div>
        ) : pendentes.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <Clock3 className="w-12 h-12 text-slate-300" />
            <p>Nenhuma aprovação pendente</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendentes.map((approval) => {
              const event = approval.evento_id ? eventosMap.get(approval.evento_id) ?? null : null;
              const eventBudgets = approval.evento_id
                ? budgetByEvent.get(approval.evento_id) ?? []
                : [];
              const tasks = approval.evento_id ? tasksByEvent.get(approval.evento_id) ?? [] : [];
              const completedTasks = tasks.filter((task) => task.status === "concluida").length;
              const budgetTotal = eventBudgets.reduce(
                (sum, item) => sum + calculateBudgetItemTotal(item),
                0
              );

              return (
                <div key={approval.id} className="p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {event?.titulo ?? "Evento não localizado"}
                        </p>
                        <p className="text-sm text-slate-500">{approvalTypeLabel(approval)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Solicitado em</p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatDate(approval.data_solicitacao)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <InfoItem label="Solicitante" value={getProfileName(approval.solicitante_id)} />
                    <InfoItem
                      label="Status do evento"
                      value={event ? eventStatusLabels[event.status] : "Indisponível"}
                    />
                    <InfoItem
                      label="Total solicitado"
                      value={
                        budgetTotal > 0
                          ? formatCurrency(budgetTotal)
                          : event?.orcamento_previsto
                            ? formatCurrency(event.orcamento_previsto)
                            : "Não informado"
                      }
                    />
                    <InfoItem
                      label="Tarefas concluídas"
                      value={`${completedTasks} de ${tasks.length}`}
                    />
                    <InfoItem
                      label="Prioridade"
                      value={event ? priorityLabels[event.prioridade] : "Não definida"}
                    />
                    <InfoItem label="Local" value={event?.local ?? "Sem local definido"} />
                  </div>

                  {approval.observacoes ? (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <p className="text-xs font-semibold uppercase tracking-widest">Observações</p>
                      <p>{approval.observacoes}</p>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleDecision(approval, "aprovado")}
                      disabled={processingId === approval.id}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {processingId === approval.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Aprovar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(approval, "rejeitado")}
                      disabled={processingId === approval.id}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                    >
                      {processingId === approval.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Rejeitar
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedApproval(approval)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <User className="w-4 h-4" />
                      Ver detalhes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Histórico de aprovações</h2>
          <p className="text-sm text-slate-500">
            Registros aprovados e rejeitados (mais recentes primeiro).
          </p>
        </div>
        {history.length === 0 ? (
          <div className="px-5 py-8 text-sm text-slate-500">Sem decisões registradas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Evento</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Solicitante</th>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((approval) => {
                  const event = approval.evento_id ? eventosMap.get(approval.evento_id) : null;
                  return (
                    <tr key={approval.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {event?.titulo ?? "Evento removido"}
                      </td>
                      <td className="px-5 py-3">{approvalTypeLabel(approval)}</td>
                      <td className="px-5 py-3">{getProfileName(approval.solicitante_id)}</td>
                      <td className="px-5 py-3">
                        {formatDate(approval.data_resposta ?? approval.data_solicitacao)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                            approval.status === "aprovado"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {approval.status === "aprovado" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {approval.status === "aprovado" ? "Aprovado" : "Rejeitado"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {approval.observacoes?.trim() ? approval.observacoes : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedApproval ? (
        <ApprovalDetailsModal
          approval={selectedApproval}
          onClose={() => setSelectedApproval(null)}
          event={selectedApproval.evento_id ? eventosMap.get(selectedApproval.evento_id) ?? null : null}
          budgets={
            selectedApproval.evento_id ? budgetByEvent.get(selectedApproval.evento_id) ?? [] : []
          }
          tasks={selectedApproval.evento_id ? tasksByEvent.get(selectedApproval.evento_id) ?? [] : []}
          requester={getProfileName(selectedApproval.solicitante_id)}
        />
      ) : null}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  accent: string;
}

const StatCard = ({ label, value, icon, accent }: StatCardProps) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between">
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div>
  </div>
);

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
    <p className="text-sm text-slate-900">{value}</p>
  </div>
);

interface ApprovalDetailsModalProps {
  approval: Aprovacao;
  event: Evento | null;
  budgets: OrcamentoItem[];
  tasks: Tarefa[];
  requester: string;
  onClose: () => void;
}

const ApprovalDetailsModal = ({
  approval,
  event,
  budgets,
  tasks,
  requester,
  onClose,
}: ApprovalDetailsModalProps) => {
  const totalBudget = budgets.reduce(
    (sum, item) => sum + calculateBudgetItemTotal(item),
    0
  );
  const completedTasks = tasks.filter((task) => task.status === "concluida").length;
  const inProgress = tasks.filter((task) => task.status === "em_andamento").length;

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Solicitação</p>
            <h3 className="text-xl font-semibold text-slate-900 mt-1">{approvalTypeLabel(approval)}</h3>
            <p className="text-sm text-slate-500">
              Solicitado por {requester} em {formatDate(approval.data_solicitacao)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-900 hover:border-slate-300"
          >
            Fechar
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <section className="space-y-3">
            <h4 className="text-lg font-semibold text-slate-900">Resumo do evento</h4>
            {event ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4">
                <InfoItem label="Título" value={event.titulo} />
                <InfoItem label="Tipo" value={event.tipo ?? "Não informado"} />
                <InfoItem label="Local" value={event.local ?? "Não informado"} />
                <InfoItem
                  label="Departamento"
                  value={event.departamento_id ?? "Não informado"}
                />
                <InfoItem
                  label="Período"
                  value={
                    event.data_inicio && event.data_fim
                      ? `${formatDate(event.data_inicio)} a ${formatDate(event.data_fim)}`
                      : event.data_inicio
                        ? formatDate(event.data_inicio)
                        : "Não informado"
                  }
                />
                <InfoItem label="Status" value={eventStatusLabels[event.status]} />
                {event.descricao ? (
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Descrição
                    </p>
                    <p className="text-sm text-slate-900">{event.descricao}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Evento não localizado.</p>
            )}
          </section>

          <section className="space-y-3">
            <h4 className="text-lg font-semibold text-slate-900">Orçamento</h4>
            {budgets.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum item de orçamento cadastrado.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-600">Valor total solicitado</span>
                  <span className="text-lg font-semibold text-slate-900">
                    {formatCurrency(totalBudget)}
                  </span>
                </div>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-2">Categoria</th>
                        <th className="px-4 py-2">Descrição</th>
                        <th className="px-4 py-2 text-right">Qtd</th>
                        <th className="px-4 py-2 text-right">Valor unit.</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {budgets.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 font-medium text-slate-900">
                            {item.categoria ?? "-"}
                          </td>
                          <td className="px-4 py-2 text-slate-600">{item.descricao ?? "-"}</td>
                          <td className="px-4 py-2 text-right text-slate-600">
                            {item.quantidade ?? "-"}
                          </td>
                          <td className="px-4 py-2 text-right text-slate-600">
                            {formatCurrency(Number(item.valor_unitario ?? 0))}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-slate-900">
                            {formatCurrency(calculateBudgetItemTotal(item))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h4 className="text-lg font-semibold text-slate-900">Tarefas do evento</h4>
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma tarefa registrada.</p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <InfoItem label="Concluídas" value={`${completedTasks}`} />
                <InfoItem label="Em andamento" value={`${inProgress}`} />
                <InfoItem
                  label="Pendentes"
                  value={`${tasks.length - completedTasks - inProgress}`}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
