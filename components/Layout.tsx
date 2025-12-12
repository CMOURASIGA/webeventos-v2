import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CheckSquare, 
  PieChart, 
  Users, 
  DollarSign,
  Settings, 
  Bell, 
  Search,
  Menu,
  X,
  Plus,
  BadgeCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import BrandIcon from '/logo.png';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeView, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { profile, user } = useAuth();

  const displayName = profile?.nome ?? user?.user_metadata?.full_name ?? user?.email ?? 'Usuário';
  const roleLabel = profile?.papel ?? 'Event Manager';
  const avatarUrl =
    (user?.user_metadata as { avatar_url?: string })?.avatar_url ??
    'https://ui-avatars.com/api/?name=User';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: CalendarDays },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
    { id: 'budgets', label: 'Orcamentos', icon: DollarSign },
    { id: 'approvals', label: 'Aprovacoes', icon: BadgeCheck },
    { id: 'reports', label: 'Reports', icon: PieChart },
    { id: 'team', label: 'Team', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-sand overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 shadow-sm z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center shadow-lg overflow-hidden">
            <img src={BrandIcon} alt="Gestão de Eventos/Serviços" className="w-11 h-11 object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-lg leading-tight">Gestão de Eventos/Serviços</span>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Planejamento e execução</span>
          </div>
        </div>


        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeView === item.id
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={18} className={activeView === item.id ? 'text-brand-600' : 'text-slate-400'} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => onNavigate('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg ${
              activeView === 'settings'
                ? 'text-brand-700 bg-brand-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings size={18} className={activeView === 'settings' ? 'text-brand-600' : 'text-slate-400'} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 flex justify-between items-center border-b border-slate-100">
          <span className="font-bold text-slate-800">Menu</span>
          <button onClick={() => setIsMobileMenuOpen(false)}><X size={20} className="text-slate-500" /></button>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                activeView === item.id ? 'bg-brand-50 text-brand-700' : 'text-slate-600'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              onNavigate('settings');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
              activeView === 'settings' ? 'bg-brand-50 text-brand-700' : 'text-slate-600'
            }`}
          >
            <Settings size={20} />
            Settings
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 z-10">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 text-slate-600"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search events, tasks..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none w-64 text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-700">{displayName}</p>
                <p className="text-xs text-slate-500 capitalize">{roleLabel}</p>
              </div>
              <img 
                src={avatarUrl} 
                alt="Profile" 
                className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover"
              />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
