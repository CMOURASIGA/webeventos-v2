import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Tarefa, TarefaPayload } from "@/types/eventos";
import { syncEventoProgress } from "@/services/eventProgressService";

const normalizePayload = (dados: Partial<TarefaPayload>) => {
  const str = (value?: string | null) =>
    value && value.trim() !== "" ? value : null;
  return {
    evento_id: dados.evento_id ?? "",
    titulo: dados.titulo ?? "",
    descricao: str(dados.descricao),
    responsavel_id: str(dados.responsavel_id),
    prazo: dados.prazo || null,
    status: dados.status ?? "pendente",
    prioridade: dados.prioridade ?? "media",
    data_conclusao: dados.data_conclusao || null,
    equipe_id: str(dados.equipe_id),
  };
};

export const useTarefas = (eventoId?: string) => {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listarTarefas = useCallback(
    async (eventoIdOverride?: string) => {
      setLoading(true);
      setError(null);

      const filtro = eventoIdOverride ?? eventoId;

      let query = supabase.from<Tarefa>("tarefas").select("*").order("prazo", {
        ascending: true,
        nullsFirst: true,
      });

      if (filtro) {
        query = query.eq("evento_id", filtro);
      }

      const { data, error } = await query;

      if (error) {
        setError(error.message);
        setTarefas([]);
        setLoading(false);
        return null;
      }

      setTarefas(data ?? []);
      if (filtro) {
        await syncEventoProgress(filtro);
      } else {
        const ids = Array.from(
          new Set((data ?? []).map((item) => item.evento_id).filter(Boolean) as string[])
        );
        await Promise.all(ids.map((id) => syncEventoProgress(id)));
      }
      setLoading(false);
      return data ?? [];
    },
    [eventoId]
  );

  const criarTarefa = useCallback(
    async (nova: TarefaPayload) => {
      setLoading(true);
      setError(null);
      const payload = normalizePayload(nova);
      const { error } = await supabase.from("tarefas").insert([payload]);
      if (error) {
        setError(error.message);
        setLoading(false);
        return false;
      }
      await listarTarefas(nova.evento_id);
      await syncEventoProgress(nova.evento_id);
      setLoading(false);
      return true;
    },
    [listarTarefas]
  );

  const atualizarTarefa = useCallback(
    async (id: string, dados: Partial<TarefaPayload>) => {
      setLoading(true);
      setError(null);
      const payload = normalizePayload(dados);
      const { error } = await supabase.from("tarefas").update(payload).eq("id", id);
      if (error) {
        setError(error.message);
        setLoading(false);
        return false;
      }
      await listarTarefas(eventoId);
      await syncEventoProgress(dados.evento_id ?? eventoId);
      setLoading(false);
      return true;
    },
    [eventoId, listarTarefas]
  );

  const excluirTarefa = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      const { error } = await supabase.from("tarefas").delete().eq("id", id);

      if (error) {
        setError(error.message);
        setLoading(false);
        return false;
      }

      await listarTarefas(eventoId);
      await syncEventoProgress(eventoId);
      setLoading(false);
      return true;
    },
    [eventoId, listarTarefas]
  );

  useEffect(() => {
    listarTarefas(eventoId);
  }, [eventoId, listarTarefas]);

  return {
    tarefas,
    loading,
    error,
    listarTarefas,
    criarTarefa,
    atualizarTarefa,
    excluirTarefa,
  };
};
