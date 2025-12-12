import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Aprovacao } from "@/types/eventos";

export const useAprovacoes = () => {
  const [aprovacoes, setAprovacoes] = useState<Aprovacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listarAprovacoes = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from<Aprovacao>("aprovacoes")
      .select("*")
      .order("data_solicitacao", { ascending: false });

    if (error) {
      setError(error.message);
      setAprovacoes([]);
    } else {
      setAprovacoes(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    listarAprovacoes();
  }, [listarAprovacoes]);

  return { aprovacoes, loading, error, listarAprovacoes };
};
