/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly REACT_APP_APP_ENVIRONMENT: string;
  readonly REACT_APP_APP_DEBUG: string;
  readonly REACT_APP_PROVIDERS_OPENAI_API_KEY: string;
  readonly REACT_APP_PROVIDERS_CLAUDE_API_KEY: string;
  readonly REACT_APP_PROVIDERS_GEMINI_API_KEY: string;
  readonly REACT_APP_PROVIDERS_DEFAULT_PROVIDER: string;
  readonly REACT_APP_AGENT_MAX_ITERATIONS: string;
  readonly REACT_APP_AGENT_ENABLE_TASK_BREAKDOWN: string;
  readonly REACT_APP_AGENT_ENABLE_ITERATION: string;
  readonly REACT_APP_AGENT_ENABLE_CONTEXT_MEMORY: string;
  readonly REACT_APP_MEMORY_DB_ENDPOINT: string;
  readonly REACT_APP_MEMORY_COLLECTION_NAME: string;
  readonly REACT_APP_LOGGING_LEVEL: string;
  readonly REACT_APP_LOGGING_ENABLE_LOCAL_STORAGE: string;
  readonly REACT_APP_PROMPT_BUILDER_MAX_TOKENS: string;
  readonly REACT_APP_PROMPT_BUILDER_TEMPERATURE: string;
  readonly REACT_APP_TTS_ENABLED: string;
  readonly REACT_APP_TTS_VOICE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
