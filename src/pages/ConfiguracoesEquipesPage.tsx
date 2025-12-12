import { useMemo, useState } from "react";
import { useEquipes } from "@/hooks/useEquipes";
import { usePerfis } from "@/hooks/usePerfis";
import { useTeamMemberships } from "@/hooks/useTeamMemberships";
import { useDepartamentos } from "@/hooks/useDepartamentos";
import { supabase } from "@/lib/supabaseClient";

export const ConfiguracoesEquipesPage = () => {
  const { equipes, loading: equipesLoading, error: equipesError, listarEquipes } = useEquipes();
  const { perfis, loading: perfisLoading, error: perfisError, listarPerfis } = usePerfis();
  const {
    memberships,
    loading: membershipsLoading,
    error: membershipsError,
    listarMemberships,
  } = useTeamMemberships();
  const {
    departamentos,
    loading: departamentosLoading,
    error: departamentosError,
    listarDepartamentos,
  } = useDepartamentos();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [savingTeam, setSavingTeam] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [updatingMembershipId, setUpdatingMembershipId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [novoDepartamento, setNovoDepartamento] = useState({ nome: "", sigla: "" });
  const [departamentoError, setDepartamentoError] = useState<string | null>(null);
  const [savingDepartamento, setSavingDepartamento] = useState(false);
  const [deletingDepartamentoId, setDeletingDepartamentoId] = useState<string | null>(null);

  const membershipMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    memberships.forEach((membership) => {
      if (!map.has(membership.perfil_id)) {
        map.set(membership.perfil_id, new Set());
      }
      map.get(membership.perfil_id)!.add(membership.equipe_id);
    });
    return map;
  }, [memberships]);

  const [pendingMemberships, setPendingMemberships] = useState<Record<string, Set<string>>>({});

  const currentMemberships = (perfilId: string) =>
    pendingMemberships[perfilId] ?? membershipMap.get(perfilId) ?? new Set<string>();

  const handleToggleMembership = (perfilId: string, equipeId: string, checked: boolean) => {
    setPendingMemberships((prev) => {
      const next = new Set(currentMemberships(perfilId));
      if (checked) {
        next.add(equipeId);
      } else {
        next.delete(equipeId);
      }
      return { ...prev, [perfilId]: next };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nome.trim()) {
      setFormError("Informe um nome para a equipe.");
      return;
    }
    setFormError(null);
    setSavingTeam(true);
    const { error } = await supabase
      .from("equipes")
      .insert([{ nome: nome.trim(), descricao: descricao.trim() || null }]);
    setSavingTeam(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    setNome("");
    setDescricao("");
    listarEquipes();
  };

  const handleCreateDepartamento = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!novoDepartamento.nome.trim()) {
      setDepartamentoError("Informe um nome para o departamento.");
      return;
    }
    setDepartamentoError(null);
    setSavingDepartamento(true);
    const { error } = await supabase.from("departamentos").insert([
      {
        nome: novoDepartamento.nome.trim(),
        sigla: novoDepartamento.sigla.trim() || null,
      },
    ]);
    setSavingDepartamento(false);
    if (error) {
      setDepartamentoError(error.message);
      return;
    }
    setNovoDepartamento({ nome: "", sigla: "" });
    listarDepartamentos();
  };

  const handleDeleteDepartamento = async (departamentoId: string) => {
    if (!window.confirm("Deseja excluir este departamento? Esta ação é irreversível.")) {
      return;
    }
    setDepartamentoError(null);
    setDeletingDepartamentoId(departamentoId);
    try {
      const { error } = await supabase.from("departamentos").delete().eq("id", departamentoId);
      if (error) throw error;
      await listarDepartamentos();
    } catch (err: any) {
      setDepartamentoError(err?.message ?? "Nao foi possivel excluir o departamento.");
    } finally {
      setDeletingDepartamentoId(null);
    }
  };

  const handleSaveMemberships = async (perfilId: string) => {
    const selections = Array.from(currentMemberships(perfilId));
    setMembershipError(null);
    setUpdatingMembershipId(perfilId);
    try {
      await supabase.from("equipes_membros").delete().eq("perfil_id", perfilId);
      if (selections.length > 0) {
        const payload = selections.map((teamId) => ({
          perfil_id: perfilId,
          equipe_id: teamId,
        }));
        const { error } = await supabase.from("equipes_membros").insert(payload);
        if (error) throw error;
      }
      await supabase
        .from("perfis")
        .update({ equipe_id: selections[0] ?? null })
        .eq("id", perfilId);
      await Promise.all([listarMemberships(), listarPerfis()]);
      setPendingMemberships((prev) => {
        const next = { ...prev };
        delete next[perfilId];
        return next;
      });
    } catch (err: any) {
      setMembershipError(err?.message ?? "Nao foi possivel atualizar o vinculo.");
    } finally {
      setUpdatingMembershipId(null);
    }
  };

  const handleRoleChange = async (perfilId: string, novoPapel: string) => {
    const admins = perfis.filter((perfil) => (perfil.papel ?? "admin") === "admin");
    const isCurrentAdmin = admins.some((perfil) => perfil.id === perfilId);
    if (novoPapel !== "admin" && isCurrentAdmin && admins.length <= 1) {
      setMembershipError("E necessario manter pelo menos um administrador.");
      return;
    }
    setMembershipError(null);
    setUpdatingRoleId(perfilId);
    try {
      const { error } = await supabase
        .from("perfis")
        .update({ papel: novoPapel })
        .eq("id", perfilId);
      if (error) throw error;
      await listarPerfis();
    } catch (err: any) {
      setMembershipError(err?.message ?? "Erro ao atualizar o perfil.");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Configuracoes do sistema</p>
        <h1 className="text-3xl font-bold text-slate-900">Configuracoes de Equipes</h1>
        <p className="text-slate-500">
          Crie equipes e defina quais usuarios pertencem a cada uma.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Nova equipe</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nome da equipe *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Ex: Eventos Corporativos"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              disabled={savingTeam}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descricao (opcional)
            </label>
            <textarea
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Objetivo ou detalhes da equipe"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={3}
              disabled={savingTeam}
            />
          </div>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-600 text-white font-semibold py-3 hover:bg-brand-700 transition disabled:bg-slate-300"
            disabled={savingTeam}
          >
            {savingTeam ? "Salvando..." : "Criar equipe"}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Equipes cadastradas</h2>
          {equipesError ? <p className="text-sm text-red-600 mb-4">{equipesError}</p> : null}
          {equipesLoading ? (
            <p className="text-sm text-slate-500">Carregando equipes...</p>
          ) : equipes.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma equipe cadastrada ainda.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {equipes.map((team) => (
                <li key={team.id} className="py-3">
                  <p className="font-medium text-slate-900">{team.nome}</p>
                  {team.descricao ? (
                    <p className="text-sm text-slate-500">{team.descricao}</p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Sem descricao</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleCreateDepartamento}
          className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Novo departamento</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nome do departamento *
            </label>
            <input
              type="text"
              value={novoDepartamento.nome}
              onChange={(event) =>
                setNovoDepartamento((prev) => ({ ...prev, nome: event.target.value }))
              }
              placeholder="Ex: Marketing"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              disabled={savingDepartamento}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sigla</label>
            <input
              type="text"
              value={novoDepartamento.sigla}
              onChange={(event) =>
                setNovoDepartamento((prev) => ({ ...prev, sigla: event.target.value }))
              }
              placeholder="Ex: MKT"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              disabled={savingDepartamento}
            />
          </div>
          {departamentoError ? <p className="text-sm text-red-600">{departamentoError}</p> : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-600 text-white font-semibold py-3 hover:bg-brand-700 transition disabled:bg-slate-300"
            disabled={savingDepartamento}
          >
            {savingDepartamento ? "Salvando..." : "Criar departamento"}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Departamentos cadastrados</h2>
          {departamentosError ? <p className="text-sm text-red-600 mb-4">{departamentosError}</p> : null}
          {departamentosLoading ? (
            <p className="text-sm text-slate-500">Carregando departamentos...</p>
          ) : departamentos.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum departamento cadastrado ainda.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {departamentos.map((dep) => (
                <li key={dep.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{dep.nome}</p>
                    <p className="text-sm text-slate-500">{dep.sigla || "Sem sigla"}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteDepartamento(dep.id)}
                    disabled={deletingDepartamentoId === dep.id}
                    className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {deletingDepartamentoId === dep.id ? "Excluindo..." : "Excluir"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Vincular usuarios a equipes</h2>
            <p className="text-sm text-slate-500">
              Altere o perfil e marque as equipes as quais cada usuario pertence.
            </p>
          </div>
          {(membershipError || membershipsError || perfisError) && (
            <p className="text-sm text-red-600 max-w-md">
              {membershipError || membershipsError || perfisError}
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">E-mail</th>
                <th className="px-4 py-3 text-left">Perfil</th>
                <th className="px-4 py-3 text-left">Equipes</th>
                <th className="px-4 py-3 text-right">Salvar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {perfisLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Carregando usuarios...
                  </td>
                </tr>
              ) : perfis.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Nenhum usuario encontrado.
                  </td>
                </tr>
              ) : (
                perfis.map((perfil) => {
                  const selected = currentMemberships(perfil.id);
                  return (
                    <tr key={perfil.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">{perfil.nome ?? "Sem nome"}</td>
                      <td className="px-4 py-3 text-slate-500">{perfil.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={perfil.papel ?? "admin"}
                          disabled={updatingRoleId === perfil.id}
                          onChange={(event) => handleRoleChange(perfil.id, event.target.value)}
                          className="rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="admin">Administrador</option>
                          <option value="usuario">Usuario</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-3 text-sm">
                          {equipes.map((team) => (
                            <label key={`${perfil.id}-${team.id}`} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                checked={selected.has(team.id)}
                                disabled={membershipsLoading || updatingMembershipId === perfil.id}
                                onChange={(event) =>
                                  handleToggleMembership(perfil.id, team.id, event.target.checked)
                                }
                              />
                              {team.nome}
                            </label>
                          ))}
                          {equipes.length === 0 && (
                            <span className="text-slate-400">Nenhuma equipe disponivel</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleSaveMemberships(perfil.id)}
                          disabled={membershipsLoading || updatingMembershipId === perfil.id}
                          className="rounded-xl bg-brand-600 px-4 py-2 text-white font-semibold hover:bg-brand-700 disabled:bg-slate-300"
                        >
                          {updatingMembershipId === perfil.id ? "Salvando..." : "Salvar"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
