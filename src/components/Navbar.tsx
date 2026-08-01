import React from 'react';
import { 
  Cpu, 
  Bug, 
  FileCode2, 
  TerminalSquare, 
  Sparkles, 
  CheckCircle2, 
  GitBranch 
} from 'lucide-react';

export type ActiveTab = 'diagnostics' | 'editor' | 'continue';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  apiStatus: 'checking' | 'online' | 'offline';
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange, apiStatus }) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'diagnostics',
      label: 'SMRT Router',
      icon: <GitBranch className="w-4 h-4 text-indigo-400" />
    },
    {
      id: 'editor',
      label: 'Pipelines',
      icon: <FileCode2 className="w-4 h-4 text-emerald-400" />
    },
    {
      id: 'continue',
      label: 'Continue',
      icon: <TerminalSquare className="w-4 h-4 text-amber-400" />
    }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
              <GitBranch className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">
                SMRT Router Studio
              </h1>
              <p className="text-xs text-slate-400">
                AI Model Routing &amp; IDE Gateway
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Status Indicator */}
          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${
                apiStatus === 'online'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                  : apiStatus === 'checking'
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                  : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  apiStatus === 'online'
                    ? 'bg-emerald-400 animate-pulse'
                    : apiStatus === 'checking'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              />
              <span>
                {apiStatus === 'online'
                  ? 'Engine Online'
                  : apiStatus === 'checking'
                  ? 'Connecting...'
                  : 'Backend Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center space-x-1 pb-3 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/80 text-slate-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
