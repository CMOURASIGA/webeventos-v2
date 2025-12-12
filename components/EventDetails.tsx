import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Wallet, 
  CheckSquare, 
  Sparkles 
} from 'lucide-react';
import { Event } from '../types';
import { StatusBadge } from './ui/StatusBadge';
import { generateEventConcept } from '../services/aiService';

interface EventDetailsProps {
  event: Event;
  onBack: () => void;
}

export const EventDetails: React.FC<EventDetailsProps> = ({ event, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleAiGenerate = async () => {
    setLoadingAi(true);
    const suggestion = await generateEventConcept(event.title, "Corporate Conference");
    setAiSuggestion(suggestion);
    setLoadingAi(false);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'budget', label: 'Budget' },
    { id: 'team', label: 'Team' },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[80vh] animate-in slide-in-from-right duration-300">
      {/* Hero Header */}
      <div className="relative h-64 bg-slate-900">
        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        
        <div className="absolute top-6 left-6 z-10">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-medium transition-all"
          >
            <ArrowLeft size={16} />
            Back to List
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <StatusBadge status={event.status} />
                <span className="text-white/80 text-sm font-medium tracking-wide uppercase">Corporate Event</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 shadow-sm">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-6 text-white/90 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-brand-300" />
                  {new Date(event.dateStart).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-brand-300" />
                  {event.location}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="bg-white text-slate-900 px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-100 transition-colors shadow-lg">
                Edit Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 px-8">
        <div className="flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-brand-600 text-brand-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Description</h3>
                <p className="text-slate-600 leading-relaxed">{event.description}</p>
                
                {/* AI Integration Section */}
                <div className="mt-6 p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Sparkles size={18} className="text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-indigo-900">AI Assistant</h4>
                      {!aiSuggestion ? (
                        <div className="mt-2">
                          <p className="text-sm text-indigo-700 mb-3">Want a more engaging description? Let Gemini generate one for you.</p>
                          <button 
                            onClick={handleAiGenerate}
                            disabled={loadingAi}
                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                          >
                            {loadingAi ? 'Generating...' : 'Enhance Description'}
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2 animate-fade-in">
                          <p className="text-sm text-slate-700 italic border-l-2 border-indigo-300 pl-3 py-1 bg-white/50 rounded-r-lg">
                            {aiSuggestion}
                          </p>
                          <button onClick={() => setAiSuggestion(null)} className="text-xs text-indigo-500 mt-2 hover:underline">Clear</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Budget Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Total Budget</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">${event.budgetTotal.toLocaleString()}</p>
                   </div>
                   <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Spent</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">${event.budgetSpent.toLocaleString()}</p>
                   </div>
                   <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Remaining</p>
                      <p className="text-xl font-bold text-emerald-600 mt-1">${(event.budgetTotal - event.budgetSpent).toLocaleString()}</p>
                   </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Users size={18} className="text-slate-400" /> Team
                </h3>
                <div className="space-y-3">
                  {event.team.map(member => (
                    <div key={member.id} className="flex items-center gap-3">
                      <img src={member.avatarUrl} className="w-8 h-8 rounded-full bg-slate-200 object-cover" alt={member.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{member.name}</p>
                        <p className="text-xs text-slate-500 truncate">{member.roleInEvent}</p>
                      </div>
                    </div>
                  ))}
                  {event.team.length === 0 && <p className="text-sm text-slate-400 italic">No team members assigned.</p>}
                  <button className="w-full mt-2 py-2 text-sm text-brand-600 font-medium border border-brand-100 rounded-lg hover:bg-brand-50 transition-colors">
                    Manage Team
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                 <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Wallet size={18} className="text-slate-400" /> Quick Actions
                </h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Export Report (PDF)</button>
                  <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Send Invites</button>
                  <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">Cancel Event</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Task List</h3>
                <button className="flex items-center gap-2 text-sm bg-slate-900 text-white px-3 py-2 rounded-lg hover:bg-slate-800">
                  <CheckSquare size={16} /> Add Task
                </button>
             </div>
             {event.tasks.length > 0 ? (
               <div className="grid gap-3">
                 {event.tasks.map(task => (
                   <div key={task.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 rounded-md border-2 cursor-pointer ${task.status === 'DONE' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}></div>
                        <div>
                          <p className={`font-medium ${task.status === 'DONE' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</p>
                          <p className="text-xs text-slate-500">Due {task.dueDate}</p>
                        </div>
                     </div>
                     <StatusBadge status={task.priority} size="sm" />
                   </div>
                 ))}
               </div>
             ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <CheckSquare size={48} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">No tasks created yet.</p>
                </div>
             )}
          </div>
        )}
        
        {/* Placeholders for other tabs */}
        {(activeTab === 'budget' || activeTab === 'team') && (
          <div className="flex items-center justify-center h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-500">Module under development</p>
          </div>
        )}
      </div>
    </div>
  );
};