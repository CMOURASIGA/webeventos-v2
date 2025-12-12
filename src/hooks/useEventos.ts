import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Evento, EventoPayload } from "@/types/eventos";
import { ensureEventoApprovalRequest } from "@/services/approvalService";

const normalizePayload = (dados: Partial<EventoPayload>) => {
  const str = (value?: string | null) =>
    value && value.trim() !== "" ? value : null;
  const num = (value?: number | string | null) => {
    if (value === undefined || value === null || value === "") return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  return {
    titulo: dados.titulo ?? "",
    descricao: dados.descricao ?? "",
    tipo: dados.tipo ?? "",
    data_inicio: dados.data_inicio || null,
    data_fim: dados.data_fim || null,
    local: dados.local ?? "",
    status: dados.status ?? "input",
    prioridade: dados.prioridade ?? "media",
    departamento_id: str(dados.departamento_id),
    equipe_id: str(dados.equipe_id),
    responsavel_id: str(dados.responsavel_id),
    solicitante_id: str(dados.solicitante_id),
    orcamento_previsto: num(dados.orcamento_previsto ?? null),
    orcamento_aprovado: num(dados.orcamento_aprovado ?? null),
    participantes_esperados: num(dados.participantes_esperados ?? null),
    observacoes: dados.observacoes ?? null,
  };
};

export const useEventos = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listarEventos = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from<Evento>("eventos")
      .select("*")
      .order("data_inicio", { ascending: true });
    if (error) {
      setError(error.message);
      setEventos([]);
    } else {
      setEventos(data ?? []);
    }
    setLoading(false);
  }, []);

  const criarEvento = useCallback(
    async (novo: EventoPayload) => {
      setLoading(true);
      setError(null);
      const payload = normalizePayload(novo);
      const { data, error } = await supabase
        .from<Evento>("eventos")
        .insert([payload])
        .select()
        .single();
      if (error) {
        setError(error.message);
        setLoading(false);
        return false;
      }
      if (data?.status === "aguardando_aprovacao") {
        await ensureEventoApprovalRequest(data);
      }
      await listarEventos();
      setLoading(false);
      return true;
    },
    [listarEventos]
  );

  const atualizarEvento = useCallback(
    async (id: string, dados: Partial<EventoPayload>) => {
      setLoading(true);
      setError(null);
      const payload = normalizePayload(dados);
      const { data, error } = await supabase
        .from<Evento>("eventos")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) {
        setError(error.message);
        setLoading(false);
        return false;
      }
      if (data?.status === "aguardando_aprovacao") {
        await ensureEventoApprovalRequest(data);
      }
      await listarEventos();
      setLoading(false);
      return true;
    },
    [listarEventos]
  );

  const excluirEvento = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      const { error } = await supabase.from("eventos").delete().eq("id", id);
      if (error) {
        setError(error.message);
        setLoading(false);
        return false;
      }
      await listarEventos();
      setLoading(false);
      return true;
    },
    [listarEventos]
  );

  useEffect(() => {
    listarEventos();
  }, [listarEventos]);

  return {
    eventos,
    loading,
    error,
    listarEventos,
    criarEvento,
    atualizarEvento,
    excluirEvento,
  };
};
