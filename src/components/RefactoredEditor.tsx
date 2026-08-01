import React, { useState } from 'react';
import { 
  getRefactoredSmartRouterCode, 
  getDockerPipelineScript, 
  getOpenWebUIFunctionJson 
} from '../data/refactoredScript';
import { RouterValveConfig, OpenWebUIDeploymentTarget } from '../types';
import { 
  Copy, 
  Check, 
  Download, 
  Sliders, 
  Code2, 
  FileJson,
  Server,
  Terminal,
  Layers
} from 'lucide-react';

interface RefactoredEditorProps {
  config: RouterValveConfig;
  onConfigChange: (newConfig: RouterValveConfig) => void;
}

export const RefactoredEditor: React.FC<RefactoredEditorProps> = ({ config, onConfigChange }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [targetMode, setTargetMode] = useState<OpenWebUIDeploymentTarget>('DOCKER_PIPELINES_CONTAINER');

  const getActiveCode = () => {
    if (targetMode === 'OPEN_WEBUI_FUNCTION_JSON') {
      return getOpenWebUIFunctionJson(config);
    }
    if (targetMode === 'DOCKER_PIPELINES_CONTAINER') {
      return getDockerPipelineScript(config);
    }
    return getRefactoredSmartRouterCode(config);
  };

  const code = getActiveCode();

  const getFilename = () => {
    if (targetMode === 'OPEN_WEBUI_FUNCTION_JSON') return 'smrt_router_function.json';
    if (targetMode === 'DOCKER_PIPELINES_CONTAINER') return 'smrt_router_pipeline.py';
    return 'smrt_router.py';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const isJson = targetMode === 'OPEN_WEBUI_FUNCTION_JSON';
    const filename = getFilename();
    const mimeType = isJson ? 'application/json' : 'text/x-python';
    const blob = new Blob([code], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateField = (key: keyof RouterValveConfig, val: any) => {
    onConfigChange({
      ...config,
      [key]: val
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16">
      {/* Left Column: Valve Configuration Panel */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-800">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Pipeline Valve Settings
            </h3>
          </div>

          <div className="space-y-4">
            {/* Ollama Base URL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Ollama Engine Host URL
                </label>
                <span className="text-[10px] font-mono text-emerald-400">Port 11434</span>
              </div>
              <input
                type="text"
                value={config.ollamaBaseUrl}
                onChange={(e) => updateField('ollamaBaseUrl', e.target.value)}
                placeholder="http://host.docker.internal:11434"
                className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none font-mono transition ${
                  config.ollamaBaseUrl.includes('9099')
                    ? 'border-rose-500 focus:border-rose-400 text-rose-200'
                    : 'border-slate-800 focus:border-indigo-500'
                }`}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Where Ollama is running (<code className="text-slate-300">http://host.docker.internal:11434</code> inside Docker/Pipelines).
              </p>

              {config.ollamaBaseUrl.includes('9099') && (
                <div className="mt-2.5 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <span>⚠️ Warning: Self-Recursion Loop Detected</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Port <code className="bg-rose-900/60 px-1 py-0.5 rounded text-white">9099</code> is the Pipelines Gateway container itself, NOT Ollama. Setting Ollama URL to port 9099 causes an infinite recursive loop.
                  </p>
                  <p className="text-[11px] font-semibold text-amber-300">
                    Fix: Change this field to <code className="underline">http://host.docker.internal:11434</code> or <code className="underline">http://127.0.0.1:11434</code>.
                  </p>
                </div>
              )}
            </div>

            {/* Tier 1: Reasoning Model */}
            <div>
              <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">
                Tier 1: Reasoning &amp; Planning
              </label>
              <input
                type="text"
                value={config.reasoningModel}
                onChange={(e) => updateField('reasoningModel', e.target.value)}
                placeholder="qwen3:8b"
                className="w-full bg-slate-950 border border-indigo-900/50 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono transition"
              />
            </div>

            {/* Tier 2: Coding Model */}
            <div>
              <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">
                Tier 2: Code &amp; Refactoring
              </label>
              <input
                type="text"
                value={config.codingModel}
                onChange={(e) => updateField('codingModel', e.target.value)}
                placeholder="qwen2.5-coder:7b"
                className="w-full bg-slate-950 border border-emerald-900/50 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono transition"
              />
            </div>

            {/* Tier 3: General Model */}
            <div>
              <label className="block text-xs font-semibold text-sky-300 uppercase tracking-wider mb-1">
                Tier 3: General Fast QA
              </label>
              <input
                type="text"
                value={config.generalModel}
                onChange={(e) => updateField('generalModel', e.target.value)}
                placeholder="llama3.1:8b"
                className="w-full bg-slate-950 border border-sky-900/50 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono transition"
              />
            </div>

            {/* Fast Autocomplete Model */}
            <div>
              <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1">
                IDE Inline Autocomplete Model
              </label>
              <input
                type="text"
                value={config.autocompleteModel || 'qwen2.5-coder:1.5b'}
                onChange={(e) => updateField('autocompleteModel', e.target.value)}
                placeholder="qwen2.5-coder:1.5b"
                className="w-full bg-slate-950 border border-amber-900/50 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono transition"
              />
            </div>

            {/* Embeddings Model */}
            <div>
              <label className="block text-xs font-semibold text-teal-300 uppercase tracking-wider mb-1">
                Vector Embeddings Model
              </label>
              <input
                type="text"
                value={config.embeddingModel || 'nomic-embed-text'}
                onChange={(e) => updateField('embeddingModel', e.target.value)}
                placeholder="nomic-embed-text"
                className="w-full bg-slate-950 border border-teal-900/50 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-teal-500 font-mono transition"
              />
            </div>

            {/* SQLite Persistence Toggle */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div>
                <span className="block text-xs font-semibold text-white">
                  SQLite Audit Persistence
                </span>
                <span className="block text-[11px] text-slate-400">
                  Logs routing latency &amp; tiers
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateField('enablePersistence', !config.enablePersistence)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.enablePersistence ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    config.enablePersistence ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Manifold Discovery Summary */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3">
          <div className="flex items-center space-x-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Exposed Manifold Endpoints</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
            <li className="text-indigo-300">&bull; smrt-router-auto</li>
            <li className="text-slate-400">&bull; smrt-router-reasoning</li>
            <li className="text-slate-400">&bull; smrt-router-coding</li>
            <li className="text-slate-400">&bull; smrt-router-general</li>
          </ul>
        </div>
      </div>

      {/* Right Column: Code Viewer & Target Toggle */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        {/* Simplified Header Bar: Target Mode Toggle + Actions */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          {/* Target Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setTargetMode('DOCKER_PIPELINES_CONTAINER')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                targetMode === 'DOCKER_PIPELINES_CONTAINER'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>Docker Pipeline (.py)</span>
            </button>

            <button
              onClick={() => setTargetMode('OPEN_WEBUI_FUNCTION_JSON')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                targetMode === 'OPEN_WEBUI_FUNCTION_JSON'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>GUI Function (.json)</span>
            </button>

            <button
              onClick={() => setTargetMode('STANDALONE_PYTHON')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                targetMode === 'STANDALONE_PYTHON'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Standalone Script (.py)</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Code Preview Box */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex-1 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <span className="text-xs font-mono text-slate-300 font-semibold">{getFilename()}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {targetMode === 'OPEN_WEBUI_FUNCTION_JSON' ? 'JSON Format' : 'Python 3.10+'}
            </span>
          </div>

          <pre className="p-6 text-xs sm:text-sm font-mono text-slate-200 overflow-x-auto max-h-[640px] leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
