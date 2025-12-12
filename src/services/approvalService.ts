import { supabase } from "@/lib/supabaseClient";
import type { Evento } from "@/types/eventos";

type EventoInfo = Pick<Evento, "id" | "solicitante_id" | "responsavel_id" | "equipe_id">;

export const ensureEventoApprovalRequest = async (evento: EventoInfo | null | undefined) => {
  if (!evento?.id) return;

  const { data, error } = await supabase
    .from("aprovacoes")
    .select("id")
    .eq("evento_id", evento.id)
    .eq("status", "pendente")
    .eq("tipo", "evento")
    .limit(1);

  if (error) {
    console.error("Erro ao verificar aprovações pendentes:", error.message);
    return;
  }

  if (data && data.length > 0) {
    return;
  }

  await supabase.from("aprovacoes").insert({
    evento_id: evento.id,
    tipo: "evento",
    status: "pendente",
    solicitante_id: evento.solicitante_id ?? evento.responsavel_id ?? null,
    equipe_id: evento.equipe_id ?? null,
  });
};
