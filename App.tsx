
import React, { useState } from 'react';
import { SCENARIOS, CATEGORY_OBJECTIVES } from './constants';
import ScenarioCard from './components/ScenarioCard';
import ChatInterface from './components/ChatInterface';
import AnalysisView from './components/AnalysisView';
import { Scenario, Message, Category } from './types';

enum View {
  HOME = 'home',
  CHAT = 'chat',
  ANALYSIS = 'analysis'
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [sessionMessages, setSessionMessages] = useState<Message[]>([]);
  const [filterCategory, setFilterCategory] = useState<Category | 'ALL'>('ALL');
  
  // Initialize scenarios in state to allow editing
  const [allScenarios, setAllScenarios] = useState<Scenario[]>(SCENARIOS);

  const handleScenarioSelect = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setCurrentView(View.CHAT);
  };

  const handleEndSession = (messages: Message[]) => {
    setSessionMessages(messages);
    setCurrentView(View.ANALYSIS);
  };

  const handleReturnHome = () => {
    setSelectedScenario(null);
    setSessionMessages([]);
    setCurrentView(View.HOME);
  };

  const handleRetry = () => {
    // Reset chat but keep scenario
    setSessionMessages([]);
    setCurrentView(View.CHAT);
  };

  const handleUpdateDescription = (id: string, newDescription: string) => {
    setAllScenarios(prev => prev.map(s => 
      s.id === id ? { ...s, description: newDescription } : s
    ));
  };

  const filteredScenarios = allScenarios.filter(s => 
    filterCategory === 'ALL' || s.category === filterCategory
  );

  return (
    <div className="h-full w-full bg-slate-50 text-slate-900 font-sans">
      {/* View: Home */}
      {currentView === View.HOME && (
        <div className="h-full flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-slate-100 py-6 px-4 md:px-8 flex-shrink-0 z-10">
            <div className="max-w-5xl mx-auto flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  UniSocial
                </h1>
                <p className="text-sm text-slate-500">大学生社交私教</p>
              </div>
              <div className="hidden md:block text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">
                Beta Version
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
              
              {/* Category Filter */}
              <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setFilterCategory('ALL')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterCategory === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                >
                  全部场景
                </button>
                {Object.values(Category).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterCategory === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Learning Objectives Section */}
              <div className="mb-8 bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white rounded-full opacity-40 blur-2xl"></div>
                 <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center relative z-10">
                    <span className="bg-indigo-600 text-white p-1.5 rounded-lg mr-2 shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </span>
                    {filterCategory === 'ALL' ? '综合能力训练目标' : `${filterCategory}能力重点`}
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                   {CATEGORY_OBJECTIVES[filterCategory]?.map((objective, index) => (
                     <div key={index} className="flex items-start relative bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-indigo-50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        {/* Background image */}
                        <div 
                          className="absolute inset-0 opacity-5 bg-cover bg-center"
                          style={{ 
                            backgroundImage: `url('https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=500&h=300&fit=crop')`
                          }}
                        ></div>
                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full text-xs font-bold mr-3 mt-0.5 relative z-10">
                          {index + 1}
                        </span>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed relative z-10">{objective}</p>
                     </div>
                   ))}
                 </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredScenarios.map((scenario) => (
                  <div key={scenario.id} className="h-full">
                    <ScenarioCard 
                      scenario={scenario} 
                      onClick={handleScenarioSelect} 
                      onUpdateDescription={handleUpdateDescription}
                    />
                  </div>
                ))}
              </div>

              {filteredScenarios.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-slate-400">该分类下暂无场景。</p>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* View: Chat */}
      {currentView === View.CHAT && selectedScenario && (
        <ChatInterface 
          scenario={selectedScenario} 
          onEndSession={handleEndSession}
          onBack={handleReturnHome}
        />
      )}

      {/* View: Analysis */}
      {currentView === View.ANALYSIS && selectedScenario && (
        <AnalysisView 
          messages={sessionMessages}
          scenario={selectedScenario}
          onClose={handleReturnHome}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
};

export default App;
