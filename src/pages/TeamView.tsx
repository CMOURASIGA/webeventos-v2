import { useEffect, useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  status: "Online" | "Em projeto" | "Offline";
  workload: number; // 0 a 100
  availability: "Livre" | "Ocupado" | "Em evento";
  currentEvent?: string;
  avatar: string;
}

const MOCK_MEMBERS: TeamMember[] = [
  {
    id: "1",
    name: "Mariana Almeida",
    role: "Produtora Executiva",
    skills: ["Negociação", "Budget", "Logística"],
    status: "Online",
    workload: 35,
    availability: "Livre",
    avatar: "https://i.pravatar.cc/150?img=5",
  },
  {
    id: "2",
    name: "Daniel Ribeiro",
    role: "Especialista em Som",
    skills: ["Áudio AO vivo", "Mixagem", "Rider técnico"],
    status: "Em projeto",
    workload: 80,
    availability: "Em evento",
    currentEvent: "Summit Tech 2025",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    id: "3",
    name: "Bianca Costa",
    role: "UX Experience Designer",
    skills: ["Sinalização", "Fluxo de público", "Interações"],
    status: "Online",
    workload: 40,
    availability: "Livre",
    avatar: "https://i.pravatar.cc/150?img=32",
  },
  {
    id: "4",
    name: "Carlos Meireles",
    role: "Segurança VIP",
    skills: ["Gestão de risco", "Escolta", "Protocolos"],
    status: "Offline",
    workload: 10,
    availability: "Ocupado",
    currentEvent: "Roadshow Corporativo",
    avatar: "https://i.pravatar.cc/150?img=48",
  },
  {
    id: "5",
    name: "Iris Nakamura",
    role: "Stage Manager",
    skills: ["Cronograma", "Backstage", "Cenografia"],
    status: "Em projeto",
    workload: 65,
    availability: "Em evento",
    currentEvent: "Festival Cultura Viva",
    avatar: "https://i.pravatar.cc/150?img=21",
  },
  {
    id: "6",
    name: "Henrique Dias",
    role: "Coordenador de Fornecedores",
    skills: ["Contratos", "Cozinha industrial", "Infra"],
    status: "Online",
    workload: 20,
    availability: "Livre",
    avatar: "https://i.pravatar.cc/150?img=15",
  },
];

export const TeamView = () => {
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<string | null>(null);
  const [filtered, setFiltered] = useState<TeamMember[]>(MOCK_MEMBERS);

  useEffect(() => {
    const normalizedSearch = search.toLowerCase();
    const next = MOCK_MEMBERS.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(normalizedSearch) ||
        member.skills.some((skill) => skill.toLowerCase().includes(normalizedSearch));
      const matchesAvailability = availabilityFilter ? member.availability === availabilityFilter : true;
      return matchesSearch && matchesAvailability;
    });
    setFiltered(next);
  }, [search, availabilityFilter]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-500">Recursos humanos</p>
        <h1 className="text-3xl font-bold text-slate-900">Equipe operacional</h1>
        <p className="text-slate-500">
          Visualize disponibilidade, competências e carga de trabalho para alocar a equipe ideal em cada evento.
        </p>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou habilidade"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <select
            value={availabilityFilter ?? ""}
            onChange={(event) => setAvailabilityFilter(event.target.value || null)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todas as disponibilidades</option>
            <option value="Livre">Disponível</option>
            <option value="Ocupado">Em planejamento</option>
            <option value="Em evento">Em evento</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
          <div>
            <span className="block font-semibold text-lg text-slate-900">{MOCK_MEMBERS.filter((m) => m.availability === "Livre").length}</span>
            Profissionais livres
          </div>
          <div>
            <span className="block font-semibold text-lg text-slate-900">{MOCK_MEMBERS.filter((m) => m.availability === "Ocupado").length}</span>
            Em planejamento
          </div>
          <div>
            <span className="block font-semibold text-lg text-slate-900">{MOCK_MEMBERS.filter((m) => m.availability === "Em evento").length}</span>
            Atuando em evento
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((member) => (
          <div key={member.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
              <div>
                <h3 className="text-base font-semibold text-slate-900">{member.name}</h3>
                <p className="text-sm text-slate-500">{member.role}</p>
              </div>
              <span
                className={`ml-auto px-2 py-1 text-xs rounded-full font-medium ${
                  member.status === "Online"
                    ? "bg-emerald-50 text-emerald-700"
                    : member.status === "Em projeto"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {member.status}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-slate-500">Disponibilidade</p>
                <p className="text-sm font-medium text-slate-900">{member.availability}</p>
                {member.currentEvent ? (
                  <p className="text-xs text-slate-500">Evento: {member.currentEvent}</p>
                ) : null}
              </div>

              <div>
                <p className="text-xs text-slate-500">Carga de trabalho</p>
                <div className="mt-1 h-2 bg-slate-100 rounded-full">
                  <div
                    className={`h-2 rounded-full ${member.workload < 40 ? "bg-emerald-500" : member.workload < 75 ? "bg-amber-500" : "bg-rose-500"}`}
                    style={{ width: `${member.workload}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{member.workload}% ocupado</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Competências</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {member.skills.map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-slate-100 text-xs rounded-full text-slate-600">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 ? (
          <div className="col-span-full text-center text-sm text-slate-500 py-8 bg-white rounded-2xl border border-slate-200">
            Nenhum profissional encontrado para os filtros selecionados.
          </div>
        ) : null}
      </div>
    </div>
  );
};
