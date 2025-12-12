import { useMemo, useState } from "react";
import { useTarefas } from "@/hooks/useTarefas";
import { usePerfis } from "@/hooks/usePerfis";
import type { Tarefa } from "@/types/eventos";
import { TarefaForm } from "./TarefaForm";

interface TarefasDoEventoProps {
  eventoId: string;
  equipeId?: string | null;
}

export const TarefasDoEvento = ({ eventoId, equipeId }: TarefasDoEventoProps) => {
  const { tarefas, loading, error, criarTarefa, atualizarTarefa, excluirTarefa } = useTarefas(eventoId);
  const { perfis } = usePerfis();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [tarefaSelecionada, setTarefaSelecionada] = useState<Tarefa | null>(null);

  const perfisMap = useMemo(() => {
    const map = new Map<string, string>();
    perfis.forEach((perfil) => map.set(perfil.id, perfil.nome ?? perfil.email));
    return map;
  }, [perfis]);

  const handleCriar = async (dados: Parameters<typeof criarTarefa>[0]) => {
    await criarTarefa(dados);
    setMostrarFormulario(false);
    setTarefaSelecionada(null);
  };

  const handleAtualizar = async (dados: Parameters<typeof criarTarefa>[0]) => {
    if (!tarefaSelecionada) return;
    await atualizarTarefa(tarefaSelecionada.id, dados);
    setMostrarFormulario(false);
    setTarefaSelecionada(null);
  };

  const handleExcluir = async (tarefa: Tarefa) => {
    const confirmed = window.confirm(`Deseja excluir a tarefa "${tarefa.titulo}"?`);
    if (!confirmed) return;
    await excluirTarefa(tarefa.id);
  };

  const startCriacao = () => {
    setTarefaSelecionada(null);
    setMostrarFormulario(true);
  };

  const startEdicao = (tarefa: Tarefa) => {
    setTarefaSelecionada(tarefa);
    setMostrarFormulario(true);
  };

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Tarefas do evento</h2>
          <p className="text-sm text-slate-500">Cadastre e acompanhe entregas por responsavel.</p>
        </div>
        <button
          onClick={startCriacao}
          className="px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition"
          disabled={loading}
        >
          Nova tarefa
        </button>
      </header>

      {error ? <p className="text-sm text-red-600">Erro: {error}</p> : null}

      {mostrarFormulario ? (
        <TarefaForm
          eventoId={eventoId}
          equipeId={equipeId}
          perfis={perfis}
          tarefaInicial={tarefaSelecionada}
          onSubmit={tarefaSelecionada ? handleAtualizar : handleCriar}
          onCancel={() => {
            setMostrarFormulario(false);
            setTarefaSelecionada(null);
          }}
          submitting={loading}
        />
      ) : null}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-3">Titulo</th>
              <th className="px-4 py-3">Responsavel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Prioridade</th>
              <th className="px-4 py-3">Prazo</th>
              <th className="px-4 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {tarefas.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                  Nenhuma tarefa cadastrada.
                </td>
              </tr>
            ) : (
              tarefas.map((tarefa) => (
                <tr key={tarefa.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{tarefa.titulo}</div>
                    <p className="text-xs text-slate-500 line-clamp-2">{tarefa.descricao}</p>
                  </td>
                  <td className="px-4 py-3">
                    {tarefa.responsavel_id ? perfisMap.get(tarefa.responsavel_id) ?? tarefa.responsavel_id : "-"}
                  </td>
                  <td className="px-4 py-3 capitalize">{tarefa.status}</td>
                  <td className="px-4 py-3 capitalize">{tarefa.prioridade}</td>
                  <td className="px-4 py-3">
                    {tarefa.prazo ? new Date(tarefa.prazo).toLocaleDateString() : "Sem prazo"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => startEdicao(tarefa)}
                      className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleExcluir(tarefa)}
                      className="px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {loading ? <p className="px-4 py-3 text-sm text-slate-500">Carregando tarefas...</p> : null}
      </div>
    </section>
  );
};
