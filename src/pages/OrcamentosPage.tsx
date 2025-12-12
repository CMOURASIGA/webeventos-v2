import { useMemo, useState } from "react";
import { DollarSign, Filter, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { useBudgetItems } from "@/hooks/useBudgetItems";
import { useEventos } from "@/hooks/useEventos";
import { useAuth } from "@/contexts/AuthContext";
import { syncEventoProgress } from "@/services/eventProgressService";
import { supabase } from "@/lib/supabaseClient";
import type { OrcamentoItem } from "@/types/eventos";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const calculateBudgetItemTotal = (item: OrcamentoItem) => {
  const stored = Number(item.valor_total);
  if (!Number.isNaN(stored) && stored > 0) return stored;
  const qty = Number(item.quantidade ?? 0);
  const unit = Number(item.valor_unitario ?? 0);
  if (Number.isNaN(qty) || Number.isNaN(unit)) return 0;
  return qty * unit;
};

export const OrcamentosPage = () => {
  const { items, loading, error, listarItens } = useBudgetItems();
  const { eventos } = useEventos();
  const { profile } = useAuth();
  const [filtroEvento, setFiltroEvento] = useState<"todos" | string>("todos");
  const [formVisivel, setFormVisivel] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [itemAtualizando, setItemAtualizando] = useState<string | null>(null);
  const [form, setForm] = useState({
    evento_id: "",
    categoria: "",
    descricao: "",
    fornecedor: "",
    quantidade: "1",
    valor_unitario: "",
  });

  const eventosMap = useMemo(() => {
    const map = new Map<
      string,
      { titulo: string; equipe_id: string | null; periodo: string }
    >();
    eventos.forEach((evento) => {
      const periodo =
        evento.data_inicio && evento.data_fim
          ? `${new Date(evento.data_inicio).toLocaleDateString("pt-BR")} - ${new Date(
              evento.data_fim,
            ).toLocaleDateString("pt-BR")}`
          : "Data nao definida";
      map.set(evento.id, {
        titulo: evento.titulo,
        equipe_id: evento.equipe_id ?? null,
        periodo,
      });
    });
    return map;
  }, [eventos]);

  const itensFiltrados = useMemo(() => {
    return filtroEvento === "todos"
      ? items
      : items.filter((item) => item.evento_id === filtroEvento);
  }, [items, filtroEvento]);

  const totais = useMemo(() => {
    const totalGeral = itensFiltrados.reduce(
      (sum, item) => sum + calculateBudgetItemTotal(item),
      0,
    );
    const totalAprovado = itensFiltrados
      .filter((item) => item.aprovado)
      .reduce((sum, item) => sum + calculateBudgetItemTotal(item), 0);
    const totalPendente = totalGeral - totalAprovado;
    return { totalGeral, totalAprovado, totalPendente };
  }, [itensFiltrados]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.evento_id) {
      alert("Selecione um evento.");
      return;
    }

    const quantidade = Number(form.quantidade);
    const valorUnitario = Number(form.valor_unitario);
    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      alert("Informe uma quantidade valida.");
      return;
    }
    if (!Number.isFinite(valorUnitario) || valorUnitario < 0) {
      alert("Informe um valor unitario valido.");
      return;
    }

    const equipeId = profile?.equipe_id ?? null;
    if (!equipeId) {
      alert(
        "Nao foi possível identificar sua equipe. Verifique se seu perfil está vinculado a uma equipe antes de cadastrar itens."
      );
      return;
    }

    try {
      setSalvando(true);
      const { error } = await supabase.from("orcamentos_itens").insert({
        evento_id: form.evento_id,
        categoria: form.categoria.trim(),
        descricao: form.descricao.trim(),
        fornecedor: form.fornecedor.trim() || null,
        quantidade,
        valor_unitario: valorUnitario,
        equipe_id: equipeId,
      });
      if (error) throw error;
      await listarItens();
      setForm({
        evento_id: "",
        categoria: "",
        descricao: "",
        fornecedor: "",
        quantidade: "1",
        valor_unitario: "",
      });
      setFormVisivel(false);
      await syncEventoProgress(form.evento_id);
    } catch (err: any) {
      const message =
        err?.message ??
        (err?.error_description ?? "Erro ao salvar item de orcamento. Tente novamente.");
      alert(message);
    } finally {
      setSalvando(false);
    }
  };

  const handleToggleAprovacao = async (item: OrcamentoItem) => {
    try {
      setItemAtualizando(item.id);
      const { error } = await supabase
        .from("orcamentos_itens")
        .update({ aprovado: !item.aprovado })
        .eq("id", item.id);
      if (error) throw error;
      await listarItens();
      await syncEventoProgress(item.evento_id);
    } catch (err) {
      alert("Erro ao atualizar status do item.");
    } finally {
      setItemAtualizando(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Controle de Orcamentos</p>
        <h1 className="text-3xl font-bold text-slate-900">Custos previstos por evento</h1>
        <p className="text-slate-500">
          Cadastre fornecedores, valores e acompanhe a aprovacao financeira de cada projeto.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <ResumoCard label="Valor total" value={formatCurrency(totais.totalGeral)} icon={<DollarSign className="w-5 h-5 text-brand-600" />} accent="bg-brand-50" />
        <ResumoCard label="Aprovado" value={formatCurrency(totais.totalAprovado)} icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} accent="bg-emerald-50" />
        <ResumoCard label="Pendente" value={formatCurrency(totais.totalPendente)} icon={<AlertCircle className="w-5 h-5 text-amber-600" />} accent="bg-amber-50" />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-slate-400" />
            <select
              value={filtroEvento}
              onChange={(event) => setFiltroEvento(event.target.value as "todos" | string)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="todos">Todos os eventos</option>
              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>
                  {evento.titulo}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setFormVisivel((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            <Plus size={16} />
            {formVisivel ? "Cancelar" : "Novo item"}
          </button>
        </div>

        {formVisivel ? (
          <form className="space-y-4 border-t border-slate-100 pt-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500">Evento</label>
                <select
                  value={form.evento_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, evento_id: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                >
                  <option value="">Selecione...</option>
                  {eventos.map((evento) => (
                    <option key={evento.id} value={evento.id}>
                      {evento.titulo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Categoria</label>
                <input
                  value={form.categoria}
                  onChange={(event) => setForm((prev) => ({ ...prev, categoria: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Ex.: Estrutura, Marketing"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500">Descricao</label>
              <textarea
                value={form.descricao}
                onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={2}
                placeholder="Detalhes do item ou servico"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-500">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantidade}
                  onChange={(event) => setForm((prev) => ({ ...prev, quantidade: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Valor unitario</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valor_unitario}
                  onChange={(event) => setForm((prev) => ({ ...prev, valor_unitario: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Fornecedor</label>
                <input
                  value={form.fornecedor}
                  onChange={(event) => setForm((prev) => ({ ...prev, fornecedor: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Nome da empresa (opcional)"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={salvando}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Adicionar"}
              </button>
              <button
                type="button"
                onClick={() => setFormVisivel(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
          Carregando itens de orcamento...
        </div>
      ) : itensFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
          Nenhum item encontrado para o filtro selecionado.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">Categoria / Item</th>
                <th className="px-4 py-3 text-right">Qtd.</th>
                <th className="px-4 py-3 text-right">Valor unit.</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {itensFiltrados.map((item) => {
                const evento = eventosMap.get(item.evento_id);
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{evento?.titulo ?? "Evento removido"}</p>
                      <p className="text-xs text-slate-500">{evento?.periodo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{item.categoria}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.descricao}</p>
                      {item.fornecedor ? (
                        <p className="text-xs text-slate-500 mt-1">Fornecedor: {item.fornecedor}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right">{item.quantidade ?? "-"}</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(Number(item.valor_unitario ?? 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(calculateBudgetItemTotal(item))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAprovacao(item)}
                        disabled={itemAtualizando === item.id}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${
                          item.aprovado
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        } disabled:opacity-60`}
                      >
                        {item.aprovado ? "Aprovado" : "Pendente"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString("pt-BR") : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ResumoCard = ({
  label,
  value,
  icon,
  accent = "bg-slate-100",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: string;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between">
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div>
  </div>
);
