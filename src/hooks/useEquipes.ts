import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Equipe } from "@/types/eventos";

export const useEquipes = () => {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listarEquipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from<Equipe>("equipes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setEquipes([]);
    } else {
      setEquipes(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    listarEquipes();
  }, [listarEquipes]);

  return { equipes, loading, error, listarEquipes };
};
