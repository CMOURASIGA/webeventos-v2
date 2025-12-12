<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Gestão de Eventos/Serviços

Plataforma web para coordenar eventos corporativos e operações de serviços com foco em visibilidade em tempo real, automação de rotinas e colaboração entre equipes. O projeto nasceu como “Lumina EventOS” e agora evoluiu para um hub completo conectado ao Supabase, cobrindo todo o ciclo: planejamento, execução, acompanhamento financeiro e gestão da força de trabalho.

## Principais módulos

- **Dashboard operacional** – visão rápida de eventos ativos, KPIs financeiros, tarefas pendentes e alertas críticos.
- **Eventos e Detalhes** – CRUD completo, timeline do evento, categorias de orçamento, widgets de progresso e impressões dedicadas.
- **Tarefas** – quadro de atividades integrado aos eventos, com filtros por status e responsáveis sincronizados do Supabase.
- **Orçamentos** – acompanhamento das categorias e itens aprovados em cada evento, com cálculo de alocação x gasto real.
- **Aprovações** – workflow para aprovar orçamentos/itens, com políticas de segurança aplicadas diretamente no banco.
- **Relatórios** – página de analytics com cards, gráficos Recharts e relatório imprimível consolidando os indicadores.
- **Equipe (Team View)** – painel de disponibilidade, carga, competências e tarefas ativas de cada colaborador.
- **Configurações de Equipes** – manutenção de perfis, departamentos e memberships com persistência via Supabase.

## Tecnologias e arquitetura

| Camada | Stack |
| --- | --- |
| Front-end | React 19 + TypeScript + Vite 6 |
| UI | Tailwind (via CDN), componentes próprios e ícones `lucide-react` |
| Dados | Supabase (`@supabase/supabase-js`) para autenticação, perfis, eventos, orçamentos, tarefas etc. |
| Visualização | `recharts` em dashboards e relatórios |
| Deploy | Vercel (build automático a cada push no branch `main`) |

### Estrutura relevante

```
components/           # Layout principal, Dashboard e componentes reutilizáveis
src/hooks/            # Hooks especializados (eventos, tarefas, equipes, aprovações...)
src/pages/            # Páginas de domínio (Eventos, Tarefas, Orçamentos, Relatórios, Team View…)
src/contexts/         # Contextos como AuthContext (Supabase auth)
src/services/         # Serviços auxiliares (approvals, progress tracking)
DB/                   # Policies SQL utilizadas no Supabase
```

## Executando localmente

### Pré-requisitos

- Node.js 18+ (recomendado 20+)
- Conta no [Supabase](https://supabase.com/) com as tabelas previstas no projeto

### Passos

1. **Instalar dependências**
   ```bash
   npm install
   ```
2. **Configurar variáveis de ambiente**  
   Copie o arquivo `.env.example` para `.env` e informe suas credenciais:
   ```
   VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
   VITE_SUPABASE_ANON_KEY=<chave-publica>
   ```
3. **Executar em modo desenvolvimento**
   ```bash
   npm run dev
   ```
   O Vite exibirá a URL local (por padrão `http://localhost:5173`).

### Scripts disponíveis

| Script | Descrição |
| --- | --- |
| `npm run dev` | Inicia o Vite em modo desenvolvimento |
| `npm run build` | Gera a versão otimizada para produção |
| `npm run preview` | Sobe um servidor local para inspecionar o build |

## Integração com Supabase

- **AuthContext** (`src/contexts/AuthContext.tsx`) controla login/logout e expõe os perfis autenticados.
- Hooks como `useEventos`, `useTarefas`, `usePerfis` e `useEquipes` cuidam de buscar, criar e atualizar os registros.
- Diretório `DB/` guarda as policies SQL usadas para restringir o acesso por equipe/perfil.
- A página **Team View** demonstra a sincronização completa: perfis e tarefas são consultados do Supabase e enriquecidos para cálculo de disponibilidade.

## Deploy

O repositório está conectado à Vercel. Cada push no branch `main` dispara automaticamente:

1. `npm install`
2. `npm run build`
3. Deploy da build gerada

Caso precise forçar um novo deploy, basta gerar um novo commit ou usar “Redeploy” no dashboard referente ao commit atual.

---

Sinta-se à vontade para abrir issues ou PRs com sugestões. O objetivo é continuar evoluindo o ecossistema de Gestão de Eventos/Serviços para cobrir mais fluxos operacionais e integrações. 🚀
