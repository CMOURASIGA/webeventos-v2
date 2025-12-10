import React from 'react';
import { 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  MoreHorizontal 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MOCK_EVENTS } from '../constants';

const data = [
  { name: 'Jan', events: 2 },
  { name: 'Feb', events: 1 },
  { name: 'Mar', events: 3 },
  { name: 'Apr', events: 4 },
  { name: 'May', events: 2 },
  { name: 'Jun', events: 6 },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your event portfolio and performance.</p>
        </div>
        <div className="text-sm text-slate-500">Last updated: Just now</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Events', value: '12', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Tasks', value: '48', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Total Attendees', value: '8.5k', icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Budget Used', value: '64%', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={22} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800">Event Volume</h3>
            <select className="text-sm border-none bg-slate-50 text-slate-600 rounded-lg px-2 py-1 focus:ring-0">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="events" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 5 ? '#7c3aed' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Upcoming */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800">Upcoming Events</h3>
            <button className="text-brand-600 text-sm font-medium hover:text-brand-700">View All</button>
          </div>
          <div className="space-y-4">
            {MOCK_EVENTS.slice(0, 3).map((event) => (
              <div key={event.id} className="flex items-center gap-4 group cursor-pointer p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                  <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 text-sm truncate group-hover:text-brand-600 transition-colors">{event.title}</h4>
                  <p className="text-xs text-slate-500 truncate">{new Date(event.dateStart).toLocaleDateString()}</p>
                </div>
                <button className="text-slate-300 hover:text-slate-600">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100">
             <h3 className="font-semibold text-slate-800 mb-4">Pending Approvals</h3>
             <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 flex items-start gap-3">
               <AlertCircle size={18} className="text-amber-600 mt-0.5" />
               <div>
                 <p className="text-sm font-medium text-amber-900">Budget Overrun Request</p>
                 <p className="text-xs text-amber-700 mt-1">TechSummit Catering needs +$5k.</p>
                 <div className="mt-2 flex gap-2">
                   <button className="text-xs bg-white border border-amber-200 text-amber-800 px-2 py-1 rounded shadow-sm hover:bg-amber-100">Review</button>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};