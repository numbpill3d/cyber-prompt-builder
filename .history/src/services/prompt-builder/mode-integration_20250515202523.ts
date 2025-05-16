/**
 * Mode Integration with Prompt Builder
 * Connects the Mode system with the Prompt Builder to apply mode-specific templates
 */

import { modeService } from '../mode/mode-service';
import { Mode } from '../mode/mode-types';
import {
  builder,
  createSystemPrompt,
  createTaskInstruction,
  createUserPreferences,
  LayerPriority
} from './index';
import { ResponseFormat, ResponseTone } from './layers/user-preferences-layer';

/**
 * Apply mode to prompt builder
 * Sets up the prompt builder with the current mode's settings
 */
export function applyModeToPromptBuilder(): void {
  const activeMode = modeService.getActiveMode();

  if (!activeMode) {
    console.warn('No active mode found, using default settings');
    return;
  }

  // Clear existing layers
  builder.clearLayers();

  // Apply system prompt from mode
  createSystemPrompt(activeMode.systemPrompt);

  // Create user preferences layer and set preferences
  const prefsId = createUserPreferences();

  // Set preferences directly through the preferences layer API
  // instead of trying to modify the layer content directly
  const { tone, format, includeExplanations, includeExamples, customInstructions } = activeMode.userPreferences;

  // Apply preferences through the prompt builder API
  const layer = builder.getLayer(prefsId);
  if (layer) {
    layer.setContent(JSON.stringify({
      tone,
      format,
      includeExplanations,
      includeExamples,
      customInstructions
    }));
  }

  console.log(`Applied mode "${activeMode.name}" to prompt builder`);
}

/**
 * Create a task instruction with mode-specific context
 * @param taskContent The task instruction content
 * @returns The layer ID
 */
export function createModeAwareTaskInstruction(taskContent: string): string {
  const activeMode = modeService.getActiveMode();

  // Create task instruction layer
  const taskId = createTaskInstruction(taskContent);

  // Add mode-specific context if available
  if (activeMode && activeMode.customSettings?.taskPrefix) {
    const layer = builder.getLayer(taskId);
    if (layer) {
      const currentContent = layer.getContent();
      const updatedContent = `${activeMode.customSettings.taskPrefix}\n\n${currentContent}`;
      layer.setContent(updatedContent);
    }
  }

  return taskId;
}

/**
 * Build a complete prompt with mode-specific settings
 * @param options Configuration options
 */
export function buildModeAwarePrompt(options: {
  taskInstruction: string;
  additionalContext?: string;
  codeContext?: string;
  language?: string;
  targetFramework?: string;
}): string {
  // Apply current mode settings
  applyModeToPromptBuilder();

  // Get active mode
  const activeMode = modeService.getActiveMode();

  // Create task instruction
  const taskId = createModeAwareTaskInstruction(options.taskInstruction);

  // Get the task layer
  const taskLayer = builder.getLayer(taskId);
  if (taskLayer) {
    // Add language-specific context if provided
    if (options.language) {
      const currentContent = taskLayer.getContent();
      const updatedContent = `${currentContent}\n\nTarget language: ${options.language}`;
      taskLayer.setContent(updatedContent);
    }

    // Add framework-specific context if provided
    if (options.targetFramework) {
      const currentContent = taskLayer.getContent();
      const updatedContent = `${currentContent}\n\nTarget framework: ${options.targetFramework}`;
      taskLayer.setContent(updatedContent);
    }
  }

  // Add code context if provided
  if (options.codeContext) {
    const contextId = builder.createLayer('code_context',
      `Relevant code context:\n\`\`\`\n${options.codeContext}\n\`\`\``);

    // Set priority through the layer API
    const contextLayer = builder.getLayer(contextId);
    if (contextLayer) {
      contextLayer.update({ priority: LayerPriority.HIGH });
    }
  }

  // Add additional context if provided
  if (options.additionalContext) {
    const contextId = builder.createLayer('context', options.additionalContext);

    // Set priority through the layer API
    const contextLayer = builder.getLayer(contextId);
    if (contextLayer) {
      contextLayer.update({ priority: LayerPriority.MEDIUM });
    }
  }

  // Add mode-specific behavior instructions
  if (activeMode) {
    // Add mode-specific behavior based on mode type
    switch (activeMode.id) {
      case 'code':
        addCodeModeInstructions();
        break;
      case 'architect':
        addArchitectModeInstructions();
        break;
      case 'ask':
        addAskModeInstructions();
        break;
      case 'devops':
        addDevOpsModeInstructions();
        break;
      case 'debug':
        addDebugModeInstructions();
        break;
      case 'test':
        addTestModeInstructions();
        break;
      default:
        // For custom modes, check if they have specific behavior settings
        if (activeMode.customSettings?.behaviorInstructions) {
          const behaviorId = builder.createLayer('behavior',
            activeMode.customSettings.behaviorInstructions);

          // Set priority through the layer API
          const behaviorLayer = builder.getLayer(behaviorId);
          if (behaviorLayer) {
            behaviorLayer.update({ priority: LayerPriority.CRITICAL });
          }
        }
    }
  }

  // Compose the prompt
  const composedPrompt = builder.compose();

  return composedPrompt.text;
}

/**
 * Add Code Mode specific instructions
 */
function addCodeModeInstructions(): void {
  const instructions = `
Focus on writing clean, maintainable, and efficient code.
- Prioritize readability and maintainability
- Include appropriate error handling
- Add helpful comments to explain complex logic
- Follow best practices for the target language
- Consider performance implications
- Ensure proper input validation
- Use consistent naming conventions
- Structure code in a modular way
`;

  const behaviorId = builder.createLayer('behavior', instructions);
  builder.setLayerPriority(behaviorId, 70); // High priority
}

/**
 * Add Architect Mode specific instructions
 */
function addArchitectModeInstructions(): void {
  const instructions = `
Focus on system design, architecture, and structure.
- Consider scalability and maintainability
- Suggest appropriate design patterns
- Provide directory structure recommendations
- Consider separation of concerns
- Explain architectural decisions and trade-offs
- Think about system boundaries and interfaces
- Consider deployment and infrastructure implications
- Recommend appropriate technologies and frameworks
`;

  const behaviorId = builder.createLayer('behavior', instructions);
  builder.setLayerPriority(behaviorId, 70); // High priority
}

/**
 * Add Ask Mode specific instructions
 */
function addAskModeInstructions(): void {
  const instructions = `
Focus on explaining concepts and answering questions clearly.
- Provide thorough explanations
- Break down complex concepts into simpler parts
- Use examples to illustrate points
- Consider the user's level of expertise
- Cite sources or references when appropriate
- Offer multiple perspectives when relevant
- Highlight important caveats or limitations
- Suggest follow-up questions or areas to explore
`;

  const behaviorId = builder.createLayer('behavior', instructions);
  builder.setLayerPriority(behaviorId, 70); // High priority
}

/**
 * Add DevOps Mode specific instructions
 */
function addDevOpsModeInstructions(): void {
  const instructions = `
Focus on deployment, infrastructure, and automation.
- Prioritize security and reliability
- Provide detailed configuration examples
- Consider scalability and performance
- Explain infrastructure decisions and trade-offs
- Focus on automation and CI/CD best practices
- Consider monitoring and observability
- Suggest appropriate cloud services and tools
- Include error handling and recovery strategies
`;

  const behaviorId = builder.createLayer('behavior', instructions);
  builder.setLayerPriority(behaviorId, 70); // High priority
}

/**
 * Add Debug Mode specific instructions
 */
function addDebugModeInstructions(): void {
  const instructions = `
Focus on identifying and fixing issues.
- Analyze problems methodically
- Suggest debugging strategies and tools
- Consider edge cases and error conditions
- Provide step-by-step troubleshooting approaches
- Explain the root causes of issues
- Suggest both quick fixes and long-term solutions
- Consider performance implications
- Recommend testing strategies to verify fixes
`;

  const behaviorId = builder.createLayer('behavior', instructions);
  builder.setLayerPriority(behaviorId, 70); // High priority
}

/**
 * Add Test Mode specific instructions
 */
function addTestModeInstructions(): void {
  const instructions = `
Focus on testing and quality assurance.
- Create comprehensive test cases
- Consider edge cases and failure scenarios
- Suggest appropriate testing frameworks and tools
- Balance unit, integration, and end-to-end tests
- Focus on test maintainability and readability
- Consider test performance and efficiency
- Suggest mocking strategies when appropriate
- Include both positive and negative test cases
`;

  const behaviorId = builder.createLayer('behavior', instructions);
  builder.setLayerPriority(behaviorId, 70); // High priority
}

/**
 * Subscribe to mode changes to update prompt builder
 */
export function initializeModeIntegration(): void {
  // Apply current mode on initialization
  applyModeToPromptBuilder();

  // Subscribe to mode changes
  modeService.onModeChange((event) => {
    console.log(`Mode changed from ${event.previousMode} to ${event.currentMode}`);
    applyModeToPromptBuilder();
  });
}

/**
 * Get mode-specific prompt template
 * @param modeId The mode ID to get template for (defaults to active mode)
 */
export function getModePromptTemplate(modeId?: string): string {
  const mode = modeId
    ? modeService.getMode(modeId)
    : modeService.getActiveMode();

  if (!mode) {
    return 'You are a helpful AI assistant.';
  }

  return mode.systemPrompt;
}

/**
 * Get mode-specific user preferences
 * @param modeId The mode ID to get preferences for (defaults to active mode)
 */
export function getModeUserPreferences(modeId?: string): {
  tone: ResponseTone;
  format: ResponseFormat;
  includeExplanations: boolean;
  includeExamples: boolean;
  customInstructions?: string;
} {
  const mode = modeId
    ? modeService.getMode(modeId)
    : modeService.getActiveMode();

  if (!mode) {
    return {
      tone: ResponseTone.BALANCED,
      format: ResponseFormat.DEFAULT,
      includeExplanations: true,
      includeExamples: false
    };
  }

  return mode.userPreferences;
}
