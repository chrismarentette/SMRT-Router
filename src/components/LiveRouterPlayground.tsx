import React, { useState } from 'react';
import { PRESET_PROMPTS } from '../data/presets';
import { RouterAnalysisResult, RouterValveConfig, RouterTier } from '../types';
import { 
  Play, 
  Sparkles, 
  Brain, 
  Code, 
  MessageSquare, 
  CheckCircle2, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Terminal, 
  Zap, 
  Send,
  HelpCircle,
  FileText
} from 'lucide-react';

interface LiveRouterPlaygroundProps {
  config: RouterValveConfig;
}

export const LiveRouterPlayground: React.FC<LiveRouterPlaygroundProps> = ({ config }) => {
  const [prompt, setPrompt] = useState<string>(
    PRESET_PROMPTS[0].prompt
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<RouterAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showThinking, setShowThinking] = useState<boolean>(true);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');

  const filteredPresets = PRESET_PROMPTS.filter(
    (p) => activeCategoryFilter === 'ALL' || p.category === activeCategoryFilter
  );

  const handleTestRoute = async (customPrompt?: string) => {
    const textToAnalyze = customPrompt || prompt;
    if (!textToAnalyze.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/router/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: textToAnalyze,
          config
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${res.status})`);
      }

      const data: RouterAnalysisResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to execute SMRT Router test.');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: RouterTier) => {
    switch (tier) {
      case 'REASONING_PLANNING':
        return {
          bg: 'bg-indigo-500/10',
          text: 'text-indigo-400',
          border: 'border-indigo-500/30',
          icon: <Brain className="w-5 h-5 text-indigo-400" />
        };
      case 'TASK_AGENT_CODING':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30',
          icon: <Code className="w-5 h-5 text-emerald-400" />
        };
      case 'GENERAL_FAST':
        return {
          bg: 'bg-sky-500/10',
          text: 'text-sky-400',
          border: 'border-sky-500/30',
          icon: <MessageSquare className="w-5 h-5 text-sky-400" />
        };
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Live SMRT Router Test
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Test prompt routing decisions between Reasoning, Coding, and Fast QA tiers.
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          Reasoning: <span className="text-indigo-400 font-bold">{config.reasoningModel}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Preset Selector & Prompt Input */}
        <div className="lg:col-span-5 space-y-6">
          {/* Preset Prompts Panel */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Test Presets</span>
              </h3>

              <div className="flex items-center space-x-1">
                {(['ALL', 'REASONING_PLANNING', 'TASK_AGENT_CODING', 'GENERAL_FAST'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition ${
                      activeCategoryFilter === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat === 'ALL'
                      ? 'All'
                      : cat === 'REASONING_PLANNING'
                      ? 'Reasoning'
                      : cat === 'TASK_AGENT_CODING'
                      ? 'Coding'
                      : 'General'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {filteredPresets.map((preset) => {
                const tierCol = getTierColor(preset.category);
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setPrompt(preset.prompt);
                      handleTestRoute(preset.prompt);
                    }}
                    className="w-full text-left p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 transition group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                        {preset.title}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${tierCol.bg} ${tierCol.text} ${tierCol.border}`}
                      >
                        {preset.category === 'REASONING_PLANNING'
                          ? 'Reasoning'
                          : preset.category === 'TASK_AGENT_CODING'
                          ? 'Coding'
                          : 'General'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Prompt Textarea Box */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
            <label className="block text-sm font-bold text-white tracking-tight">
              Test Custom Prompt or IDE Completion
            </label>
            <textarea
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt to test how the SMRT Router classifies and routes it..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono leading-relaxed transition"
            />

            <button
              onClick={() => handleTestRoute()}
              disabled={loading || !prompt.trim()}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing with Gemini 3.1 Pro (High Thinking)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Test Route & Reason</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Router Reasoning Trace & Output */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="bg-rose-950/40 border border-rose-800 rounded-2xl p-4 text-rose-300 text-sm flex items-center space-x-3">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {!result && !loading && (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                <Brain className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Routing Decision Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Select a preset on the left or enter a custom prompt and click <strong className="text-slate-300">Test Route & Reason</strong> to see Gemini 3.1 Pro High Thinking in action.
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-12 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Gemini 3.1 Pro High Thinking...</h3>
                <p className="text-xs text-slate-400">
                  Evaluating architectural complexity, syntax patterns, and Open WebUI pipeline rules...
                </p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {/* Routing Choice Hero Card */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                      {getTierColor(result.selectedTier).icon}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        Routed Tier
                      </div>
                      <h3 className={`text-lg font-extrabold ${getTierColor(result.selectedTier).text}`}>
                        {result.selectedTier === 'REASONING_PLANNING'
                          ? 'Tier 1: High-Level Reasoning & Planning'
                          : result.selectedTier === 'TASK_AGENT_CODING'
                          ? 'Tier 2: Task Agent Coding & IDE'
                          : 'Tier 3: General Fast QA'}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
                      <div className="text-[10px] text-slate-400 uppercase">Target Model</div>
                      <div className="text-sm font-bold text-white font-mono">{result.selectedModel}</div>
                    </div>
                    <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
                      <div className="text-[10px] text-slate-400 uppercase">Confidence</div>
                      <div className="text-sm font-bold text-emerald-400">
                        {Math.round(result.confidenceScore * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Routing Explanation Badge */}
                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Open WebUI Routing Badge Reason
                  </div>
                  <p className="text-sm font-medium text-slate-200">
                    {result.routingReasoning}
                  </p>
                </div>

                {/* Matched Keywords & Complexity */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-400">Trigger Signals:</span>
                    {result.matchedKeywords && result.matchedKeywords.length > 0 ? (
                      result.matchedKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-xs font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                        >
                          {kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">No keyword rules matched (semantic fallback)</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400">Complexity:</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                        result.architecturalComplexity === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300'
                          : result.architecturalComplexity === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {result.architecturalComplexity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gemini 3.1 Pro High Thinking Chain Box */}
              <div className="bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-900 rounded-2xl border border-indigo-900/40 overflow-hidden">
                <button
                  onClick={() => setShowThinking(!showThinking)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left bg-indigo-950/20 border-b border-indigo-900/30 hover:bg-indigo-950/30 transition"
                >
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Gemini 3.1 Pro High Thinking Chain
                      </h4>
                      <p className="text-xs text-indigo-300/80">
                        Deep architectural & semantic analysis of prompt intent
                      </p>
                    </div>
                  </div>
                  {showThinking ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {showThinking && (
                  <div className="p-6 text-sm text-slate-300 leading-relaxed font-mono whitespace-pre-wrap bg-slate-950/50">
                    {result.thinkingProcess}
                  </div>
                )}
              </div>

              {/* Simulated Model Response Box */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Simulated Execution Output ({result.selectedModel})
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Open WebUI Streamed Response
                  </span>
                </div>
                <div className="p-6 text-sm text-slate-200 font-mono whitespace-pre-wrap leading-relaxed bg-slate-950/80 overflow-x-auto max-h-96">
                  {result.simulatedResponse}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
