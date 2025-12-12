import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Perfil } from "@/types/eventos";

export const usePerfis = () => {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listarPerfis = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from<Perfil>("perfis")
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      setError(error.message);
      setPerfis([]);
    } else {
      setPerfis(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    listarPerfis();
  }, [listarPerfis]);

  return { perfis, loading, error, listarPerfis };
};
