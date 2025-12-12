import React from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { EventosPage } from "@/pages/EventosPage";
import { EventoDetailsPage } from "@/pages/EventoDetailsPage";
import { ConfiguracoesEquipesPage } from "@/pages/ConfiguracoesEquipesPage";
import { TarefasPage } from "@/pages/TarefasPage";
import { OrcamentosPage } from "@/pages/OrcamentosPage";
import { AprovacoesPage } from "@/pages/AprovacoesPage";
import { RelatoriosPage } from "@/pages/RelatoriosPage";
import { RelatorioEventoPrintPage } from "@/pages/RelatorioEventoPrintPage";
import { TeamView } from "@/pages/TeamView";
import Login from "@/components/Login";
import { useAuth } from "@/contexts/AuthContext";

const PlaceholderView = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-white rounded-3xl border border-dashed border-slate-300">
    <h2 className="text-2xl font-bold text-slate-300 mb-2 capitalize">{label}</h2>
    <p className="text-slate-400">Em breve.</p>
  </div>
);

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const pathToView = () => {
    if (location.pathname.startsWith("/eventos")) return "events";
    if (location.pathname.startsWith("/tarefas")) return "tasks";
    if (location.pathname.startsWith("/orcamentos")) return "budgets";
    if (location.pathname.startsWith("/relatorios")) return "reports";
    if (location.pathname.startsWith("/aprovacoes")) return "approvals";
    if (location.pathname.startsWith("/equipe")) return "team";
    if (location.pathname.startsWith("/configuracoes")) return "settings";
    return "dashboard";
  };

  const handleNavigate = (view: string) => {
    switch (view) {
      case "dashboard":
        navigate("/");
        break;
      case "events":
        navigate("/eventos");
        break;
      case "tasks":
        navigate("/tarefas");
        break;
      case "budgets":
        navigate("/orcamentos");
        break;
      case "approvals":
        navigate("/aprovacoes");
        break;
      case "reports":
        navigate("/relatorios");
        break;
      case "team":
        navigate("/equipe");
        break;
      case "settings":
        navigate("/configuracoes/equipes");
        break;
      default:
        navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (location.pathname.match(/^\/relatorios\/[A-Za-z0-9-]+\/impressao$/)) {
    return (
      <Routes>
        <Route path="/relatorios/:eventoId/impressao" element={<RelatorioEventoPrintPage />} />
      </Routes>
    );
  }

  return (
    <Layout activeView={pathToView()} onNavigate={handleNavigate}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/eventos" element={<EventosPage />} />
        <Route path="/eventos/:eventoId" element={<EventoDetailsPage />} />
        <Route path="/configuracoes/equipes" element={<ConfiguracoesEquipesPage />} />
        <Route path="/tarefas" element={<TarefasPage />} />
        <Route path="/orcamentos" element={<OrcamentosPage />} />
        <Route path="/aprovacoes" element={<AprovacoesPage />} />
        <Route path="/relatorios" element={<RelatoriosPage />} />
        <Route path="/equipe" element={<TeamView />} />
        <Route path="*" element={<PlaceholderView label="nao encontrado" />} />
      </Routes>
    </Layout>
  );
};

export default App;
