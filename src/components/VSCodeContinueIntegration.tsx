import React, { useState } from 'react';
import { RouterValveConfig } from '../types';
import { 
  TerminalSquare, 
  Copy, 
  Check, 
  Download, 
  Sliders,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Zap,
  Globe,
  Key
} from 'lucide-react';

interface VSCodeContinueIntegrationProps {
  config: RouterValveConfig;
}

export const VSCodeContinueIntegration: React.FC<VSCodeContinueIntegrationProps> = ({ config }) => {
  const [gatewayPreset, setGatewayPreset] = useState<'pipelines_ipv4' | 'pipelines_localhost' | 'openwebui_8080' | 'openwebui_3000' | 'custom'>('pipelines_ipv4');
  const [openWebUiUrl, setOpenWebUiUrl] = useState<string>('http://127.0.0.1:9099/v1');
  const [ollamaUrl, setOllamaUrl] = useState<string>('http://127.0.0.1:11434');
  const [apiKey, setApiKey] = useState<string>('00000000');
  const [routerModelId, setRouterModelId] = useState<string>('smrt_router');
  const [taskCoderModel, setTaskCoderModel] = useState<string>(config.codingModel || 'qwen2.5-coder:7b');
  const [autocompleteModel, setAutocompleteModel] = useState<string>(config.autocompleteModel || 'qwen2.5-coder:1.5b');
  const [embeddingModel, setEmbeddingModel] = useState<string>(config.embeddingModel || 'nomic-embed-text');
  const [configFormat, setConfigFormat] = useState<'yaml' | 'json'>('yaml');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);

  const applyPreset = (preset: 'pipelines_ipv4' | 'pipelines_localhost' | 'openwebui_8080' | 'openwebui_3000') => {
    setGatewayPreset(preset);
    if (preset === 'pipelines_ipv4') {
      setOpenWebUiUrl('http://127.0.0.1:9099/v1');
      setOllamaUrl('http://127.0.0.1:11434');
      setApiKey('00000000');
    } else if (preset === 'pipelines_localhost') {
      setOpenWebUiUrl('http://localhost:9099/v1');
      setOllamaUrl('http://localhost:11434');
      setApiKey('00000000');
    } else if (preset === 'openwebui_8080') {
      setOpenWebUiUrl('http://127.0.0.1:8080/api/v1');
      setOllamaUrl('http://127.0.0.1:11434');
      setApiKey('sk-REPLACE_WITH_YOUR_OPEN_WEBUI_KEY');
    } else if (preset === 'openwebui_3000') {
      setOpenWebUiUrl('http://127.0.0.1:3000/api/v1');
      setOllamaUrl('http://127.0.0.1:11434');
      setApiKey('sk-REPLACE_WITH_YOUR_OPEN_WEBUI_KEY');
    }
  };

  // Compute clean base URLs dynamically
  const formatApiBase = (input: string): string => {
    let clean = input.trim().replace(/\/$/, '');
    if (clean.endsWith('/v1')) return clean;
    if (clean.includes(':9099')) return `${clean}/v1`;
    if (clean.includes(':8080') || clean.includes(':3000')) {
      if (!clean.endsWith('/api/v1')) {
        return `${clean.replace(/\/api$/, '')}/api/v1`;
      }
    }
    return clean;
  };

  const gatewayApiBase = formatApiBase(openWebUiUrl);
  const cleanOllama = ollamaUrl.trim().replace(/\/$/, '');

  // Generate Modern VSCode Continue config.yaml (v1 Schema)
  const continueConfigYaml = `name: "Local AI Development Stack"
version: "1.0.0"
schema: v1

models:
  # Primary Unified Router Agent via Pipelines Gateway
  - name: "SMRT Router"
    provider: "openai"
    model: "${routerModelId}"
    apiBase: "${gatewayApiBase}"
    apiKey: "${apiKey}"
    useResponsesApi: false
    contextLength: 16384
    requestOptions:
      num_ctx: 16384
    roles:
      - chat
      - edit
      - apply
      - summarize

  # Direct Ollama Coder for localized task execution
  - name: "Qwen Coder (Task Agent)"
    provider: "ollama"
    model: "${taskCoderModel}"
    apiBase: "${cleanOllama}"
    contextLength: 16384
    requestOptions:
      num_ctx: 16384
    roles:
      - chat
      - edit

  # Ultra-fast Local Autocomplete
  - name: "Qwen Autocomplete (Fast)"
    provider: "ollama"
    model: "${autocompleteModel}"
    apiBase: "${cleanOllama}"
    roles:
      - autocomplete
    requestOptions:
      num_ctx: 2048

  # High-performance Local Vector Embeddings
  - name: "Nomic Embed Text"
    provider: "ollama"
    model: "${embeddingModel}"
    apiBase: "${cleanOllama}"
    roles:
      - embed

context:
  - provider: file
  - provider: currentFile
  - provider: repo-map
  - provider: tree
  - provider: terminal
  - provider: diff
  - provider: problems

mcpServers:
  - name: context7
    command: npx
    args:
      - -y
      - "@upstash/context7-mcp"`;

  // Generate Legacy VSCode Continue config.json
  const continueConfigJson = JSON.stringify(
    {
      name: "Local AI Development Stack",
      version: "1.0.0",
      schema: "v1",
      models: [
        {
          name: "SMRT Router",
          provider: "openai",
          model: routerModelId,
          apiBase: gatewayApiBase,
          apiKey: apiKey,
          useResponsesApi: false,
          contextLength: 16384,
          requestOptions: {
            num_ctx: 16384
          },
          roles: ["chat", "edit", "apply", "summarize"]
        },
        {
          name: "Qwen Coder (Task Agent)",
          provider: "ollama",
          model: taskCoderModel,
          apiBase: cleanOllama,
          contextLength: 16384,
          requestOptions: {
            num_ctx: 16384
          },
          roles: ["chat", "edit"]
        },
        {
          name: "Qwen Autocomplete (Fast)",
          provider: "ollama",
          model: autocompleteModel,
          apiBase: cleanOllama,
          roles: ["autocomplete"],
          requestOptions: {
            num_ctx: 2048
          }
        },
        {
          name: "Nomic Embed Text",
          provider: "ollama",
          model: embeddingModel,
          apiBase: cleanOllama,
          roles: ["embed"]
        }
      ],
      tabAutocompleteModel: {
        title: "Qwen Autocomplete (Fast)",
        provider: "ollama",
        model: autocompleteModel,
        apiBase: cleanOllama
      },
      context: [
        { provider: "file" },
        { provider: "currentFile" },
        { provider: "repo-map" },
        { provider: "tree" },
        { provider: "terminal" },
        { provider: "diff" },
        { provider: "problems" }
      ]
    },
    null,
    2
  );

  const testCurlCommand = `curl -X POST "${gatewayApiBase}/chat/completions" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"model": "${routerModelId}", "messages": [{"role": "user", "content": "hello SMRT router"}]}'`;

  const activeContent = configFormat === 'yaml' ? continueConfigYaml : continueConfigJson;
  const fileName = configFormat === 'yaml' ? 'config.yaml' : 'config.json';

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(testCurlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleDownload = () => {
    const mimeType = configFormat === 'yaml' ? 'text/yaml' : 'application/json';
    const blob = new Blob([activeContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          VSCode Continue Integration
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Configure VSCode Continue extension to route IDE queries through SMRT Router.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Connection & Model Settings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
            <div className="flex items-center space-x-2 pb-4 border-b border-slate-800">
              <Sliders className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Gateway Configuration
              </h3>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider">
                Gateway Target Preset
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('pipelines_ipv4')}
                  className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                    gatewayPreset === 'pipelines_ipv4'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-bold text-amber-300">Pipelines (127.0.0.1)</div>
                  <div className="text-[10px] opacity-80 font-mono">http://127.0.0.1:9099/v1</div>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('pipelines_localhost')}
                  className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                    gatewayPreset === 'pipelines_localhost'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-bold text-amber-300">Pipelines (localhost)</div>
                  <div className="text-[10px] opacity-80 font-mono">http://localhost:9099/v1</div>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('openwebui_8080')}
                  className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                    gatewayPreset === 'openwebui_8080'
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-bold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-bold text-indigo-300">Open WebUI (:8080)</div>
                  <div className="text-[10px] opacity-80 font-mono">...:8080/api/v1</div>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('openwebui_3000')}
                  className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                    gatewayPreset === 'openwebui_3000'
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-bold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-bold text-sky-300">Open WebUI (:3000)</div>
                  <div className="text-[10px] opacity-80 font-mono">...:3000/api/v1</div>
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Gateway Base URL</span>
                  <span className="text-[10px] font-mono text-amber-400">apiBase</span>
                </label>
                <input
                  type="text"
                  value={openWebUiUrl}
                  onChange={(e) => {
                    setOpenWebUiUrl(e.target.value);
                    setGatewayPreset('custom');
                  }}
                  placeholder="http://127.0.0.1:9099"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>API Key</span>
                  <span className="text-[10px] font-mono text-slate-400">apiKey</span>
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="00000000 or sk-..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Target Router Model ID</span>
                  <span className="text-[10px] font-mono text-slate-400">model</span>
                </label>
                <input
                  type="text"
                  value={routerModelId}
                  onChange={(e) => setRouterModelId(e.target.value)}
                  placeholder="smrt_router"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Ollama Base URL
                </label>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://127.0.0.1:11434"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider">
                  Model Mapping
                </label>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Task Coder:</label>
                  <input
                    type="text"
                    value={taskCoderModel}
                    onChange={(e) => setTaskCoderModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-emerald-400 mb-1">Autocomplete:</label>
                  <input
                    type="text"
                    value={autocompleteModel}
                    onChange={(e) => setAutocompleteModel(e.target.value)}
                    className="w-full bg-slate-950 border border-emerald-900/40 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-sky-400 mb-1">Embeddings:</label>
                  <input
                    type="text"
                    value={embeddingModel}
                    onChange={(e) => setEmbeddingModel(e.target.value)}
                    className="w-full bg-slate-950 border border-sky-900/40 rounded-xl px-3 py-1.5 text-xs text-sky-300 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider block">Target Path:</span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-amber-300">
                ~/.continue/{fileName}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Clean File Preview & Actions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/30">
                <TerminalSquare className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  ~/.continue/{fileName}
                </h3>
                <p className="text-xs text-slate-400">
                  VSCode Continue Extension Settings
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
                <button
                  type="button"
                  onClick={() => setConfigFormat('yaml')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    configFormat === 'yaml'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  YAML (v1)
                </button>
                <button
                  type="button"
                  onClick={() => setConfigFormat('json')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    configFormat === 'json'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  JSON
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow transition"
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

          {/* Code Box */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-300">
                {fileName}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {configFormat === 'yaml' ? 'YAML v1' : 'JSON'}
              </span>
            </div>

            <pre className="p-6 text-xs sm:text-sm font-mono text-slate-200 overflow-x-auto max-h-[520px] leading-relaxed">
              <code>{activeContent}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Continue "Connection Error" Root Cause & Fix Guide */}
      <div className="bg-slate-900/90 rounded-2xl border border-amber-900/40 p-6 shadow-xl space-y-5">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <h3 className="text-base font-bold text-white">
            Fixing Continue "Connection Error" (WSL / Docker &amp; Port Troubleshooting)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-amber-300 flex items-center space-x-1.5">
              <Globe className="w-4 h-4" />
              <span>1. WSL IPv6 `127.0.0.1` vs `localhost`</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Node.js 18+ inside VSCode WSL resolves <code className="text-amber-300">localhost</code> to IPv6 <code className="text-amber-300">::1</code>. If Docker listens on IPv4, Continue fails with <code className="text-rose-300">Connection error</code>.
            </p>
            <div className="text-[11px] font-semibold text-emerald-400">
              Fix: Use <code className="bg-slate-900 px-1 py-0.5 rounded">http://127.0.0.1:9099/v1</code> in config.yaml.
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-indigo-300 flex items-center space-x-1.5">
              <Key className="w-4 h-4" />
              <span>2. API Key Authentication</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              When hitting Open WebUI directly (<code className="text-indigo-300">port 8080</code>), Open WebUI requires a real key from <strong className="text-white">Settings &gt; Account &gt; API Keys</strong>.
            </p>
            <div className="text-[11px] font-semibold text-indigo-400">
              Fix: Generate API key in Open WebUI or use Pipelines port <code className="bg-slate-900 px-1 py-0.5 rounded">9099</code> with key <code className="bg-slate-900 px-1 py-0.5 rounded">00000000</code>.
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-emerald-300 flex items-center space-x-1.5">
              <Zap className="w-4 h-4" />
              <span>3. Model ID Registration</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Continue specifies <code className="text-emerald-300">model: "smrt_router"</code>. The SMRT Router manifold registers both <code className="text-emerald-300">smrt_router</code> and <code className="text-emerald-300">smrt_router-auto</code>.
            </p>
            <div className="text-[11px] font-semibold text-emerald-400">
              Fix: Ensure your pipeline file is active in Open WebUI Pipelines.
            </div>
          </div>
        </div>

        {/* Curl Verification Command */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Terminal Test (Run in WSL / Terminal to verify gateway connection):</span>
            <button
              onClick={handleCopyCurl}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
            >
              {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCurl ? 'Copied' : 'Copy Test Command'}</span>
            </button>
          </div>
          <pre className="text-xs font-mono text-amber-300 bg-slate-900 p-3 rounded-lg border border-slate-800 overflow-x-auto">
            <code>{testCurlCommand}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
