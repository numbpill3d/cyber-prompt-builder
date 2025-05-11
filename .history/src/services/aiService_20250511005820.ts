/**
 * AI Code Generation Service
 * This service handles AI code generation and management
 */

import { getProvider, getAvailableProviders, DEFAULT_PROVIDER, AIPrompt } from './providers/providers';
import { TaskManager, Task, TaskManagerOptions } from './agent/task-manager';
import { settingsManager } from './settings-manager';
import { exportManager, ExportOptions, DeployOptions } from './export-manager';
import { modelRouter, RoutingOptions, RoutingStrategy } from './model-router';
import { parseResponse, StructuredResponse, ResponseMeta, generateStandaloneHtml, createCodeArchive } from './response-handler';
import { sessionManager, Session, EditAction, EditTarget } from './session-manager';

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
  context?: string;
  provider?: string;
  temperature?: number;
  maxTokens?: number;
  language?: string;
  model?: string;
  routingStrategy?: RoutingStrategy;
  routingOptions?: Partial<RoutingOptions>;
  sessionId?: string;
  editAction?: EditAction;
  editTarget?: EditTarget;
}

export interface GenerateCodeResponse {
  code: string;
  error?: string;
  taskId?: string;
  parsedResponse?: StructuredResponse;
  sessionId?: string;
}

// Create a task manager
const taskManager = new TaskManager();

/**
 * Generates code using the specified AI provider
 */
export const generateCode = async (params: GenerateCodeParams): Promise<GenerateCodeResponse> => {
  try {
    const startTime = Date.now();
    
    // Set routing options if provided
    if (params.routingStrategy) {
      modelRouter.setRoutingStrategy(params.routingStrategy);
    }
    
    if (params.routingOptions) {
      modelRouter.setRoutingOptions(params.routingOptions);
    }
    
    // Handle session context for follow-up prompts
    let aiPrompt: AIPrompt;
    let sessionId = params.sessionId;
    
    if (sessionId && params.editAction && params.editTarget) {
      // This is a follow-up prompt in an existing session
      try {
        aiPrompt = sessionManager.generateFollowUpPrompt(
          sessionId,
          params.prompt,
          params.editAction,
          params.editTarget
        );
      } catch (error) {
        console.warn('Error generating follow-up prompt:', error);
        // Fall back to regular prompt
        aiPrompt = {
          content: params.prompt,
          context: params.context
        };
      }
    } else {
      // Regular prompt
      aiPrompt = {
        content: params.prompt,
        context: params.context
      };
      
      // Create a new session if we don't have one
      if (!sessionId) {
        sessionId = sessionManager.createSession(`Session ${new Date().toLocaleString()}`);
      }
    }
    
    // Determine which provider to use either explicitly or via router
    let providerName: string;
    if (params.provider) {
      // Explicit provider specified
      providerName = params.provider;
    } else {
      // Use model router to select the best provider
      try {
        providerName = modelRouter.routePrompt(aiPrompt);
      } catch (error) {
        return {
          code: "",
          error: `Failed to select a provider: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
    
    // Get API key from settings
    const apiKey = settingsManager.getApiKey(providerName);
    if (!apiKey) {
      return {
        code: "",
        error: `API key not configured for ${providerName}. Please set your API key in settings.`
      };
    }
    
    // Get the preferred model or use the provided one
    const model = params.model || settingsManager.getPreferredModel(providerName);
    
    console.log(`Using provider: ${providerName} with model: ${model}`);
    
    // Create a task
    const task = taskManager.createTask(aiPrompt.content, providerName);
    
    // Get agent settings
    const agentSettings = settingsManager.getAgentSettings();
    
    // If task breakdown is enabled and no explicit steps provided, let the AI break down the task
    if (agentSettings.enableTaskBreakdown) {
      // In a real implementation, we'd use the AI to break down the task
      // For now, just create a simple one-step task
      taskManager.breakdownTask(task.id, ["Complete coding task"]);
    } else {
      // Simple one-step task
      taskManager.breakdownTask(task.id, ["Complete coding task"]);
    }
    
    // Add context if provided
    if (aiPrompt.context) {
      taskManager.addContext(task.id, aiPrompt.context);
    }
    
    // Get current step
    const currentStep = taskManager.getCurrentStep(task.id);
    if (!currentStep) {
      return {
        code: "",
        error: "Failed to create task steps",
        taskId: task.id,
        sessionId
      };
    }
    
    // Get provider
    const provider = getProvider(providerName);
    
    // Optimize prompt for this provider if needed
    const optimizedPrompt = await modelRouter.optimizePromptForProvider(providerName, aiPrompt);
    
    // Estimate token count (rough approximation)
    const promptTokens = Math.ceil((optimizedPrompt.content.length + (optimizedPrompt.context?.length || 0)) / 4);
    
    // Generate code
    const result = await provider.generateCode(optimizedPrompt, {
      apiKey,
      model,
      temperature: params.temperature,
      maxTokens: params.maxTokens,
      language: params.language
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Estimate response tokens
    const responseTokens = Math.ceil(result.code.length / 4);
    
    // Estimate cost
    const costEstimate = await provider.estimateCost(optimizedPrompt, {
      apiKey,
      model,
      maxTokens: responseTokens
    });
    
    // Parse the response
    const parsedResponse = parseResponse(result, {
      model,
      provider: providerName,
      cost: costEstimate.totalCost,
      tokens: {
        input: promptTokens,
        output: responseTokens,
        total: promptTokens + responseTokens
      },
      duration
    });
    
    // Update task
    taskManager.completeStep(task.id, currentStep.id, result.code || "", result.error);
    
    // Add this iteration to the session
    if (sessionId) {
      sessionManager.addIteration(
        sessionId,
        optimizedPrompt,
        parsedResponse,
        providerName,
        model,
        params.editAction,
        params.editTarget
      );
    }
    
    // Return the result
    return {
      code: result.code || "",
      error: result.error,
      taskId: task.id,
      parsedResponse,
      sessionId
    };
  } catch (error: any) {
    console.error("Error generating code:", error);
    return {
      code: "",
      error: `Failed to generate code: ${error.message}`
    };
  }
};

/**
 * Configure API key for a provider
 */
export const configureApiKey = async (provider: string, apiKey: string): Promise<boolean> => {
  if (!provider || !apiKey || apiKey.trim() === "") {
    return false;
  }
  
  try {
    // Validate the API key with the provider
    const providerInstance = getProvider(provider);
    const isValid = await providerInstance.isApiKeyValid(apiKey);
    
    if (isValid) {
      // Save the API key in settings
      settingsManager.setApiKey(provider, apiKey);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error configuring API key for ${provider}:`, error);
    return false;
  }
};

/**
 * Check if an API key is configured for a provider
 */
export const hasApiKey = (provider?: string): boolean => {
  const providerName = provider || settingsManager.getActiveProvider() || DEFAULT_PROVIDER;
  const apiKey = settingsManager.getApiKey(providerName);
  return !!apiKey && apiKey.trim() !== "";
};

/**
 * Get available AI providers
 */
export const getProviders = (): string[] => {
  return getAvailableProviders();
};

/**
 * Get available models for a provider
 */
export const getModels = async (provider: string): Promise<string[]> => {
  try {
    const providerInstance = getProvider(provider);
    return await providerInstance.listAvailableModels();
  } catch (error) {
    console.error(`Error getting models for ${provider}:`, error);
    return [];
  }
};

/**
 * Get a task by ID
 */
export const getTask = (taskId: string): Task | undefined => {
  return taskManager.getTask(taskId);
};

/**
 * Get all tasks
 */
export const getAllTasks = (): Task[] => {
  return taskManager.getAllTasks();
};

/**
 * Export code to a file
 */
export const exportCode = async (code: string, options: ExportOptions): Promise<boolean> => {
  return exportManager.exportCode(code, options);
};

/**
 * Deploy code
 */
export const deployCode = async (code: string, options: DeployOptions): Promise<boolean> => {
  return exportManager.deployCode(code, options);
};

/**
 * Export structured response as HTML file
 */
export const exportAsHTML = (response: StructuredResponse): Blob => {
  const html = generateStandaloneHtml(response);
  return new Blob([html], { type: 'text/html' });
};

/**
 * Export structured response as ZIP archive
 */
export const exportAsZIP = async (response: StructuredResponse): Promise<Blob> => {
  return await createCodeArchive(response);
};

/**
 * Generate a follow-up prompt with context
 */
export const generateFollowUpPrompt = (
  sessionId: string,
  prompt: string,
  action: EditAction,
  target: EditTarget
): AIPrompt => {
  return sessionManager.generateFollowUpPrompt(sessionId, prompt, action, target);
};

/**
 * Analyze a prompt to determine the likely action and target
 */
export const analyzePromptIntent = (prompt: string): { action: EditAction, target: EditTarget } => {
  return sessionManager.analyzePromptIntent(prompt);
};

/**
 * Get session manager singleton
 */
export const getSessionManager = () => sessionManager;

/**
 * Get settings manager singleton
 */
export const getSettingsManager = () => settingsManager;

/**
 * Get model router singleton
 */
export const getModelRouter = () => modelRouter;

/**
 * Set the routing strategy
 */
export const setRoutingStrategy = (strategy: RoutingStrategy): void => {
  modelRouter.setRoutingStrategy(strategy);
};

/**
 * Set routing options
 */
export const setRoutingOptions = (options: Partial<RoutingOptions>): void => {
  modelRouter.setRoutingOptions(options);
};

/**
 * Get current routing options
 */
export const getRoutingOptions = (): RoutingOptions => {
  return modelRouter.getRoutingOptions();
};
