export type RouterTier = 'REASONING_PLANNING' | 'TASK_AGENT_CODING' | 'GENERAL_FAST';

export interface BugDiagnostic {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  category: 'IMPORTS' | 'OPEN_WEBUI_SPEC' | 'ARCHITECTURE' | 'COMPATIBILITY' | 'CONTAINER_DEPLOYMENT' | 'GUI_VS_PIPELINE' | 'PYDANTIC_RUNTIME' | 'MANIFOLD_REGISTRATION' | 'ROUTING_RELIABILITY' | 'CONTAINER_COMPATIBILITY' | 'NETWORK_GATEWAY';
  description: string;
  originalCodeSnippet: string;
  fixedCodeSnippet: string;
  openWebUIImpact: string;
}

export type OpenWebUIDeploymentTarget = 'OPEN_WEBUI_FUNCTION_JSON' | 'DOCKER_PIPELINES_CONTAINER' | 'STANDALONE_PYTHON';

export interface RouterValveConfig {
  ollamaBaseUrl: string;
  openAiBaseUrl: string;
  openAiApiKey: string;
  reasoningModel: string;
  codingModel: string;
  generalModel: string;
  autocompleteModel?: string;
  embeddingModel?: string;
  enablePersistence: boolean;
  persistenceMode: 'sqlite' | 'json';
  maxTurns: number;
  enableSemanticFallback: boolean;
  reasoningKeywords: string[];
  codingKeywords: string[];
  generalKeywords: string[];
}

export interface RouterAnalysisRequest {
  prompt: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  config: RouterValveConfig;
}

export interface RouterAnalysisResult {
  prompt: string;
  selectedTier: RouterTier;
  selectedModel: string;
  confidenceScore: number;
  thinkingProcess: string;
  routingReasoning: string;
  matchedKeywords: string[];
  architecturalComplexity: 'HIGH' | 'MEDIUM' | 'LOW';
  simulatedResponse: string;
  openWebUiPayloadPreview: Record<string, any>;
}

export interface PresetPrompt {
  id: string;
  title: string;
  category: RouterTier;
  prompt: string;
  description: string;
}
