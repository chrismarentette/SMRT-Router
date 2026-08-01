import React, { useState } from 'react';
import { BUG_DIAGNOSTICS, ORIGINAL_SMART_ROUTER_CODE } from '../data/originalScript';
import { 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileCode, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Copy, 
  Check,
  History,
  GitCommit,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface VersionRelease {
  version: string;
  date: string;
  title: string;
  badge: string;
  changes: string[];
}

const VERSION_HISTORY: VersionRelease[] = [
  {
    version: 'v1.3.0',
    date: 'Current Release',
    title: 'Container Network Gateway & Autocomplete Support',
    badge: 'Latest',
    changes: [
      'Added auto-resolving multi-endpoint network gateway (host.docker.internal:11434, env vars, localhost) to fix Docker container connection failures.',
      'Prevented /app/pipelines subfolder crashes in Open WebUI Docker containers caused by internal module scanners.',
      'Added sub-100ms inline completion model (qwen2.5-coder:1.5b) and local text embeddings (nomic-embed-text) into Continue configuration schema.'
    ]
  },
  {
    version: 'v1.2.0',
    date: 'Previous Build',
    title: 'Pydantic v2 & Container Boot Loop Fixes',
    badge: 'Stable',
    changes: [
      'Fixed UserValves attribute access exceptions across Pydantic v1 and v2 environments.',
      'Moved SQLite persistent database path out of /app/pipelines into /tmp/smrt_router.db to prevent container boot loop crashes.',
      'Added safe fallback error handling when upstream models are offline or unpulled.'
    ]
  },
  {
    version: 'v1.1.0',
    date: 'Initial Refactor',
    title: 'Open WebUI GUI Function & Safe Fallback Engine',
    badge: 'Core',
    changes: [
      'Added dual export support: Open WebUI GUI Function (.json) and Docker Pipelines (.py).',
      'Implemented Homer Simpson safe fallback notice ("I am so smart! S-M-R-T!") for unpulled models.',
      'Resolved Manifold registration (pipes()) and fixed display name stuttering (SMRT Router).'
    ]
  },
  {
    version: 'v1.0.0',
    date: 'Legacy',
    title: 'Initial Smart Router Concept',
    badge: 'Base',
    changes: [
      'Base keyword prompt classification engine for REASONING_PLANNING, TASK_AGENT_CODING, and GENERAL_FAST tiers.'
    ]
  }
];

export const DiagnosticReport: React.FC = () => {
  const [selectedSeverity, setSelectedSeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [expandedBugId, setExpandedBugId] = useState<string>('bug-1-pydantic-import');
  const [showOriginalFullCode, setShowOriginalFullCode] = useState<boolean>(false);
  const [copiedOriginal, setCopiedOriginal] = useState<boolean>(false);

  const filteredBugs = BUG_DIAGNOSTICS.filter(
    (bug) => selectedSeverity === 'ALL' || bug.severity === selectedSeverity
  );

  const handleCopyOriginal = () => {
    navigator.clipboard.writeText(ORIGINAL_SMART_ROUTER_CODE);
    setCopiedOriginal(true);
    setTimeout(() => setCopiedOriginal(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            SMRT Router Diagnostics &amp; Version History
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Changelog history and technical fixes for Open WebUI &amp; Docker container environments.
          </p>
        </div>

        <button
          onClick={() => setShowOriginalFullCode(!showOriginalFullCode)}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition shrink-0"
        >
          <FileCode className="w-4 h-4 text-slate-400" />
          <span>{showOriginalFullCode ? 'Hide Original Script' : 'View Original smart_router.py'}</span>
        </button>
      </div>

      {/* Single Consolidated Version & Change History Bubble */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
              <History className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Version &amp; Change History</h3>
              <p className="text-xs text-slate-400">Consolidated release changelog (most recent first)</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            v1.3.0 Active
          </span>
        </div>

        <div className="space-y-4">
          {VERSION_HISTORY.map((item, idx) => (
            <div key={item.version} className="relative pl-6 border-l-2 border-slate-800 space-y-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-white">{item.version}</span>
                  <span className="text-xs font-semibold text-slate-300">— {item.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {item.badge}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{item.date}</span>
                </div>
              </div>

              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                {item.changes.map((change, cIdx) => (
                  <li key={cIdx} className="leading-relaxed">{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Full Original Code Panel (when toggled) */}
      {showOriginalFullCode && (
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-rose-400" />
              <span>Original smart_router.py Reference Code</span>
            </h3>
            <button
              onClick={handleCopyOriginal}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              {copiedOriginal ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedOriginal ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="text-xs text-slate-300 font-mono overflow-x-auto p-4 bg-slate-900/60 rounded-xl border border-slate-800 max-h-80">
            <code>{ORIGINAL_SMART_ROUTER_CODE}</code>
          </pre>
        </div>
      )}

      {/* Bug Diagnostic Log Header & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span>Technical Defect Log ({filteredBugs.length} Items)</span>
          </h3>

          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-2">Severity:</span>
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedSeverity === sev
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Bug Breakdown Cards */}
        <div className="space-y-3">
          {filteredBugs.map((bug) => {
            const isExpanded = expandedBugId === bug.id;
            return (
              <div
                key={bug.id}
                className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden transition"
              >
                <button
                  onClick={() => setExpandedBugId(isExpanded ? '' : bug.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        bug.severity === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                          : bug.severity === 'HIGH'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                          : 'bg-sky-950 text-sky-300 border border-sky-800/80'
                      }`}
                    >
                      {bug.severity}
                    </span>
                    <h4 className="text-sm font-bold text-white">{bug.title}</h4>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <span>{isExpanded ? 'Hide' : 'Details'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 pt-0 space-y-4 border-t border-slate-800/80 bg-slate-950/40 text-xs">
                    <p className="text-slate-300 leading-relaxed mt-3">{bug.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-slate-950 rounded-lg border border-rose-900/30 p-3">
                        <div className="text-[11px] font-bold text-rose-400 mb-1">Issue</div>
                        <pre className="font-mono text-rose-200/80 overflow-x-auto">
                          <code>{bug.originalCodeSnippet}</code>
                        </pre>
                      </div>

                      <div className="bg-slate-950 rounded-lg border border-emerald-900/30 p-3">
                        <div className="text-[11px] font-bold text-emerald-400 mb-1">Resolution</div>
                        <pre className="font-mono text-emerald-200/90 overflow-x-auto">
                          <code>{bug.fixedCodeSnippet}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
