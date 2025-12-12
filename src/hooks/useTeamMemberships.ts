import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { EquipeMembro } from "@/types/eventos";

export const useTeamMemberships = () => {
  const [memberships, setMemberships] = useState<EquipeMembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listarMemberships = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from<EquipeMembro>("equipes_membros")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
      setMemberships([]);
    } else {
      setMemberships(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    listarMemberships();
  }, [listarMemberships]);

  return { memberships, loading, error, listarMemberships };
};
