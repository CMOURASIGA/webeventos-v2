import { supabase } from "@/lib/supabaseClient";
import type { EventStatus, Evento, Tarefa } from "@/types/eventos";
import { ensureEventoApprovalRequest } from "./approvalService";

const AUTO_STATUSES: EventStatus[] = [
  "input",
  "criacao_tarefas",
  "geracao_orcamento",
  "aguardando_aprovacao",
];

const statusPriority = (status: EventStatus) => AUTO_STATUSES.indexOf(status);

export const syncEventoProgress = async (eventoId?: string | null) => {
  if (!eventoId) return;

  const { data: evento, error } = await supabase
    .from<Evento>("eventos")
    .select("id,status,solicitante_id,responsavel_id,equipe_id")
    .eq("id", eventoId)
    .single();

  if (error || !evento) {
    console.error("Não foi possível carregar o evento para sincronizar status.", error?.message);
    return;
  }

  if (!AUTO_STATUSES.includes(evento.status)) {
    return;
  }

  const [{ data: tarefas }, { data: budgetItems }] = await Promise.all([
    supabase.from<Tarefa>("tarefas").select("status").eq("evento_id", eventoId),
    supabase.from("orcamentos_itens").select("id").eq("evento_id", eventoId),
  ]);

  const tarefasCount = tarefas?.length ?? 0;
  const orcamentosCount = budgetItems?.length ?? 0;
  const hasPendingTasks = tarefas?.some((task) => task.status !== "concluida") ?? false;

  let targetStatus: EventStatus = "input";
  if (tarefasCount > 0) {
    targetStatus = "criacao_tarefas";
  }
  if (orcamentosCount > 0) {
    targetStatus = "geracao_orcamento";
  }
  if (orcamentosCount > 0 && tarefasCount > 0 && !hasPendingTasks) {
    targetStatus = "aguardando_aprovacao";
  }

  if (evento.status === "aguardando_aprovacao") {
    await ensureEventoApprovalRequest(evento);
  }

  if (statusPriority(targetStatus) <= statusPriority(evento.status)) {
    return;
  }

  const { error: updateError } = await supabase
    .from("eventos")
    .update({ status: targetStatus })
    .eq("id", eventoId);

  if (updateError) {
    console.error("Erro ao sincronizar status do evento:", updateError.message);
    return;
  }

  if (targetStatus === "aguardando_aprovacao") {
    await ensureEventoApprovalRequest(evento);
  }
};
