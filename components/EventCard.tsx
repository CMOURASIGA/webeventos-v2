import React from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Event } from '../types';
import { StatusBadge } from './ui/StatusBadge';

interface EventCardProps {
  event: Event;
  onClick: (id: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  const budgetPercent = Math.min(Math.round((event.budgetSpent / event.budgetTotal) * 100), 100);
  
  return (
    <div 
      onClick={() => onClick(event.id)}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-brand-200 transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      <div className="relative h-40 overflow-hidden">
        <img 
          src={event.imageUrl} 
          alt={event.title} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3">
          <StatusBadge status={event.status} size="sm" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/60 to-transparent" />
        <h3 className="absolute bottom-3 left-4 text-white font-bold text-lg shadow-black drop-shadow-md truncate pr-4">{event.title}</h3>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-slate-500 text-sm">
            <Calendar size={14} className="mr-2" />
            <span>{new Date(event.dateStart).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-slate-500 text-sm">
            <MapPin size={14} className="mr-2" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center text-slate-500 text-sm">
            <Users size={14} className="mr-2" />
            <span>{event.attendeesRegistered} / {event.attendeesExpected} Reg.</span>
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
            <span>Budget</span>
            <span>{budgetPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full ${budgetPercent > 90 ? 'bg-red-500' : 'bg-brand-500'}`} 
              style={{ width: `${budgetPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};