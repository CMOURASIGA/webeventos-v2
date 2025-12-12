import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Departamento } from "@/types/eventos";

export const useDepartamentos = () => {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listarDepartamentos = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from<Departamento>("departamentos")
      .select("*")
      .order("nome", { ascending: true });
    if (error) {
      setError(error.message);
      setDepartamentos([]);
    } else {
      setDepartamentos(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    listarDepartamentos();
  }, [listarDepartamentos]);

  return { departamentos, loading, error, listarDepartamentos };
};
