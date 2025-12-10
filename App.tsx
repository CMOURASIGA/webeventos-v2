import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { EventsView } from './components/EventsView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'events':
        return <EventsView />;
      case 'tasks':
      case 'reports':
      case 'team':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-white rounded-3xl border border-dashed border-slate-300">
            <h2 className="text-2xl font-bold text-slate-300 mb-2 capitalize">{currentView} View</h2>
            <p className="text-slate-400">This module is part of the premium suite.</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default App;