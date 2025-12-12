export type EventStatus =
  | "input"
  | "criacao_tarefas"
  | "geracao_orcamento"
  | "aguardando_aprovacao"
  | "execucao"
  | "pos_evento"
  | "cancelado";

export type EventPriority = "baixa" | "media" | "alta" | "urgente";

export type TaskStatus = "pendente" | "em_andamento" | "concluida" | "cancelada";

export interface Departamento {
  id: string;
  nome: string;
  sigla: string | null;
}

export interface Equipe {
  id: string;
  nome: string;
  descricao: string | null;
  created_at: string;
}

export interface Perfil {
  id: string;
  nome: string | null;
  email: string;
  papel: string | null;
  equipe_id: string | null;
  departamento_id: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  permissoes?: Record<string, any> | null;
  avatar_url?: string | null;
}

export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  data_inicio: string | null;
  data_fim: string | null;
  local: string;
  status: EventStatus;
  prioridade: EventPriority;
  departamento_id: string | null;
  equipe_id: string | null;
  responsavel_id: string | null;
  solicitante_id: string | null;
  orcamento_previsto: number | null;
  orcamento_aprovado: number | null;
  participantes_esperados: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tarefa {
  id: string;
  evento_id: string;
  titulo: string;
  descricao: string | null;
  responsavel_id: string | null;
  prazo: string | null;
  status: TaskStatus;
  prioridade: EventPriority;
  data_conclusao: string | null;
  equipe_id: string | null;
  created_at: string;
  updated_at?: string;
}

export type EventoPayload = Omit<
  Evento,
  "id" | "created_at" | "updated_at"
>;

export type TarefaPayload = Omit<
  Tarefa,
  "id" | "created_at" | "updated_at"
>;

export interface EquipeMembro {
  equipe_id: string;
  perfil_id: string;
  created_at: string;
}

export interface OrcamentoItem {
  id: string;
  evento_id: string | null;
  categoria: string | null;
  descricao: string | null;
  quantidade: number | null;
  valor_unitario: number | null;
  valor_total: number | null;
  fornecedor: string | null;
  aprovado: boolean;
  equipe_id: string | null;
  created_at: string;
  updated_at: string;
}

export type AprovacaoStatus = "pendente" | "aprovado" | "rejeitado";

export interface Aprovacao {
  id: string;
  evento_id: string | null;
  tipo: string | null;
  status: AprovacaoStatus;
  solicitante_id: string | null;
  aprovador_id: string | null;
  observacoes: string | null;
  equipe_id: string | null;
  data_solicitacao: string;
  data_resposta: string | null;
}
