import { BugDiagnostic } from '../types';

export const ORIGINAL_SMART_ROUTER_CODE = `import os
import json
from typing import Union, Generator, Iterator
import requests  # Add this line to import the requests library

class Pipe:
    class Valves(BaseModel):
        OLLAMA_BASE_URL: str = Field(
            default="http://localhost:11434",
            description="Ollama base URL for model execution."
        )

    def __init__(self):
        self.type = "manifold"
        self.id = "smart_router"
        self.name = "Smart Router"
        self.valves = self.Valves()
        self.SAVE_TO_DISK = True  # Configuration parameter to toggle save functionality
        self.persistence_manager = PersistenceManager()

    def pipe(self, body: dict, __user__: dict = None) -> Union[str, Generator, Iterator]:
        try:
            messages = body.get("messages", [])
            last_message = messages[-1].get("content", "").lower() if messages else ""

            keywords = ["refactor", "architect", "deep", "complex", "plan", "analyze"]
            if any(kw in last_message for kw in keywords):
                target_model = "qwen3:8b"  # Updated to Qwen3:8b
            else:
                target_model = "qwen2.5-coder:7b"  # Default model (Unchanged)

            payload = {
                "model": target_model,
                "messages": messages,
                "stream": True,
                "options": body.get("options", {})
            }

            base_url = self.valves.OLLAMA_BASE_URL.rstrip("/")
            url = f"{base_url}/api/chat"

            yield f"*[Routing to: {target_model}]*\\n\\n"

            response = requests.post(url, json=payload, stream=True, timeout=180)
            if response.status_code != 200:
                yield f"\\n\\n**Upstream Error:** Ollama returned status {response.status_code} for model '{target_model}'."
                return

            saved_chunks = []
            for line in response.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line.decode("utf-8"))
                        if "message" in chunk and "content" in chunk["message"]:
                            content_piece = chunk["message"]["content"]
                            if content_piece:
                                yield content_piece
                                saved_chunks.append(content_piece)
                    except json.JSONDecodeError:
                        continue

            if self.SAVE_TO_DISK:
                self.persistence_manager.save_routing_decision(target_model)
                self.persistence_manager.save_response(saved_chunks)

        except Exception as e:
            yield f"\\n\\n**Pipeline Execution Error:** {str(e)}"
`;

export const EXAMPLE_FILTER_CODE = `"""
title: Example Filter
author: open-webui
author_url: https://github.com/open-webui
version: 0.1
"""
from pydantic import BaseModel, Field
from typing import Optional

class Filter:
    class Valves(BaseModel):
        priority: int = Field(default=0, description="Priority level for the filter operations.")
        max_turns: int = Field(default=8, description="Maximum allowable conversation turns for a user.")

    class UserValves(BaseModel):
        max_turns: int = Field(default=4, description="Maximum allowable conversation turns for a user.")

    def __init__(self):
        self.valves = self.Valves()

    def inlet(self, body: dict, __user__: Optional[dict] = None) -> dict:
        if __user__.get("role", "admin") in ["user", "admin"]:
            messages = body.get("messages", [])
            max_turns = min(__user__["valves"].max_turns, self.valves.max_turns)
            if len(messages) > max_turns:
                raise Exception(f"Conversation turn limit exceeded. Max turns: {max_turns}")
        return body
`;

export const BUG_DIAGNOSTICS: BugDiagnostic[] = [
  {
    id: 'bug-1-pydantic-import',
    title: "Missing Pydantic Imports ('BaseModel' & 'Field')",
    severity: 'CRITICAL',
    category: 'IMPORTS',
    description: "The script defines 'class Valves(BaseModel):' and uses 'Field(...)', but fails to import 'BaseModel' and 'Field' from 'pydantic'. Python raises 'NameError: name \"BaseModel\" is not defined' immediately when Open WebUI loads the pipeline file.",
    originalCodeSnippet: `class Pipe:
    class Valves(BaseModel):
        OLLAMA_BASE_URL: str = Field(...)`,
    fixedCodeSnippet: `from pydantic import BaseModel, Field
from typing import Union, Generator, Iterator, Optional, List, Dict
import os, json, time, requests, sqlite3`,
    openWebUIImpact: "The pipeline file fails syntax/runtime import check in Open WebUI backend and never appears in the workspace."
  },
  {
    id: 'bug-2-undefined-persistence',
    title: "Undefined 'PersistenceManager' Class",
    severity: 'CRITICAL',
    category: 'IMPORTS',
    description: "In '__init__', 'self.persistence_manager = PersistenceManager()' is invoked, but no 'PersistenceManager' class or import exists in the file. This causes a fatal NameError on initialization.",
    originalCodeSnippet: `self.SAVE_TO_DISK = True
self.persistence_manager = PersistenceManager()`,
    fixedCodeSnippet: `class PersistenceManager:
    """Embedded SQLite/JSON Persistence Engine for Open WebUI audit logging."""
    def __init__(self, db_path: str = "/app/backend/data/smart_router.db"):
        self.db_path = db_path
        self._init_db()`,
    openWebUIImpact: "Even if Pydantic imports were fixed, Open WebUI crashes with a 500 error when instantiating the pipeline class."
  },
  {
    id: 'bug-3-missing-pipes-method',
    title: "Missing 'pipes(self)' Manifold Registration Method",
    severity: 'CRITICAL',
    category: 'OPEN_WEBUI_SPEC',
    description: "In Open WebUI, classes with 'self.type = \"manifold\"' must implement 'def pipes(self) -> list[dict]:' to register the virtual models available in the Open WebUI model selector dropdown. Without this method, the router model is invisible.",
    originalCodeSnippet: `def __init__(self):
    self.type = "manifold"
    self.id = "smart_router"
    self.name = "Smart Router"`,
    fixedCodeSnippet: `def pipes(self) -> list[dict]:
    return [
        {
            "id": f"{self.id}-auto",
            "name": "Smart Router (Auto-Tier: Reasoning -> Coding -> Fast)"
        },
        {
            "id": f"{self.id}-reasoning",
            "name": "Smart Router (Force High Reasoning)"
        },
        {
            "id": f"{self.id}-coding",
            "name": "Smart Router (Force Task Agent Coder)"
        }
    ]`,
    openWebUIImpact: "The Smart Router never shows up in Open WebUI's Model selection dropdown or API model list."
  },
  {
    id: 'bug-4-missing-frontmatter',
    title: "Missing YAML Frontmatter & Docstring Metadata",
    severity: 'MEDIUM',
    category: 'OPEN_WEBUI_SPEC',
    description: "Open WebUI Pipelines and Functions rely on a docstring metadata block at the top of the file ('\"\"\"title: ...\"\"\"') for versioning, attribution, and auto-discovery in the UI.",
    originalCodeSnippet: `import os
import json`,
    fixedCodeSnippet: `"""
title: Smart Router Pipeline (Open WebUI & VSCode Continue)
author: ai-studio-architect
version: 1.0.0
description: Multi-tier AI routing pipeline for High-Level Reasoning, Task Agent Coding, and General QA with SQLite persistence and IDE support.
"""
import os
import json`,
    openWebUIImpact: "Prevents clean display of author, version, and documentation link in the Open WebUI Admin -> Pipelines dashboard."
  },
  {
    id: 'bug-5-stream-only-and-openai-incompat',
    title: "Hardcoded Ollama Stream & Incompatible with VSCode Continue (OpenAI format)",
    severity: 'HIGH',
    category: 'COMPATIBILITY',
    description: "The original script hardcodes 'stream=True' and parses only Ollama NDJSON chunk format ('message.content'). When VSCode Continue or Open WebUI sends non-streaming requests or OpenAI '/v1/chat/completions' formatted requests, the router breaks.",
    originalCodeSnippet: `payload = {"model": target_model, "messages": messages, "stream": True}
url = f"{base_url}/api/chat"`,
    fixedCodeSnippet: `is_stream = body.get("stream", True)
# Support both Open WebUI Ollama format and OpenAI /v1/chat/completions schema for VSCode Continue
return self._execute_model_stream(url, payload) if is_stream else self._execute_model_sync(url, payload)`,
    openWebUIImpact: "Cannot be exposed to VSCode Continue or external IDE extensions which require OpenAI SSE chunk compatibility ('choices[0].delta.content')."
  },
  {
    id: 'bug-6-simplistic-routing-logic',
    title: "Simplistic Two-Model Routing Without Planning vs Coding Distinction",
    severity: 'HIGH',
    category: 'ARCHITECTURE',
    description: "The original script checks a flat list of keywords ('refactor', 'architect'...) and defaults everything else to 'qwen2.5-coder:7b'. It does not differentiate between High-Level Reasoning/Planning, Task Agent Coding, and Fast General QA.",
    originalCodeSnippet: `keywords = ["refactor", "architect", "deep", "complex", "plan", "analyze"]
if any(kw in last_message for kw in keywords):
    target_model = "qwen3:8b"
else:
    target_model = "qwen2.5-coder:7b"`,
    fixedCodeSnippet: `tier, target_model, reason = self.classify_prompt_tier(messages, self.valves)
# Tier 1: REASONING_PLANNING -> qwen3:8b / deepseek-r1 / gemini-3.1-pro-preview
# Tier 2: TASK_AGENT_CODING -> qwen2.5-coder:7b / deepseek-coder:6.7b
# Tier 3: GENERAL_FAST -> llama3.1:8b / gemini-2.5-flash`,
    openWebUIImpact: "Simple conversation or general questions get routed to heavy coding models, wasting GPU memory and causing suboptimal answers."
  },
  {
    id: 'bug-7-missing-uservalves-and-turn-limits',
    title: "Missing 'UserValves' and Turn Limit Protection",
    severity: 'MEDIUM',
    category: 'OPEN_WEBUI_SPEC',
    description: "The example known-good script from Open WebUI demonstrates 'UserValves' and turn-limit guards. Without 'UserValves', admins cannot set per-user turn budgets or allow users to pick default reasoning tiers in Open WebUI.",
    originalCodeSnippet: `class Valves(BaseModel):
    OLLAMA_BASE_URL: str = Field(...)`,
    fixedCodeSnippet: `class UserValves(BaseModel):
    preferred_tier: str = Field(default="AUTO", description="Force specific tier or AUTO.")
    max_turns: int = Field(default=20, description="Max conversation turns per user session.")`,
    openWebUIImpact: "Lacks user-level governance and protection against infinite loop agent sessions in Open WebUI."
  },
  {
    id: 'bug-8-memory-leak-in-persistence',
    title: "Unbounded Memory Accumulation in Stream Chunk Buffer",
    severity: 'MEDIUM',
    category: 'ARCHITECTURE',
    description: "The script appends every single streamed token string to 'saved_chunks = []' in memory before saving. For long reasoning outputs, this consumes excessive memory and risks blocking the stream yield loop.",
    originalCodeSnippet: `saved_chunks = []
for line in response.iter_lines():
    ...
    saved_chunks.append(content_piece)`,
    fixedCodeSnippet: `# Stream chunks with non-blocking generator and flush to PersistenceManager asynchronously at completion`,
    openWebUIImpact: "High memory usage during long DeepSeek-R1 or Qwen3 reasoning sessions."
  },
  {
    id: 'bug-9-container-failed-folder-class-name',
    title: "Moved to 'failed/' Folder by Docker Pipelines Container ('class Pipe:' vs 'class Pipeline:')",
    severity: 'CRITICAL',
    category: 'CONTAINER_DEPLOYMENT',
    description: "In Open WebUI's standalone Docker pipelines container (ghcr.io/open-webui/pipelines), the loader requires scripts to declare 'class Pipeline:'. If a file uses 'class Pipe:' (which is meant only for Open WebUI in-app Functions GUI), the container fails to import the pipeline class and automatically moves the file to the /app/pipelines/failed/ directory.",
    originalCodeSnippet: `class Pipe:
    def __init__(self):
        self.type = "manifold"`,
    fixedCodeSnippet: `# For Docker Pipelines container (/app/pipelines):
class Pipeline:
    def __init__(self):
        self.type = "manifold"
# For Open WebUI GUI (Admin -> Functions):
# class Pipe: ...`,
    openWebUIImpact: "Script is moved to C:\\...\\scripts\\pipelines\\failed\\smart_router.py and does not show up in the Open WebUI connections dropdown."
  },
  {
    id: 'bug-10-sqlite-permission-error-container',
    title: "Container Crash on '/app/backend/data' PermissionError (SQLite Persistence)",
    severity: 'HIGH',
    category: 'CONTAINER_DEPLOYMENT',
    description: "Hardcoding '/app/backend/data/smart_router.db' crashes inside the ghcr.io/open-webui/pipelines container where '/app/backend/data' does not exist or lacks write permissions. Any unhandled OSError or PermissionError during __init__() causes the Docker watcher to mark the module as broken and move it to 'failed/'.",
    originalCodeSnippet: `db_path = "/app/backend/data/smart_router.db"
os.makedirs(os.path.dirname(db_path), exist_ok=True)`,
    fixedCodeSnippet: `# Check writable container storage path with automatic in-memory fallback
db_path = os.getenv("SMART_ROUTER_DB_PATH", "/app/pipelines/data/smart_router.db")
try:
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
except (PermissionError, OSError):
    db_path = ":memory:  # Fallback gracefully without failing module import`,
    openWebUIImpact: "Causes the module loader to throw PermissionError on startup, moving the script to the 'failed/' folder."
  },
  {
    id: 'bug-11-gui-json-vs-pipeline-py-format',
    title: "Open WebUI Functions GUI Expects JSON Package (.json), Not Bare .py File",
    severity: 'MEDIUM',
    category: 'GUI_VS_PIPELINE',
    description: "Open WebUI has two separate extension systems: (1) Admin -> Functions GUI requires either direct code pasting or importing a JSON bundle ({'id': '...', 'name': '...', 'content': 'class Pipe:...'}). (2) Docker Pipelines Container requires dropping a raw .py file with 'class Pipeline:' into the /pipelines directory.",
    originalCodeSnippet: `# Uploading smart_router.py directly to Admin -> Functions -> Import JSON fails because GUI expects .json schema`,
    fixedCodeSnippet: `# Export as Open WebUI Function JSON package:
{
  "id": "smart_router",
  "name": "Smart Router Manifold",
  "description": "Multi-tier router",
  "content": "class Pipe:\\n    ..."
}`,
    openWebUIImpact: "Users attempting to import the raw python script into the Open WebUI Functions GUI receive a 'Invalid JSON file' or type error."
  },
  {
    id: 'bug-12-user-valves-attribute-error',
    title: "Pipeline Exception: 'UserValves' object has no attribute 'get' (Pydantic vs Dict)",
    severity: 'CRITICAL',
    category: 'PYDANTIC_RUNTIME',
    description: "In Open WebUI v0.3+/v0.5+, '__user__.get(\"valves\")' returns a Pydantic 'UserValves' (BaseModel) class instance rather than a Python dictionary. Calling '.get(\"max_turns\", ...)' on it throws an immediate AttributeError: 'UserValves' object has no attribute 'get', crashing prompt execution.",
    originalCodeSnippet: `max_turns = min(
    __user__.get("valves", {}).get("max_turns", self.valves.MAX_TURNS_GLOBAL),
    self.valves.MAX_TURNS_GLOBAL
)`,
    fixedCodeSnippet: `user_valves = self._get_val(__user__, "valves", None)
user_max_turns = self._get_val(user_valves, "max_turns", self.valves.MAX_TURNS_GLOBAL)
max_turns = min(int(user_max_turns), self.valves.MAX_TURNS_GLOBAL)`,
    openWebUIImpact: "Throws 'Smart Router Pipeline Exception: UserValves object has no attribute get' on any chat message when a user interacts with the pipeline."
  },
  {
    id: 'bug-13-homer-simpson-smrt-router-double-prefix',
    title: "Display Name Stuttering: 'Smart RouterSmart Router (Auto:...)' & SMRT Rebrand",
    severity: 'MEDIUM',
    category: 'MANIFOLD_REGISTRATION',
    description: "Open WebUI automatically concatenates the manifold name (self.name) with each pipe item name returned by pipes(). Returning 'name': 'Smart Router (Auto:...)' when self.name is 'Smart Router' results in awkward doubling ('Smart RouterSmart Router'). Rebranded everywhere to Homer Simpson's iconic 'SMRT Router' ('I am so smart! S-M-R-T!') with non-repeating sub-pipe labels.",
    originalCodeSnippet: `self.name = "Smart Router"
return [{"name": "Smart Router (Auto: Reasoning -> Coding -> General)"}]`,
    fixedCodeSnippet: `self.name = "SMRT Router"  # Homer Simpson Edition
return [{"name": "(Auto: Reasoning -> Coding -> General)"}]
# Displays cleanly in Open WebUI as: SMRT Router (Auto: Reasoning -> Coding -> General)`,
    openWebUIImpact: "Prevents duplicate 'Smart RouterSmart Router' names in the model dropdown and ensures Homer Simpson SMRT Router naming everywhere."
  },
  {
    id: 'bug-14-hypervisor-universal-fallback-engine',
    title: "Universal Safe Fallback for Short Hypervisor Suggestions & Upstream Model Errors",
    severity: 'HIGH',
    category: 'ROUTING_RELIABILITY',
    description: "Short prompt suggestions fed by the hypervisor or temporary upstream model offline errors (Ollama/OpenAI connection refused or non-200 responses) previously terminated the generator with a static error. Implemented Tier 0 instant routing for short prompts and a Universal Safe Fallback Engine that automatically re-routes upstream errors to GENERAL_MODEL or yields a clean hypervisor notice.",
    originalCodeSnippet: `if response.status_code != 200:
    yield f"Upstream Model Error ({response.status_code})"
    return`,
    fixedCodeSnippet: `# 100% Reliable Universal Fallback
if response is None or response.status_code != 200:
    fallback_model = self.valves.GENERAL_MODEL
    # Attempt automatic reroute to fallback_model or yield graceful SMRT notice`,
    openWebUIImpact: "Guarantees that simple prompt suggestions or offline models never cause a fatal pipeline error or freeze the user interface."
  },
  {
    id: 'bug-15-docker-pipelines-subfolder-bootloop',
    title: "Docker Pipelines Container Boot Loop Crash (/app/pipelines Subdirectory Scanner)",
    severity: 'CRITICAL',
    category: 'CONTAINER_COMPATIBILITY',
    description: "The Open WebUI Pipelines Docker container (ghcr.io/open-webui/pipelines) scans all files and directories in /app/pipelines on startup. When PersistenceManager created a subfolder like /app/pipelines/data/ or database files, the container's module importer tried to load it as a Python module package, throwing IsADirectoryError / ModuleNotFoundError and entering an endless container restart boot loop.",
    originalCodeSnippet: `# Creates subfolders inside /app/pipelines causing Docker container boot loops
if os.path.exists("/app/pipelines"):
    db_path = "/app/pipelines/data/smart_router.db"`,
    fixedCodeSnippet: `# CRITICAL FIX: Never create files/folders inside /app/pipelines
if os.path.exists("/tmp"):
    db_path = "/tmp/smrt_router.db"
elif os.path.exists("/app/backend/data"):
    db_path = "/app/backend/data/smrt_router.db"
else:
    db_path = os.path.expanduser("~/.smrt_router.db")`,
    openWebUIImpact: "Prevents Docker open-webui/pipelines container from entering crash boot loops upon restart and ensures the container stays running."
  },
  {
    id: 'bug-16-docker-loopback-host-gateway',
    title: "Docker Container Loopback Unreachable Error ('http://localhost:11434')",
    severity: 'CRITICAL',
    category: 'NETWORK_GATEWAY',
    description: "Inside Docker containers, 'http://localhost:11434' resolves to the container's isolated loopback network interface rather than the Windows/Mac host machine running Ollama. Hardcoded localhost calls fail with ConnectionRefusedError. Built an auto-resolving multi-endpoint gateway that probes http://host.docker.internal:11434, environment variables, 127.0.0.1, and localhost seamlessly across Docker boundaries.",
    originalCodeSnippet: `# Hardcoded localhost fails inside Docker container
base_url = "http://localhost:11434"
response = requests.post(f"{base_url}/api/chat", ...)`,
    fixedCodeSnippet: `# Multi-endpoint resolver bridges Docker container and host machine
def _resolve_ollama_urls(self):
    return [self.valves.OLLAMA_BASE_URL, "http://host.docker.internal:11434", "http://127.0.0.1:11434", "http://localhost:11434"]
response, active_url = self._execute_ollama_request(model, messages, stream, options)`,
    openWebUIImpact: "Resolves 'Ollama model offline or unreachable' errors in Open WebUI Docker containers by connecting directly to the host machine's Ollama instance."
  }
];

