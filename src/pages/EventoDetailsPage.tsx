import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEventos } from "@/hooks/useEventos";
import { useDepartamentos } from "@/hooks/useDepartamentos";
import { useEquipes } from "@/hooks/useEquipes";
import { usePerfis } from "@/hooks/usePerfis";
import { EventoForm } from "@/components/EventoForm";
import { TarefasDoEvento } from "@/components/TarefasDoEvento";

export const EventoDetailsPage = () => {
  const navigate = useNavigate();
  const { eventoId } = useParams<{ eventoId: string }>();
  const { eventos, loading, error, atualizarEvento } = useEventos();
  const { departamentos } = useDepartamentos();
  const { equipes } = useEquipes();
  const { perfis } = usePerfis();

  const evento = useMemo(() => eventos.find((item) => item.id === eventoId), [eventos, eventoId]);

  const departamentoNome = evento?.departamento_id
    ? departamentos.find((dep) => dep.id === evento.departamento_id)?.nome ?? "-"
    : "-";
  const equipeNome = evento?.equipe_id ? equipes.find((team) => team.id === evento.equipe_id)?.nome ?? "-" : "-";
  const perfisMap = useMemo(() => {
    const map = new Map<string, string>();
    perfis.forEach((perfil) => map.set(perfil.id, perfil.nome ?? perfil.email));
    return map;
  }, [perfis]);

  if (!eventoId) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">ID do evento nao informado.</p>
        <Link to="/eventos" className="text-brand-600 underline">
          Voltar para eventos
        </Link>
      </div>
    );
  }

  if (loading && !evento) {
    return <p className="text-slate-500">Carregando evento...</p>;
  }

  if (!loading && !evento) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">Evento nao encontrado.</p>
        <Link to="/eventos" className="text-brand-600 underline">
          Voltar para eventos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-500 hover:text-slate-700 transition"
          >
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">{evento?.titulo}</h1>
          <p className="text-slate-500">{evento?.descricao}</p>
        </div>
        <div className="text-right text-sm text-slate-500 space-y-1">
          <div>
            <span className="font-semibold text-slate-700">Status:</span>{" "}
            <span className="capitalize">{evento?.status}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700">Prioridade:</span>{" "}
            <span className="capitalize">{evento?.prioridade}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700">Periodo:</span>{" "}
            {evento?.data_inicio ? new Date(evento.data_inicio).toLocaleDateString() : "-"} -{" "}
            {evento?.data_fim ? new Date(evento.data_fim).toLocaleDateString() : "-"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-slate-200 rounded-2xl p-4">
        <DetailItem label="Local" value={evento?.local ?? "-"} />
        <DetailItem label="Equipe" value={equipeNome} />
        <DetailItem label="Departamento" value={departamentoNome} />
        <DetailItem
          label="Responsavel"
          value={evento?.responsavel_id ? perfisMap.get(evento.responsavel_id) ?? evento.responsavel_id : "-"}
        />
        <DetailItem
          label="Solicitante"
          value={evento?.solicitante_id ? perfisMap.get(evento.solicitante_id) ?? evento.solicitante_id : "-"}
        />
        <DetailItem
          label="Participantes esperados"
          value={evento?.participantes_esperados ? String(evento.participantes_esperados) : "-"}
        />
        <DetailItem
          label="Orcamento previsto"
          value={
            evento?.orcamento_previsto !== null && evento?.orcamento_previsto !== undefined
              ? Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  Number(evento.orcamento_previsto)
                )
              : "-"
          }
        />
        <DetailItem
          label="Orcamento aprovado"
          value={
            evento?.orcamento_aprovado !== null && evento?.orcamento_aprovado !== undefined
              ? Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  Number(evento.orcamento_aprovado)
                )
              : "-"
          }
        />
      </div>

      {error ? <p className="text-sm text-red-600">Erro: {error}</p> : null}

      {evento ? (
        <EventoForm
          eventoInicial={evento}
          onSubmit={async (dados) => {
            await atualizarEvento(evento.id, dados);
          }}
          submitting={loading}
        />
      ) : null}

      <TarefasDoEvento eventoId={eventoId} equipeId={evento?.equipe_id} />
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs uppercase text-slate-500">{label}</p>
    <p className="text-slate-900">{value}</p>
  </div>
);
