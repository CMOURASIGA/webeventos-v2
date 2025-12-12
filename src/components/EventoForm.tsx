import { useEffect, useMemo, useState } from "react";
import type { Evento, EventoPayload, EventPriority, EventStatus } from "@/types/eventos";
import { useDepartamentos } from "@/hooks/useDepartamentos";
import { useEquipes } from "@/hooks/useEquipes";
import { supabase } from "@/lib/supabaseClient";

interface EventoFormProps {
  eventoInicial?: Evento | null;
  onSubmit: (dados: EventoPayload) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
}

const STATUS_OPTIONS: EventStatus[] = [
  "input",
  "criacao_tarefas",
  "geracao_orcamento",
  "aguardando_aprovacao",
  "execucao",
  "pos_evento",
  "cancelado",
];

const PRIORIDADE_OPTIONS: EventPriority[] = ["baixa", "media", "alta", "urgente"];
const TIPOS_EVENTO = [
  "Congresso",
  "Workshop",
  "Seminario",
  "Feira",
  "Reuniao",
  "Treinamento",
  "Palestra",
  "Webinar",
  "Coquetel",
  "Outros",
];

const dateToInput = (value?: string | null) => {
  if (!value) return "";
  return value.slice(0, 10);
};

export const EventoForm = ({ eventoInicial, onSubmit, onCancel, submitting }: EventoFormProps) => {
  const { departamentos, listarDepartamentos } = useDepartamentos();
  const { equipes } = useEquipes();

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    tipo: TIPOS_EVENTO[0],
    data_inicio: "",
    data_fim: "",
    local: "",
    status: STATUS_OPTIONS[0] as EventStatus,
    prioridade: PRIORIDADE_OPTIONS[1] as EventPriority,
    departamento_id: "",
    equipe_id: "",
    responsavel_id: "",
    solicitante_id: "",
    orcamento_previsto: "",
    orcamento_aprovado: "",
    participantes_esperados: "",
    observacoes: "",
  });
  const [showNovoDepartamento, setShowNovoDepartamento] = useState(false);
  const [novoDepartamento, setNovoDepartamento] = useState({ nome: "", sigla: "" });
  const [creatingDepartamento, setCreatingDepartamento] = useState(false);
  const [departamentoError, setDepartamentoError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventoInicial) {
      setFormData((prev) => ({ ...prev, tipo: TIPOS_EVENTO[0] }));
      return;
    }

    setFormData({
      titulo: eventoInicial.titulo ?? "",
      descricao: eventoInicial.descricao ?? "",
      tipo: eventoInicial.tipo ?? TIPOS_EVENTO[0],
      data_inicio: dateToInput(eventoInicial.data_inicio),
      data_fim: dateToInput(eventoInicial.data_fim),
      local: eventoInicial.local ?? "",
      status: eventoInicial.status ?? STATUS_OPTIONS[0],
      prioridade: eventoInicial.prioridade ?? PRIORIDADE_OPTIONS[1],
      departamento_id: eventoInicial.departamento_id ?? "",
      equipe_id: eventoInicial.equipe_id ?? "",
      responsavel_id: eventoInicial.responsavel_id ?? "",
      solicitante_id: eventoInicial.solicitante_id ?? "",
      orcamento_previsto: eventoInicial.orcamento_previsto?.toString() ?? "",
      orcamento_aprovado: eventoInicial.orcamento_aprovado?.toString() ?? "",
      participantes_esperados: eventoInicial.participantes_esperados?.toString() ?? "",
      observacoes: eventoInicial.observacoes ?? "",
    });
  }, [eventoInicial]);

  const disabled = useMemo(() => submitting, [submitting]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      titulo: formData.titulo,
      descricao: formData.descricao,
      tipo: formData.tipo,
      data_inicio: formData.data_inicio || null,
      data_fim: formData.data_fim || null,
      local: formData.local,
      status: formData.status,
      prioridade: formData.prioridade,
      departamento_id: formData.departamento_id || null,
      equipe_id: formData.equipe_id || null,
      responsavel_id: formData.responsavel_id || null,
      solicitante_id: formData.solicitante_id || null,
      orcamento_previsto: formData.orcamento_previsto ? Number(formData.orcamento_previsto) : null,
      orcamento_aprovado: formData.orcamento_aprovado ? Number(formData.orcamento_aprovado) : null,
      participantes_esperados: formData.participantes_esperados
        ? Number(formData.participantes_esperados)
        : null,
      observacoes: formData.observacoes || null,
    });
  };

  const handleNovoDepartamento = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDepartamentoError(null);
    if (!novoDepartamento.nome.trim()) {
      setDepartamentoError("Informe um nome para o departamento.");
      return;
    }
    setCreatingDepartamento(true);
    const { data, error } = await supabase
      .from("departamentos")
      .insert([{ nome: novoDepartamento.nome.trim(), sigla: novoDepartamento.sigla.trim() || null }])
      .select()
      .single();
    setCreatingDepartamento(false);
    if (error) {
      setDepartamentoError(error.message);
      return;
    }
    await listarDepartamentos();
    setFormData((prev) => ({ ...prev, departamento_id: data?.id ?? "" }));
    setNovoDepartamento({ nome: "", sigla: "" });
    setShowNovoDepartamento(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">Equipe responsável *</label>
        <select
          className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
          value={formData.equipe_id}
          onChange={(event) => handleChange("equipe_id", event.target.value)}
          required
          disabled={disabled}
        >
          <option value="">Selecione a equipe...</option>
          {equipes.map((team) => (
            <option key={team.id} value={team.id}>
              {team.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Título do Evento *</label>
          <input
            type="text"
            placeholder="Ex: Congresso Nacional de Comércio 2025"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={formData.titulo}
            onChange={(event) => handleChange("titulo", event.target.value)}
            required
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Evento *</label>
          <select
            className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={formData.tipo}
            onChange={(event) => handleChange("tipo", event.target.value)}
            required
            disabled={disabled}
          >
            {TIPOS_EVENTO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição *</label>
        <textarea
          placeholder="Descreva os objetivos e detalhes do evento..."
          className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={4}
          value={formData.descricao}
          onChange={(event) => handleChange("descricao", event.target.value)}
          required
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Departamento *</label>
          <div className="flex gap-3">
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={formData.departamento_id}
              onChange={(event) => handleChange("departamento_id", event.target.value)}
              required
              disabled={disabled}
            >
              <option value="">Selecione...</option>
              {departamentos.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.nome}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNovoDepartamento((prev) => !prev)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-sm text-brand-600 hover:bg-brand-50"
              disabled={disabled}
            >
              Novo
            </button>
          </div>
          {showNovoDepartamento ? (
            <form onSubmit={handleNovoDepartamento} className="mt-3 space-y-2 rounded-xl border border-slate-200 p-3 bg-slate-50">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Nome do departamento</label>
                <input
                  type="text"
                  value={novoDepartamento.nome}
                  onChange={(event) => setNovoDepartamento((prev) => ({ ...prev, nome: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Sigla (opcional)</label>
                <input
                  type="text"
                  value={novoDepartamento.sigla}
                  onChange={(event) => setNovoDepartamento((prev) => ({ ...prev, sigla: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              {departamentoError ? <p className="text-xs text-red-600">{departamentoError}</p> : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-sm text-slate-500"
                  onClick={() => {
                    setShowNovoDepartamento(false);
                    setDepartamentoError(null);
                    setNovoDepartamento({ nome: "", sigla: "" });
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ml-auto px-3 py-1 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:bg-slate-300"
                  disabled={creatingDepartamento}
                >
                  {creatingDepartamento ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          ) : null}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data de início *</label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={formData.data_inicio}
              onChange={(event) => handleChange("data_inicio", event.target.value)}
              required
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data de término *</label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={formData.data_fim}
              onChange={(event) => handleChange("data_fim", event.target.value)}
              required
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Local do Evento *</label>
          <input
            type="text"
            placeholder="Ex: Centro de Convenções - Brasília/DF"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={formData.local}
            onChange={(event) => handleChange("local", event.target.value)}
            required
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={formData.status}
              onChange={(event) => handleChange("status", event.target.value)}
              required
              disabled={disabled}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade *</label>
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={formData.prioridade}
              onChange={(event) => handleChange("prioridade", event.target.value)}
              required
              disabled={disabled}
            >
              {PRIORIDADE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Participantes Esperados</label>
            <input
              type="number"
              min="0"
              placeholder="Ex: 500"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={formData.participantes_esperados}
              onChange={(event) => handleChange("participantes_esperados", event.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
        <textarea
          placeholder="Informações adicionais..."
          className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={3}
          value={formData.observacoes}
          onChange={(event) => handleChange("observacoes", event.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="flex justify-end gap-3">
        {onCancel ? (
          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
            onClick={onCancel}
            disabled={disabled}
          >
            Cancelar
          </button>
        ) : null}
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition disabled:bg-slate-300"
          disabled={disabled}
        >
          {eventoInicial ? "Salvar alteracoes" : "Criar evento"}
        </button>
      </div>
    </form>
  );
};
