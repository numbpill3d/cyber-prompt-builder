
import { getProvider, getAvailableProviders, DEFAULT_PROVIDER, AIPrompt } from './providers/providers';
import { TaskManager, Task, TaskManagerOptions } from './agent/task-manager';
import { settingsManager } from './settings-manager';
import { exportManager, ExportOptions, DeployOptions } from './export-manager';
import { modelRouter, RoutingOptions, RoutingStrategy } from './model-router';
import { parseResponse, StructuredResponse, ResponseMeta, generateStandaloneHtml, createCodeArchive } from './response-handler';
import { sessionManager, Session, EditAction, EditTarget } from './session-manager';
import { Logger } from './logging/logger';
import { errorHandler, ProviderError, ValidationError, AuthenticationError } from './error/error-handler';
import { getMemoryService } from './memory/memory-service';
import { MemoryPoweredSuggestions, CodeSuggestion } from './memory/memory-powered-suggestions';
import { MemoryType } from './memory/memory-types';
import { LearningContext } from './memory/contextual-memory-service';

// Initialize logger
const logger = new Logger('AIService');

// Initialize memory-powered suggestions
const initializeMemoryServices = async () => {
  if (!memoryPoweredSuggestions) {
    try {
      const memoryService = await getMemoryService();
      memoryPoweredSuggestions = new MemoryPoweredSuggestions(memoryService);
      logger.info('Memory-powered suggestions initialized');
    } catch (error) {
      logger.error('Failed to initialize memory services:', error);
    }
  }
};

// Re-export types for use by consumers
export type { AIPrompt } from './providers/providers';
export type { Task, TaskManagerOptions } from './agent/task-manager';
export type { AppSettings, AgentSettings, AIProviderSettings } from './settings-manager';
export type { ExportOptions, DeployOptions, ExportFormat, DeployTarget } from './export-manager';
export type { RoutingOptions, RoutingStrategy } from './model-router';
export type { StructuredResponse, ResponseMeta } from './response-handler';
export type { Session, EditAction, EditTarget } from './session-manager';

export interface GenerateCodeParams {
  prompt: string;
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIServiceResponse {
  code: string;
  error?: string;
  taskId?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Main AI Service class
 */
class AIService {
  private taskManager: TaskManager;

  constructor() {
    // Initialize memory services on construction or on first use
    initializeMemoryServices();
    this.taskManager = new TaskManager();
    logger.info('AIService initialized');
  }

  async generateCode(params: GenerateCodeParams): Promise<AIServiceResponse> {
    await initializeMemoryServices(); // Ensure services are ready

    const { prompt, provider, model, temperature, maxTokens } = params;
    const activeProviderName = provider || settingsManager.getActiveProvider();
    const providerInstance = getProvider(activeProviderName);

    const aiPrompt: AIPrompt = { content: prompt };

    try {
      const response = await providerInstance.generateCode(aiPrompt, {
        model: model || settingsManager.getPreferredModel(activeProviderName),
        temperature,
        maxTokens,
      });

      const structuredResponse = parseResponse(response, {
        provider: activeProviderName,
        model: response.model,
        // cost and tokens would ideally come from providerInstance.getUsage() or similar
      });

      // Store interaction in memory
      if (memoryPoweredSuggestions) {
        const learningContext: LearningContext = {
          sessionId: sessionManager.getCurrentSession()?.id || 'unknown_session',
          timestamp: Date.now(),
          action: 'generate_code',
          context: { prompt, provider: activeProviderName, model: response.model },
          outcome: 'success',
        };
        // Add to memory, but don't await if not critical for response path
        getMemoryService().then(ms => {
            ms.addMemory(
                'code_generation', // collection name
                structuredResponse.rawResponse || response.code,
                {
                    type: MemoryType.CODE,
                    source: 'ai_generated',
                    tags: ['generation', activeProviderName, response.model || 'unknown'],
                    language: params.language || getPrimaryLanguage(structuredResponse), // Assuming language is part of params or detected
                    custom: {
                        prompt,
                        temperature,
                        maxTokens,
                        responseTokenCount: response.usage?.total_tokens,
                    }
                }
            );
            // Also learn from this interaction for contextual suggestions
            if (memoryPoweredSuggestions) {
                 memoryPoweredSuggestions.learnFromCode(structuredResponse.rawResponse || response.code, params.language || getPrimaryLanguage(structuredResponse), learningContext.sessionId, true);
            }
        }).catch(err => logger.error("Failed to store generation in memory", err));
      }


      return {
        code: structuredResponse.codeBlocks[getPrimaryLanguage(structuredResponse)] || Object.values(structuredResponse.codeBlocks)[0] || '',
        taskId: this.taskManager.createTask({
          type: 'code_generation',
          prompt: aiPrompt,
          status: 'completed',
          provider: activeProviderName,
          model: response.model,
        }).id,
        usage: response.usage,
      };
    } catch (error) {
      logger.error('Error generating code:', error);
      const handledError = errorHandler.handleError(error as Error, {
        prompt,
        provider: activeProviderName,
      });
      return {
        code: '',
        error: handledError.message,
      };
    }
  }

  async getCodeSuggestions(partialCode: string, language: string, sessionId: string): Promise<CodeSuggestion[]> {
    await initializeMemoryServices();
    if (!memoryPoweredSuggestions) {
      logger.warn('MemoryPoweredSuggestions not available for getCodeSuggestions');
      return [];
    }
    return memoryPoweredSuggestions.getCodeSuggestions(partialCode, language, sessionId);
  }

  // ... other methods like exportCode, deployCode, etc.
}

export const aiService = new AIService();

// Note: The original exportCode and deployCode functions were simple browser-based downloads.
// They can be integrated into the AIService class or kept separate if they don't need AIService state.
// For now, I'm keeping them separate as they were in the HEAD version, but they might fit better inside the class.

export async function exportCode(code: string, options: ExportOptions): Promise<boolean> {
  try {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = options.fileName || `generated-code-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
}

export async function deployCode(code: string, options: DeployOptions): Promise<boolean> { // Make sure DeployOptions is defined or imported
  // For now, just create a downloadable project structure
  try {
    const projectStructure = {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.projectName || 'Generated Project'}</title>
</head>
<body>
    <div id="app"></div>
    <script>
        ${code}
    </script>
</body>
</html>`,
      'README.md': `# ${options.projectName || 'Generated Project'}

This project was generated using Cyber Prompt Builder.

## Setup
1. Open index.html in your browser
2. Or serve with a local server for best results

Generated on: ${new Date().toISOString()}
`
    };

    // Create a simple zip-like structure as text files
    for (const [filename, content] of Object.entries(projectStructure)) {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    return true;
  } catch (error) {
    console.error('Deploy failed:', error);
    return false;
  }
}
