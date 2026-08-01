import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DiagnosticReport } from './components/DiagnosticReport';
import { RefactoredEditor } from './components/RefactoredEditor';
import { LiveRouterPlayground } from './components/LiveRouterPlayground';
import { VSCodeContinueIntegration } from './components/VSCodeContinueIntegration';
import { RouterValveConfig } from './types';
import { 
  Sparkles, 
  Bug, 
  FileCode2, 
  PlaySquare, 
  TerminalSquare, 
  CheckCircle2, 
  Cpu, 
  ExternalLink 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('diagnostics');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [config, setConfig] = useState<RouterValveConfig>({
    ollamaBaseUrl: "http://localhost:11434",
    openAiBaseUrl: "http://localhost:8080/api/v1",
    openAiApiKey: "sk-open-webui-api-key",
    reasoningModel: "qwen3:8b",
    codingModel: "qwen2.5-coder:7b",
    generalModel: "llama3.1:8b",
    autocompleteModel: "qwen2.5-coder:1.5b",
    embeddingModel: "nomic-embed-text",
    enablePersistence: true,
    persistenceMode: 'sqlite',
    maxTurns: 20,
    enableSemanticFallback: true,
    reasoningKeywords: ["architect", "refactor", "deep", "complex", "plan", "analyze", "system design"],
    codingKeywords: ["code", "def", "function", "class", "sql", "typescript", "react", "test", "fix"],
    generalKeywords: ["hello", "what", "explain", "why"]
  });

  useEffect(() => {
    let isMounted = true;
    const checkBackendHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok && isMounted) {
          setApiStatus('online');
        } else if (isMounted) {
          setApiStatus('offline');
        }
      } catch {
        if (isMounted) {
          setApiStatus('offline');
        }
      }
    };

    checkBackendHealth();
    const timer = setInterval(checkBackendHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Sticky Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        apiStatus={apiStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Render Tab Component */}
        {activeTab === 'diagnostics' && <DiagnosticReport />}
        {activeTab === 'editor' && (
          <RefactoredEditor config={config} onConfigChange={setConfig} />
        )}
        {activeTab === 'playground' && <LiveRouterPlayground config={config} />}
        {activeTab === 'continue' && <VSCodeContinueIntegration config={config} />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>SMRT Router Engine v1.3.0 &bull; Open WebUI &amp; VSCode Continue Ready</span>
            </div>
            <div className="flex items-center space-x-4 text-slate-500">
              <span>Open WebUI v0.5+</span>
              <span>&bull;</span>
              <span>VSCode Continue v1.0+</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
