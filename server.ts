import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', engine: 'SMRT Router Studio Engine' });
});

// Deterministic Local Router Classification Engine (Mirrors smrt_router.py exactly)
function runDeterministicRouterEngine(prompt: string, reasoningModel: string, codingModel: string, generalModel: string) {
  const lower = prompt.toLowerCase().trim();
  
  // Tier 0: Hypervisor short suggestions / greetings
  const shortGreetings = ["hi", "hello", "hey", "help", "test", "who are you", "what can you do", "status", "suggest"];
  if (prompt.trim().length < 15 || shortGreetings.includes(lower)) {
    return {
      selectedTier: "GENERAL_FAST",
      selectedModel: generalModel,
      confidenceScore: 0.99,
      thinkingProcess: "Identified short conversational greeting or hypervisor prompt suggestion. Routing to Tier 3 General Fast model for instant zero-latency response.",
      routingReasoning: "Instant routing for short prompt/hypervisor suggestion",
      matchedKeywords: [prompt.trim().toLowerCase()],
      architecturalComplexity: "LOW",
      simulatedResponse: "Hello! I am SMRT Router (Homer Simpson Edition — 'I am so smart! S-M-R-T!'). I automatically evaluate your prompt complexity and route it to your optimal Reasoning, Task Coding, or General QA model. How can I assist you today?"
    };
  }

  // Tier 1: High-level Reasoning / Architecture / Planning / Tradeoffs
  const reasoningKeywords = [
    "architect", "refactor", "deep", "complex", "plan", "analyze",
    "system design", "compare", "evaluate", "tradeoffs", "why", "strategy", "migration", "rate limiter"
  ];
  const matchedReasoning = reasoningKeywords.filter(kw => lower.includes(kw));
  if (matchedReasoning.length > 0 || prompt.length > 800) {
    return {
      selectedTier: "REASONING_PLANNING",
      selectedModel: reasoningModel,
      confidenceScore: 0.96,
      thinkingProcess: `Detected high-level architectural keywords (${matchedReasoning.join(", ")}) or deep structural complexity. Evaluating system boundaries, fault tolerance, and multi-region synchronization tradeoffs before synthesizing solution.`,
      routingReasoning: "Detected high-level architectural or reasoning keywords",
      matchedKeywords: matchedReasoning,
      architecturalComplexity: "HIGH",
      simulatedResponse: `### High-Level Architectural Plan & Analysis\n\n**1. System Boundary Analysis:**\nTo address this architectural challenge, we decouple the control plane from the data ingestion pipeline using an event-driven ledger.\n\n**2. Core Tradeoffs & Strategy:**\n- *Consistency vs. Latency:* Applying optimistic concurrency control at the edge minimizes round-trip latency while preserving auditability.\n- *Fault Tolerance:* Automated fallback circuits ensure zero downtime during upstream degradation.\n\n**3. Recommended Execution Blueprint:**\nWe proceed by isolating the domain models and introducing structured contract testing across services.`
    };
  }

  // Tier 2: Task Agent Coding / IDE Syntax / Bug fixing
  const codingKeywords = [
    "code", "def ", "function", "class ", "import ", "const ", "let ",
    "bug", "error", "exception", "traceback", "sql", "html", "css",
    "typescript", "react", "python", "test", "unit test", "fix", "continue", "hook", "debounce"
  ];
  const matchedCoding = codingKeywords.filter(kw => lower.includes(kw));
  if (matchedCoding.length > 0 || prompt.includes("```")) {
    return {
      selectedTier: "TASK_AGENT_CODING",
      selectedModel: codingModel,
      confidenceScore: 0.95,
      thinkingProcess: `Identified programmatic syntax, code keywords (${matchedCoding.join(", ")}), or IDE command request. Assigning directly to dedicated Task Agent Coding model (${codingModel}) for deterministic code generation.`,
      routingReasoning: "Detected programmatic syntax or coding keywords",
      matchedKeywords: matchedCoding,
      architecturalComplexity: "MEDIUM",
      simulatedResponse: `\`\`\`typescript\n// SMRT Router Task Agent Solution\nimport { useState, useEffect } from 'react';\n\nexport function useDebouncedSearch<T>(value: T, delay: number = 300): T {\n  const [debouncedValue, setDebouncedValue] = useState<T>(value);\n\n  useEffect(() => {\n    const handler = setTimeout(() => {\n      setDebouncedValue(value);\n    }, delay);\n\n    return () => {\n      clearTimeout(handler);\n    };\n  }, [value, delay]);\n\n  return debouncedValue;\n}\n\`\`\`\n\n**Summary of Implementation:**\n- Implements a generic TypeScript hook with proper cleanup and debounce timing.\n- Safe for high-frequency input handlers and API search triggers.`
    };
  }

  // Tier 3: Default General Conversational QA
  return {
    selectedTier: "GENERAL_FAST",
    selectedModel: generalModel,
    confidenceScore: 0.91,
    thinkingProcess: "Prompt does not require deep architectural planning or specialized code synthesis. Assigning to fast general conversational model for immediate execution.",
    routingReasoning: "Default fast general QA routing",
    matchedKeywords: ["general_qa"],
    architecturalComplexity: "LOW",
    simulatedResponse: "Based on your request, here is a concise and direct explanation: The Open WebUI SMRT Router evaluates your prompts on-the-fly using keyword heuristics and turn budgets, directing conversational queries to your fast local models while reserving heavy reasoning models for structural architecture."
  };
}

/**
 * POST /api/router/analyze
 * Pure 100% Deterministic Local Engine — Zero external API calls or quota consumption.
 */
app.post('/api/router/analyze', (req, res) => {
  const { prompt, config } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: "Prompt string is required." });
  }

  const reasoningModel = config?.reasoningModel || 'qwen3:8b';
  const codingModel = config?.codingModel || 'qwen2.5-coder:7b';
  const generalModel = config?.generalModel || 'llama3.1:8b';

  const localResult = runDeterministicRouterEngine(prompt, reasoningModel, codingModel, generalModel);
  const openWebUiPayloadPreview = {
    model: localResult.selectedModel,
    messages: [{ role: "user", content: prompt }],
    stream: true,
    options: {
      temperature: localResult.selectedTier === 'REASONING_PLANNING' ? 0.2 : 0.4
    }
  };

  return res.json({
    prompt,
    selectedTier: localResult.selectedTier,
    selectedModel: localResult.selectedModel,
    confidenceScore: localResult.confidenceScore,
    thinkingProcess: localResult.thinkingProcess,
    routingReasoning: localResult.routingReasoning,
    matchedKeywords: localResult.matchedKeywords,
    architecturalComplexity: localResult.architecturalComplexity,
    simulatedResponse: localResult.simulatedResponse,
    openWebUiPayloadPreview
  });
});

// Vite Middleware for Development vs Static serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Open WebUI SMRT Router Studio Server running on http://localhost:${PORT}`);
  });
}

startServer();
