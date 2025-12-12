import React, { useState } from 'react';
import { Filter, Grid, List, Plus } from 'lucide-react';
import { MOCK_EVENTS } from '../constants';
import { EventCard } from './EventCard';
import { EventDetails } from './EventDetails';

export const EventsView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  if (selectedEventId) {
    const event = MOCK_EVENTS.find(e => e.id === selectedEventId);
    if (!event) return null;
    return (
      <EventDetails 
        event={event} 
        onBack={() => setSelectedEventId(null)} 
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Events</h1>
          <p className="text-slate-500 mt-1">Manage your event portfolio, timelines, and budgets.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="hidden sm:flex bg-white border border-slate-200 rounded-lg p-1">
             <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
             >
               <Grid size={18} />
             </button>
             <button 
               onClick={() => setViewMode('list')}
               className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
             >
               <List size={18} />
             </button>
           </div>
           <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition-colors">
             <Filter size={18} />
             <span>Filter</span>
           </button>
           <button className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200">
             <Plus size={18} />
             <span>Create Event</span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MOCK_EVENTS.map(event => (
          <EventCard 
            key={event.id} 
            event={event} 
            onClick={setSelectedEventId} 
          />
        ))}
        
        {/* Empty State placeholder if needed, otherwise hidden */}
        {MOCK_EVENTS.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <p className="text-slate-500">No events found. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
};