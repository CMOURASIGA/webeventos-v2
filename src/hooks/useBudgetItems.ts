import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { OrcamentoItem } from "@/types/eventos";
import { syncEventoProgress } from "@/services/eventProgressService";

export const useBudgetItems = (eventoId?: string) => {
  const [items, setItems] = useState<OrcamentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listarItens = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase.from<OrcamentoItem>("orcamentos_itens").select("*");
    if (eventoId) {
      query = query.eq("evento_id", eventoId);
    }
    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setItems([]);
    } else {
      setItems(data ?? []);
      if (eventoId) {
        await syncEventoProgress(eventoId);
      } else {
        const ids = Array.from(
          new Set((data ?? []).map((item) => item.evento_id).filter(Boolean) as string[])
        );
        await Promise.all(ids.map((id) => syncEventoProgress(id)));
      }
    }
    setLoading(false);
  }, [eventoId]);

  useEffect(() => {
    listarItens();
  }, [listarItens]);

  return { items, loading, error, listarItens };
};
