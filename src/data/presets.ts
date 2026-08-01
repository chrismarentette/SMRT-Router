import { PresetPrompt } from '../types';

export const PRESET_PROMPTS: PresetPrompt[] = [
  {
    id: 'reasoning-1-arch',
    title: 'Architect Multi-Region Rate Limiter',
    category: 'REASONING_PLANNING',
    prompt: 'Architect a distributed, multi-region API rate limiting system for a high-traffic gateway. Evaluate the tradeoffs between Redis sliding window logs, token buckets, and CRDTs for cross-region synchronization. Provide a structured architectural plan and failure recovery strategy.',
    description: 'Complex system design requiring deep architectural reasoning and tradeoff analysis.'
  },
  {
    id: 'reasoning-2-refactor',
    title: 'Refactor Monolith to Bounded Contexts',
    category: 'REASONING_PLANNING',
    prompt: 'We have a 250,000 line monolithic Django e-commerce backend with tightly coupled database transactions between Orders, Payments, and Inventory. Formulate a step-by-step refactoring strategy to decompose this into Domain-Driven Design (DDD) bounded contexts without downtime.',
    description: 'High-level refactoring and migration planning.'
  },
  {
    id: 'reasoning-3-eval',
    title: 'Deep SQL Indexing Strategy & Partitioning',
    category: 'REASONING_PLANNING',
    prompt: 'Analyze our PostgreSQL table with 1.5 billion audit log records. Explain the tradeoffs between declarative table partitioning by month vs hash partitioning, and propose an optimal composite B-Tree and BRIN indexing plan for high-volume concurrent writes and range queries.',
    description: 'Database architecture and analytical optimization.'
  },
  {
    id: 'coding-1-react-hook',
    title: 'Write TypeScript Hook for Debounced Search',
    category: 'TASK_AGENT_CODING',
    prompt: 'Write a production-ready React custom hook `useDebouncedSearch<T>` in TypeScript that handles input debouncing, aborts stale in-flight fetch requests using AbortController, and provides loading/error state.',
    description: 'Direct task agent coding and syntax implementation.'
  },
  {
    id: 'coding-2-sql-query',
    title: 'SQL Rolling Average Window Query',
    category: 'TASK_AGENT_CODING',
    prompt: 'Write an SQL query for PostgreSQL to calculate a 7-day rolling average of daily transaction revenue per user_id, including days with zero revenue using a recursive date CTE.',
    description: 'Specialized database syntax and query authoring.'
  },
  {
    id: 'coding-3-vscode-continue',
    title: 'VSCode Continue: Generate Jest Unit Tests',
    category: 'TASK_AGENT_CODING',
    prompt: '```typescript\nexport function calculateTaxBracket(income: number, status: string): number {\n  if (income < 11000) return 0.1;\n  if (income < 44725) return 0.12;\n  return 0.22;\n}\n```\nGenerate a comprehensive Jest unit test suite for this function covering edge cases, negative numbers, and boundary thresholds.',
    description: 'Typical IDE inline code test generation request.'
  },
  {
    id: 'general-1-git',
    title: 'Explain Git Rebase vs Merge',
    category: 'GENERAL_FAST',
    prompt: 'Explain the difference between `git rebase` and `git merge` in two concise paragraphs with an example of when to use each.',
    description: 'Quick educational question suitable for fast general models.'
  },
  {
    id: 'general-2-http',
    title: 'HTTP status codes difference',
    category: 'GENERAL_FAST',
    prompt: 'What is the practical difference between HTTP 401 Unauthorized and 403 Forbidden?',
    description: 'Casual developer QA best routed to fast lightweight models.'
  }
];
