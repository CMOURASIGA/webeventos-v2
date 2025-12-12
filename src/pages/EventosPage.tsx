import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useEventos } from "@/hooks/useEventos";
import { useDepartamentos } from "@/hooks/useDepartamentos";
import { useEquipes } from "@/hooks/useEquipes";
import type { Evento } from "@/types/eventos";
import { EventoForm } from "@/components/EventoForm";

const statusLabels: Record<string, string> = {
  input: "Input",
  criacao_tarefas: "Criacao de tarefas",
  geracao_orcamento: "Orcamento",
  aguardando_aprovacao: "Aguardando aprovacao",
  execucao: "Execucao",
  pos_evento: "Pos evento",
  cancelado: "Cancelado",
};

export const EventosPage = () => {
  const { eventos, loading, error, criarEvento, atualizarEvento, excluirEvento } = useEventos();
  const { departamentos } = useDepartamentos();
  const { equipes } = useEquipes();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null);

  const departamentosMap = useMemo(() => {
    const map = new Map<string, string>();
    departamentos.forEach((dep) => map.set(dep.id, dep.nome));
    return map;
  }, [departamentos]);

  const equipesMap = useMemo(() => {
    const map = new Map<string, string>();
    equipes.forEach((team) => map.set(team.id, team.nome));
    return map;
  }, [equipes]);

  const iniciarCriacao = () => {
    setEventoSelecionado(null);
    setMostrarFormulario(true);
  };

  const iniciarEdicao = (evento: Evento) => {
    setEventoSelecionado(evento);
    setMostrarFormulario(true);
  };

  const handleSubmit = async (dados: Parameters<typeof criarEvento>[0]) => {
    const sucesso = eventoSelecionado
      ? await atualizarEvento(eventoSelecionado.id, dados)
      : await criarEvento(dados);
    if (sucesso) {
      setMostrarFormulario(false);
      setEventoSelecionado(null);
    }
  };

  const handleExcluir = async (evento: Evento) => {
    const confirmado = window.confirm(`Deseja excluir o evento "${evento.titulo}"?`);
    if (!confirmado) return;
    await excluirEvento(evento.id);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Eventos</h1>
          <p className="text-slate-500">Gerencie registros conectados ao Supabase.</p>
        </div>
        <button
          onClick={iniciarCriacao}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition"
          disabled={loading}
        >
          Novo evento
        </button>
      </header>

      {error ? <p className="text-sm text-red-600">Erro: {error}</p> : null}

      {mostrarFormulario ? (
        <EventoForm
          eventoInicial={eventoSelecionado}
          onSubmit={handleSubmit}
          onCancel={() => {
            setMostrarFormulario(false);
            setEventoSelecionado(null);
          }}
          submitting={loading}
        />
      ) : null}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
          <thead className="bg-slate-50 text-left font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-3">Titulo</th>
              <th className="px-4 py-3">Periodo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Prioridade</th>
              <th className="px-4 py-3">Equipe</th>
              <th className="px-4 py-3">Departamento</th>
              <th className="px-4 py-3 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {eventos.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={7}>
                  Nenhum evento cadastrado.
                </td>
              </tr>
            ) : (
              eventos.map((evento) => (
                <tr key={evento.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{evento.titulo}</div>
                    <p className="text-xs text-slate-500 line-clamp-2">{evento.descricao}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    <div>{evento.data_inicio ? new Date(evento.data_inicio).toLocaleDateString() : "-"}</div>
                    <div className="text-xs">
                      ate {evento.data_fim ? new Date(evento.data_fim).toLocaleDateString() : "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3">{statusLabels[evento.status] ?? evento.status}</td>
                  <td className="px-4 py-3 capitalize">{evento.prioridade}</td>
                  <td className="px-4 py-3">{evento.equipe_id ? equipesMap.get(evento.equipe_id) ?? "-" : "-"}</td>
                  <td className="px-4 py-3">
                    {evento.departamento_id ? departamentosMap.get(evento.departamento_id) ?? "-" : "-"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link
                      to={`/eventos/${evento.id}`}
                      className="px-3 py-1 rounded-lg border border-brand-100 text-brand-700 hover:bg-brand-50 transition inline-block"
                    >
                      Ver detalhes
                    </Link>
                    <button
                      onClick={() => iniciarEdicao(evento)}
                      className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleExcluir(evento)}
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
        {loading ? <p className="px-4 py-3 text-sm text-slate-500">Carregando eventos...</p> : null}
      </div>
    </div>
  );
};
