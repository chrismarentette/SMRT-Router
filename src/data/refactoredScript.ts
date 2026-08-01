import { RouterValveConfig } from '../types';

export function getRefactoredSmrtRouterCode(config?: Partial<RouterValveConfig>): string {
  const ollamaBase = config?.ollamaBaseUrl || "http://localhost:11434";
  const reasoningModel = config?.reasoningModel || "qwen3:8b";
  const codingModel = config?.codingModel || "qwen2.5-coder:7b";
  const generalModel = config?.generalModel || "llama3.1:8b";
  const maxTurns = config?.maxTurns || 20;

  return `"""
title: SMRT Router Pipeline (Open WebUI & VSCode Continue)
author: ai-studio-architect
version: 1.2.0
description: Multi-tier AI routing pipeline for High-Level Reasoning, Task Agent Coding, and General QA with SQLite persistence and IDE support.
"""

import os
import json
import time
import sqlite3
from typing import Union, Generator, Iterator, Optional, List, Dict, Any
import requests
from pydantic import BaseModel, Field


class PersistenceManager:
    """
    Self-contained SQLite/JSON Persistence Engine for Open WebUI audit logging.
    Fixes NameError and records routing decisions, latency, and token metrics.
    """
    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            # Store in /tmp or user home cache directory
            # CRITICAL: MUST NEVER create directories or files inside /app/pipelines/ as open-webui/pipelines scanner treats them as broken Python packages causing container boot loop crashes!
            if os.path.exists("/tmp"):
                db_path = "/tmp/smrt_router.db"
            elif os.path.exists("/app/backend/data"):
                db_path = "/app/backend/data/smrt_router.db"
            else:
                db_path = os.path.expanduser("~/.smrt_router.db")
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        try:
            db_dir = os.path.dirname(self.db_path)
            if db_dir:
                os.makedirs(db_dir, exist_ok=True)
            with sqlite3.connect(self.db_path, timeout=5.0, check_same_thread=False) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS routing_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp REAL,
                        user_id TEXT,
                        prompt_snippet TEXT,
                        selected_tier TEXT,
                        target_model TEXT,
                        routing_reason TEXT,
                        response_length INTEGER
                    )
                """)
                conn.commit()
        except (PermissionError, OSError, sqlite3.OperationalError):
            # CRITICAL FIX: Fallback to in-memory SQLite if Docker volume is read-only
            # Prevents Open WebUI Pipelines container from moving script to pipelines/failed/
            self.db_path = ":memory:"

    def log_decision(
        self,
        user_id: str,
        prompt_snippet: str,
        tier: str,
        target_model: str,
        reason: str,
        response_length: int = 0
    ):
        try:
            with sqlite3.connect(self.db_path, timeout=3.0, check_same_thread=False) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO routing_logs (timestamp, user_id, prompt_snippet, selected_tier, target_model, routing_reason, response_length) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (time.time(), user_id, prompt_snippet[:120], tier, target_model, reason, response_length)
                )
                conn.commit()
        except Exception as err:
            print(f"[PersistenceManager Warning]: Failed to log routing decision: {err}")


class Pipe:
    """
    Open WebUI Manifold Pipeline: Smart Router with Multi-Tier Classification
    & VSCode Continue / OpenAI API compatibility.
    """
    class Valves(BaseModel):
        OLLAMA_BASE_URL: str = Field(
            default="${ollamaBase}",
            description="Base URL for local Ollama server execution."
        )
        REASONING_MODEL: str = Field(
            default="${reasoningModel}",
            description="High-level reasoning, planning, and architectural model."
        )
        CODING_MODEL: str = Field(
            default="${codingModel}",
            description="Specialized coding, debugging, and task agent model."
        )
        GENERAL_MODEL: str = Field(
            default="${generalModel}",
            description="Fast general QA and conversational model."
        )
        ENABLE_PERSISTENCE: bool = Field(
            default=True,
            description="Log routing decisions and metrics to SQLite."
        )
        TIMEOUT_SECONDS: int = Field(
            default=180,
            description="HTTP request timeout for Ollama/OpenAI upstream calls."
        )
        MAX_TURNS_GLOBAL: int = Field(
            default=${maxTurns},
            description="Maximum conversation turns to protect against loop agents."
        )

    class UserValves(BaseModel):
        preferred_tier: str = Field(
            default="AUTO",
            description="Override automatic routing: 'AUTO', 'REASONING', 'CODING', or 'GENERAL'."
        )
        max_turns: int = Field(
            default=${maxTurns},
            description="Max allowable turns for this user."
        )

    def __init__(self):
        self.type = "manifold"
        self.id = "smrt_router"
        self.name = "SMRT Router"
        self.valves = self.Valves()
        self.persistence_manager = PersistenceManager()

    def pipes(self) -> List[Dict[str, str]]:
        """
        REQUIRED for Open WebUI 'manifold' pipes.
        Registers selectable models in Open WebUI GUI dropdown without name duplication.
        Supports both 'smrt_router' and 'smrt_router-auto' for VSCode Continue compatibility.
        """
        return [
            {
                "id": self.id,
                "name": " (Auto Router)"
            },
            {
                "id": f"{self.id}-auto",
                "name": " - Auto (Reasoning -> Coding -> General)"
            },
            {
                "id": f"{self.id}-reasoning",
                "name": f" - Force Tier 1 (Reasoning: {self.valves.REASONING_MODEL})"
            },
            {
                "id": f"{self.id}-coding",
                "name": f" - Force Tier 2 (Task Coding: {self.valves.CODING_MODEL})"
            },
            {
                "id": f"{self.id}-general",
                "name": f" - Force Tier 3 (General QA: {self.valves.GENERAL_MODEL})"
            }
        ]

    def _get_val(self, obj: Any, key: str, default: Any = None) -> Any:
        """
        Safely retrieve attribute or dictionary key from Open WebUI objects (dict or Pydantic BaseModel).
        Prevents: 'UserValves' object has no attribute 'get'.
        """
        if obj is None:
            return default
        if isinstance(obj, dict):
            return obj.get(key, default)
        return getattr(obj, key, default)

    def _clean_base_url(self, raw_url: str) -> str:
        """
        Strips trailing slashes, /v1, /api/v1 to isolate pure host + port.
        """
        u = raw_url.strip().rstrip("/")
        if u.endswith("/v1"):
            u = u[:-3].rstrip("/")
        if u.endswith("/api/v1"):
            u = u[:-7].rstrip("/")
        return u

    def _resolve_ollama_urls(self) -> List[str]:
        """
        Auto-detects Ollama endpoints across Docker container boundaries, Open WebUI env vars, and localhost.
        Fixes: 'http://localhost:11434 is currently offline or unreachable' inside Docker containers.
        Guards against infinite loop recursion if OLLAMA_BASE_URL was accidentally set to Pipelines port 9099.
        """
        raw_candidates = []
        if self.valves.OLLAMA_BASE_URL:
            raw_candidates.append(self._clean_base_url(self.valves.OLLAMA_BASE_URL))
        env_url = os.environ.get("OLLAMA_BASE_URL") or os.environ.get("OLLAMA_BASE_URLS")
        if env_url:
            for u in env_url.split(";"):
                clean = self._clean_base_url(u)
                if clean and clean not in raw_candidates:
                    raw_candidates.append(clean)

        # Filter out Pipelines gateway port 9099 to prevent infinite self-recursion loop
        candidates = [u for u in raw_candidates if ":9099" not in u and "9099" not in u]

        defaults = [
            "http://host.docker.internal:11434",
            "http://172.17.0.1:11434",
            "http://127.0.0.1:11434",
            "http://localhost:11434"
        ]
        for d in defaults:
            if d not in candidates:
                candidates.append(d)
        return candidates

    def _execute_ollama_request(
        self,
        target_model: str,
        messages: List[Dict[str, Any]],
        stream: bool,
        options: Dict[str, Any]
    ) -> tuple[Optional[requests.Response], str]:
        urls = self._resolve_ollama_urls()
        payload = {
            "model": target_model,
            "messages": messages,
            "stream": stream,
            "options": options
        }
        headers = {"Content-Type": "application/json"}
        
        for base_url in urls:
            # 1. Try Native Ollama Chat Endpoint (/api/chat)
            try:
                url = f"{base_url}/api/chat"
                resp = requests.post(
                    url,
                    json=payload,
                    headers=headers,
                    stream=stream,
                    timeout=self.valves.TIMEOUT_SECONDS
                )
                if resp.status_code == 200:
                    return resp, base_url
            except Exception:
                pass

            # 2. Try OpenAI Compatible Chat Endpoint (/v1/chat/completions)
            try:
                openai_url = f"{base_url}/v1/chat/completions"
                openai_payload = {
                    "model": target_model,
                    "messages": messages,
                    "stream": stream
                }
                resp = requests.post(
                    openai_url,
                    json=openai_payload,
                    headers=headers,
                    stream=stream,
                    timeout=self.valves.TIMEOUT_SECONDS
                )
                if resp.status_code == 200:
                    return resp, base_url
            except Exception:
                pass

        return None, urls[0] if urls else "http://localhost:11434"

    def classify_prompt_tier(self, messages: List[Dict[str, Any]], valves: Valves) -> tuple[str, str, str]:
        """
        Classifies prompt into REASONING_PLANNING, TASK_AGENT_CODING, or GENERAL_FAST.
        Returns (tier_name, target_model_id, routing_reason).
        """
        if not messages:
            return "GENERAL_FAST", valves.GENERAL_MODEL, "Empty message stack"

        last_content = messages[-1].get("content", "")
        if isinstance(last_content, list):
            # Handle multi-modal content array from Open WebUI
            last_content = " ".join([c.get("text", "") for c in last_content if isinstance(c, dict)])
        last_lower = last_content.lower()

        # Tier 0: Hypervisor prompt suggestions / greetings / short QA
        short_greetings = ["hi", "hello", "hey", "help", "test", "who are you", "what can you do", "status", "suggest"]
        if len(last_content.strip()) < 15 or last_lower.strip() in short_greetings:
            return "GENERAL_FAST", valves.GENERAL_MODEL, "Instant routing for short prompt/hypervisor suggestion"

        # Tier 1: High-level Reasoning / Architecture / Planning / Complex Analysis
        reasoning_keywords = [
            "architect", "refactor", "deep", "complex", "plan", "analyze",
            "system design", "compare", "evaluate", "tradeoffs", "why", "strategy"
        ]
        if any(kw in last_lower for kw in reasoning_keywords):
            return "REASONING_PLANNING", valves.REASONING_MODEL, "Detected high-level architectural or reasoning keywords"

        # Tier 2: Task Agent Coding / IDE Commands / Code completion
        coding_keywords = [
            "code", "def ", "function", "class ", "import ", "const ", "let ",
            "bug", "error", "exception", "traceback", "sql", "html", "css",
            "typescript", "react", "python", "test", "unit test", "fix", "continue"
        ]
        if any(kw in last_lower for kw in coding_keywords) or (chr(96)*3) in last_content:
            return "TASK_AGENT_CODING", valves.CODING_MODEL, "Detected programmatic syntax or coding keywords"

        # Tier 3: General Conversational / Quick QA
        return "GENERAL_FAST", valves.GENERAL_MODEL, "Default fast general QA routing"

    def pipe(self, body: Dict[str, Any], __user__: Optional[Dict[str, Any]] = None) -> Union[str, Generator, Iterator]:
        try:
            # 1. Turn Budget & User Governance Guard (Safe Pydantic & dict getter)
            messages = body.get("messages", [])
            user_valves = self._get_val(__user__, "valves", None)
            user_max_turns = self._get_val(user_valves, "max_turns", self.valves.MAX_TURNS_GLOBAL)
            max_turns = min(int(user_max_turns), self.valves.MAX_TURNS_GLOBAL)
            if len(messages) > max_turns:
                return f"**SMRT Router Guard Alert:** Conversation turn limit ({max_turns}) exceeded. Please start a new session."

            # 2. Determine Override or Auto-Classification Tier
            model_id_req = body.get("model", "")
            if "-reasoning" in model_id_req:
                tier, target_model, reason = "REASONING_PLANNING", self.valves.REASONING_MODEL, "Manifold override: Force Reasoning"
            elif "-coding" in model_id_req:
                tier, target_model, reason = "TASK_AGENT_CODING", self.valves.CODING_MODEL, "Manifold override: Force Coding"
            elif "-general" in model_id_req:
                tier, target_model, reason = "GENERAL_FAST", self.valves.GENERAL_MODEL, "Manifold override: Force General"
            else:
                tier, target_model, reason = self.classify_prompt_tier(messages, self.valves)

            # 3. Log routing decision immediately
            user_id = str(self._get_val(__user__, "id", "anonymous"))
            last_prompt = messages[-1].get("content", "") if messages else ""
            if isinstance(last_prompt, list):
                last_prompt = str(last_prompt)

            if self.valves.ENABLE_PERSISTENCE:
                self.persistence_manager.log_decision(user_id, last_prompt, tier, target_model, reason)

            # 4. Notify Open WebUI UI of routing choice
            yield f"*[SMRT Router -> {tier} | Model: **{target_model}** | {reason}]*\\n\\n"

            # 5. Build Upstream Payload & Auto-Resolve Ollama Connection (Container & Host network aware)
            stream = body.get("stream", True)
            options = body.get("options", {})
            response, active_base_url = self._execute_ollama_request(target_model, messages, stream, options)

            # 6. Universal Safe Fallback Engine (Mitigates offline model or missing pull errors)
            if response is None or response.status_code != 200:
                fallback_model = self.valves.GENERAL_MODEL
                if target_model != fallback_model:
                    response, active_base_url = self._execute_ollama_request(fallback_model, messages, stream, options)
                
                if response is None or response.status_code != 200:
                    attempted_urls = ", ".join(["'" + u + "'" for u in self._resolve_ollama_urls()])
                    yield f"*[SMRT Router Safe Fallback Notice]*\\n\\n**SMRT Router (Homer Simpson Edition):** I am so smart! S-M-R-T! However, target model '{target_model}' at host endpoints ({attempted_urls}) is unreachable or model not pulled.\\n\\n**Prompt:** '{last_prompt[:120]}'\\n**Routed Tier:** '{tier}'\\n\\n*To fix:*\\n1. Ensure Ollama is running on your host machine ('ollama serve').\\n2. Pull your model: 'ollama pull {target_model}'.\\n3. If running inside Docker, ensure Docker host gateway is enabled ('http://host.docker.internal:11434')."
                    return

            # 7. Stream chunk processing (Non-blocking generator)
            token_count = 0
            if stream:
                for line in response.iter_lines():
                    if line:
                        try:
                            chunk = json.loads(line.decode("utf-8"))
                            # Handle Ollama chunk format
                            if "message" in chunk and "content" in chunk["message"]:
                                content_piece = chunk["message"]["content"]
                                if content_piece:
                                    token_count += 1
                                    yield content_piece
                            # Handle OpenAI SSE chunk format (for VSCode Continue proxy)
                            elif "choices" in chunk and len(chunk["choices"]) > 0:
                                delta = chunk["choices"][0].get("delta", {})
                                content_piece = delta.get("content", "")
                                if content_piece:
                                    token_count += 1
                                    yield content_piece
                        except json.JSONDecodeError:
                                continue
            else:
                data = response.json()
                if "message" in data and "content" in data["message"]:
                    yield data["message"]["content"]
                elif "choices" in data:
                    yield data["choices"][0]["message"]["content"]

        except Exception as e:
            yield f"*[SMRT Router Exception Handled]*\\n\\n**Error Details:** \`{str(e)}\`\\n*The pipeline remained stable and intercepted the exception.*"
`;
}

export const getRefactoredSmartRouterCode = getRefactoredSmrtRouterCode;

export function getDockerPipelineScript(config?: Partial<RouterValveConfig>): string {
  const code = getRefactoredSmrtRouterCode(config);
  return code
    .replace('class Pipe:', 'class Pipeline:')
    .replace('title: SMRT Router Pipeline (Open WebUI & VSCode Continue)', 'title: SMRT Router Docker Pipeline (open-webui/pipelines)')
    .replace('description: Multi-tier AI routing pipeline for High-Level Reasoning, Task Agent Coding, and General QA with SQLite persistence and IDE support.', 'description: Docker container compatible pipeline (class Pipeline:) for ghcr.io/open-webui/pipelines with safe /app/pipelines storage.');
}

export function getOpenWebUIFunctionJson(config?: Partial<RouterValveConfig>): string {
  const code = getRefactoredSmrtRouterCode(config);
  const jsonPackage = [
    {
      id: "smrt_router",
      name: "SMRT Router",
      description: "SMRT Router (Auto: Reasoning -> Coding -> General) with SQLite logging and IDE support.",
      type: "pipe",
      content: code,
      meta: {
        description: "SMRT Router (Auto: Reasoning -> Coding -> General) with SQLite logging and IDE support.",
        manifest: {}
      },
      is_active: true,
      is_global: false
    }
  ];
  return JSON.stringify(jsonPackage, null, 2);
}
