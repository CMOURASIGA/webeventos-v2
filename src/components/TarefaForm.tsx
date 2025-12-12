import { useEffect, useState } from "react";
import type { Perfil, Tarefa, TarefaPayload, TaskStatus, EventPriority } from "@/types/eventos";

interface TarefaFormProps {
  eventoId: string;
  equipeId?: string | null;
  perfis?: Perfil[];
  tarefaInicial?: Tarefa | null;
  onSubmit: (dados: TarefaPayload) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
}

const STATUS_OPTIONS: TaskStatus[] = ["pendente", "em_andamento", "concluida", "cancelada"];
const PRIORIDADE_OPTIONS: EventPriority[] = ["baixa", "media", "alta", "urgente"];

const dateToInput = (value?: string | null) => value?.slice(0, 10) ?? "";

export const TarefaForm = ({
  eventoId,
  equipeId,
  perfis = [],
  tarefaInicial,
  onSubmit,
  onCancel,
  submitting,
}: TarefaFormProps) => {
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    responsavel_id: "",
    prazo: "",
    status: STATUS_OPTIONS[0],
    prioridade: PRIORIDADE_OPTIONS[1],
  });

  useEffect(() => {
    if (!tarefaInicial) {
      setFormData({
        titulo: "",
        descricao: "",
        responsavel_id: "",
        prazo: "",
        status: STATUS_OPTIONS[0],
        prioridade: PRIORIDADE_OPTIONS[1],
      });
      return;
    }

    setFormData({
      titulo: tarefaInicial.titulo,
      descricao: tarefaInicial.descricao ?? "",
      responsavel_id: tarefaInicial.responsavel_id ?? "",
      prazo: dateToInput(tarefaInicial.prazo),
      status: tarefaInicial.status ?? STATUS_OPTIONS[0],
      prioridade: tarefaInicial.prioridade ?? PRIORIDADE_OPTIONS[1],
    });
  }, [tarefaInicial]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      evento_id: eventoId,
      titulo: formData.titulo,
      descricao: formData.descricao || null,
      responsavel_id: formData.responsavel_id || null,
      prazo: formData.prazo || null,
      status: formData.status,
      prioridade: formData.prioridade,
      data_conclusao: tarefaInicial?.data_conclusao ?? null,
      equipe_id: equipeId ?? null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Titulo</label>
        <input
          type="text"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={formData.titulo}
          onChange={(event) => handleChange("titulo", event.target.value)}
          required
          disabled={submitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descricao</label>
        <textarea
          className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          rows={3}
          value={formData.descricao}
          onChange={(event) => handleChange("descricao", event.target.value)}
          disabled={submitting}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Responsavel</label>
          <select
            className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={formData.responsavel_id}
            onChange={(event) => handleChange("responsavel_id", event.target.value)}
            disabled={submitting}
          >
            <option value="">Selecione...</option>
            {perfis.map((perfil) => (
              <option key={perfil.id} value={perfil.id}>
                {perfil.nome ?? perfil.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Prazo</label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={formData.prazo}
            onChange={(event) => handleChange("prazo", event.target.value)}
            disabled={submitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={formData.status}
            onChange={(event) => handleChange("status", event.target.value)}
            disabled={submitting}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
          <select
            className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={formData.prioridade}
            onChange={(event) => handleChange("prioridade", event.target.value)}
            disabled={submitting}
          >
            {PRIORIDADE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel ? (
          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancelar
          </button>
        ) : null}
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition disabled:bg-slate-300"
          disabled={submitting}
        >
          {tarefaInicial ? "Salvar alteracoes" : "Criar tarefa"}
        </button>
      </div>
    </form>
  );
};
