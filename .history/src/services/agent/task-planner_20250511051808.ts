/**
 * Task Planner
 * Advanced task planning and decomposition for AI coding tasks
 */

import { AIPrompt, AIResponse } from '../providers/index';
import { getProvider } from '../providers/providers';
import { modelRouter } from '../model-router';
import { settingsManager } from '../settings-manager';
import { parseResponse, StructuredResponse } from '../response-handler';
import { Task, TaskStep } from './task-manager';

// Types of task components that can be generated
export type TaskComponentType = 
  'html' | 'css' | 'js' | 'api' | 'database' | 'auth' | 
  'validation' | 'animation' | 'responsive' | 'layout' | 
  'form' | 'navigation' | 'state' | 'data' | 'ui' | 'testing';

// Task complexity options
export type TaskComplexity = 'simple' | 'medium' | 'complex';
export type TaskComplexityOption = TaskComplexity | 'auto';

// A step plan for completing a complex task
export interface TaskPlan {
  id: string;
  title: string;
  description: string;
  steps: PlannedStep[];
  complexity: TaskComplexity;
  estimatedDuration: string; // e.g., "5-10 minutes"
  components: TaskComponentType[];
}

// A planned step in the task plan
export interface PlannedStep {
  id: string;
  title: string;
  description: string;
  prompt: string; // The prompt to send to the AI to complete this step
  dependencies: string[]; // IDs of steps that must be completed before this one
  optional: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  componentType: TaskComponentType[];
  response?: StructuredResponse;
}

// Suggestion for next steps after a generation
export interface NextStepSuggestion {
  id: string;
  title: string;
  description: string;
  prompt: string;
  relevance: 'high' | 'medium' | 'low'; // How relevant this suggestion is
  componentType: TaskComponentType;
}

/**
 * TaskPlanner class for advanced task planning and decomposition
 */
export class TaskPlanner {
  /**
   * Analyze a prompt and decompose it into a task plan
   */
  async decomposeTask(
    prompt: string, 
    provider: string,
    options: {
      complexity?: TaskComplexityOption;
      components?: TaskComponentType[];
    } = {}
  ): Promise<TaskPlan> {
    // Get API key
    const apiKey = settingsManager.getApiKey(provider);
    if (!apiKey) {
      throw new Error(`API key not configured for ${provider}`);
    }
    
    // Get the preferred model
    const model = settingsManager.getPreferredModel(provider);
    
    // Determine complexity if set to auto
    const resolvedComplexity: TaskComplexity = options.complexity === 'auto' 
      ? this.determineTaskComplexity(prompt)
      : (options.complexity as TaskComplexity) || 'medium';
    
    // Create special planning prompt
    const planningPrompt: AIPrompt = {
      content: `I need you to break down this coding task into logical steps: "${prompt}"

Please format your response exactly as follows (as valid JSON):
{
  "title": "Short, descriptive title for the task",
  "description": "Brief overview of what we're building",
  "complexity": "${resolvedComplexity}",
  "estimatedDuration": "Estimated time to complete (e.g., '10-15 minutes')",
  "components": ["list", "of", "technical", "components", "involved"],
  "steps": [
    {
      "title": "Step 1 title",
      "description": "Detailed description of step 1",
      "prompt": "The exact prompt to send to the AI to complete this step",
      "dependencies": [], 
      "optional": false,
      "componentType": ["component", "types", "for", "this", "step"]
    },
    // more steps...
  ]
}

The JSON must be valid. Each step should be focused on one aspect of the task. The 'prompt' field for each step should be detailed enough for an AI to generate the correct code.`
    };
    
    // Get provider instance
    const providerInstance = getProvider(provider);
    
    // Generate task plan
    const planningResult = await providerInstance.generateCode(planningPrompt, {
      apiKey,
      model,
      temperature: 0.2, // Use low temperature for more deterministic results
      maxTokens: 2000
    });
    
    try {
      // Extract JSON from the response
      const planText = this.extractJSON(planningResult.code);
      const planData = JSON.parse(planText);
      
      // Generate unique IDs for the plan and steps
      const planId = this.generateId('plan');
      const steps = planData.steps.map((step: any, index: number) => ({
        id: this.generateId('step'),
        title: step.title,
        description: step.description,
        prompt: step.prompt,
        dependencies: step.dependencies || [],
        optional: step.optional || false,
        status: 'pending',
        componentType: step.componentType || [],
        order: index
      }));
      
      return {
        id: planId,
        title: planData.title,
        description: planData.description,
        steps,
        complexity: planData.complexity || resolvedComplexity,
        estimatedDuration: planData.estimatedDuration || "Unknown",
        components: planData.components || []
      };
    } catch (error) {
      console.error('Error parsing task plan:', error);
      
      // Fallback to a simple plan
      return this.createSimpleFallbackPlan(prompt, resolvedComplexity);
    }
  }
  
  /**
   * Extract JSON from a string that might contain other text
   */
  private extractJSON(text: string): string {
    // Try to find JSON object in the response
    const jsonRegex = /{[\s\S]*}/g;
    const jsonMatches = text.match(jsonRegex);
    
    if (jsonMatches && jsonMatches.length > 0) {
      return jsonMatches[0];
    }
    
    throw new Error('Could not extract JSON from response');
  }
  
  /**
   * Create a simple fallback plan when decomposition fails
   */
  private createSimpleFallbackPlan(prompt: string, complexity: TaskComplexity): TaskPlan {
    const planId = this.generateId('plan');
    
    let steps: PlannedStep[];
    
    if (complexity === 'simple') {
      // For simple tasks, just one step
      steps = [{
        id: this.generateId('step'),
        title: 'Complete task',
        description: 'Generate the complete solution',
        prompt: prompt,
        dependencies: [],
        optional: false,
        status: 'pending',
        componentType: ['html', 'css', 'js']
      }];
    } else {
      // For medium/complex tasks, break into common web development steps
      steps = [
        {
          id: this.generateId('step'),
          title: 'HTML Structure',
          description: 'Create the basic HTML structure',
          prompt: `Create the HTML structure for: ${prompt}. Focus only on the HTML at this point.`,
          dependencies: [],
          optional: false,
          status: 'pending',
          componentType: ['html', 'layout']
        },
        {
          id: this.generateId('step'),
          title: 'CSS Styling',
          description: 'Add styling to the HTML structure',
          prompt: `Create the CSS styling for: ${prompt}. Make it look professional and modern.`,
          dependencies: [this.generateId('step')], // This is a placeholder; will be fixed below
          optional: false,
          status: 'pending',
          componentType: ['css']
        },
        {
          id: this.generateId('step'),
          title: 'JavaScript Functionality',
          description: 'Add interactivity and functionality',
          prompt: `Create the JavaScript functionality for: ${prompt}. Implement all interactive features.`,
          dependencies: [this.generateId('step')], // This is a placeholder; will be fixed below
          optional: false,
          status: 'pending',
          componentType: ['js']
        },
        {
          id: this.generateId('step'),
          title: 'Testing and Refinement',
          description: 'Test and refine the solution',
          prompt: `Review the code for: ${prompt}. Fix any bugs and suggest improvements.`,
          dependencies: [], // Will be filled in with actual IDs
          optional: true,
          status: 'pending',
          componentType: ['testing']
        }
      ];
      
      // Fix the dependencies now that we have the actual step IDs
      steps[1].dependencies = [steps[0].id];
      steps[2].dependencies = [steps[0].id];
      steps[3].dependencies = [steps[0].id, steps[1].id, steps[2].id];
    }
    
    return {
      id: planId,
      title: `Plan for: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
      description: prompt,
      steps,
      complexity,
      estimatedDuration: complexity === 'simple' ? '5-10 minutes' : '15-30 minutes',
      components: ['html', 'css', 'js']
    };
  }
  
  /**
   * Determine the complexity of a task based on the prompt
   */
  private determineTaskComplexity(prompt: string): TaskComplexity {
    // Simple heuristic based on prompt length and complexity indicators
    const length = prompt.length;
    const words = prompt.split(/\s+/).length;
    
    // Check for complex terms
    const complexTerms = [
      'authentication', 'database', 'api', 'security', 'optimization',
      'responsive', 'animation', 'validation', 'state management', 'real-time',
      'multi-step', 'complex', 'advanced', 'sophisticated', 'integration'
    ];
    
    const complexTermCount = complexTerms.reduce((count, term) => {
      return count + (prompt.toLowerCase().includes(term) ? 1 : 0);
    }, 0);
    
    // Determine complexity
    if (words > 50 || complexTermCount >= 3) {
      return 'complex';
    } else if (words > 20 || complexTermCount >= 1) {
      return 'medium';
    } else {
      return 'simple';
    }
  }
  
  /**
   * Generate suggestions for next steps
   */
  async generateNextStepSuggestions(
    task: Task,
    response: StructuredResponse,
    provider: string
  ): Promise<NextStepSuggestion[]> {
    // Get API key
    const apiKey = settingsManager.getApiKey(provider);
    if (!apiKey) {
      throw new Error(`API key not configured for ${provider}`);
    }
    
    // Get the preferred model
    const model = settingsManager.getPreferredModel(provider);
    
    // Create a prompt for suggesting next steps
    const suggestionsPrompt: AIPrompt = {
      content: `Based on the following task and the most recent code generation, suggest 3 possible next steps the user might want to take.

ORIGINAL TASK:
${task.prompt}

GENERATED CODE INCLUDES:
${Object.keys(response.codeBlocks).map(lang => `- ${lang.toUpperCase()}`).join('\n')}

Please format your response as valid JSON:
[
  {
    "title": "Brief title",
    "description": "More detailed description explaining why this is useful",
    "prompt": "The exact prompt the user would give to implement this next step",
    "relevance": "high|medium|low",
    "componentType": "related technical component"
  },
  // more suggestions...
]

Ensure suggestions are specific and genuinely useful next steps, not generic advice.`
    };
    
    // Get provider instance
    const providerInstance = getProvider(provider);
    
    // Generate suggestions
    const suggestionsResult = await providerInstance.generateCode(suggestionsPrompt, {
      apiKey,
      model,
      temperature: 0.7, // Higher temperature for diverse suggestions
      maxTokens: 1000
    });
    
    try {
      // Extract JSON from the response
      const suggestionsText = this.extractJSON(suggestionsResult.code);
      const suggestionsData = JSON.parse(suggestionsText);
      
      // Generate unique IDs for the suggestions
      return suggestionsData.map((suggestion: any) => ({
        id: this.generateId('suggestion'),
        title: suggestion.title,
        description: suggestion.description,
        prompt: suggestion.prompt,
        relevance: suggestion.relevance || 'medium',
        componentType: suggestion.componentType || 'unknown'
      }));
    } catch (error) {
      console.error('Error generating next step suggestions:', error);
      
      // Return a fallback suggestion
      return [{
        id: this.generateId('suggestion'),
        title: 'Improve functionality',
        description: 'Enhance the current implementation with additional features',
        prompt: `Enhance the current implementation by adding more features and functionality.`,
        relevance: 'medium',
        componentType: 'js'
      }];
    }
  }
  
  /**
   * Execute a step in the task plan
   */
  async executeStep(
    step: PlannedStep,
    task: Task,
    provider: string,
    previousResponses: StructuredResponse[]
  ): Promise<StructuredResponse> {
    // Get API key
    const apiKey = settingsManager.getApiKey(provider);
    if (!apiKey) {
      throw new Error(`API key not configured for ${provider}`);
    }
    
    // Get the preferred model
    const model = settingsManager.getPreferredModel(provider);
    
    // Build context from previous responses
    let context = '';
    if (previousResponses.length > 0) {
      context = 'Previously generated code:\n\n';
      
      // Add code from previous steps
      previousResponses.forEach((resp, index) => {
        Object.entries(resp.codeBlocks).forEach(([lang, code]) => {
          context += `Step ${index + 1} - ${lang.toUpperCase()} code:\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
        });
      });
    }
    
    // Create prompt with step information
    const stepPrompt: AIPrompt = {
      content: step.prompt,
      context: context
    };
    
    // Get provider instance
    const providerInstance = getProvider(provider);
    
    // Execute the step
    const stepResult = await providerInstance.generateCode(stepPrompt, {
      apiKey,
      model,
      temperature: 0.3, // Lower temperature for more focused results
      maxTokens: 4000
    });
    
    // Parse the response
    const parsedResponse = parseResponse(stepResult, {
      model,
      provider,
      cost: 0, // Will be updated later
      tokens: {
        input: Math.ceil((stepPrompt.content.length + (stepPrompt.context?.length || 0)) / 4),
        output: Math.ceil(stepResult.code.length / 4),
        total: 0 // Will be calculated
      },
      duration: 0,
      timestamp: Date.now()
    });
    
    // Update tokens total
    parsedResponse.meta.tokens.total = 
      parsedResponse.meta.tokens.input + parsedResponse.meta.tokens.output;
    
    // Estimate cost
    try {
      const costEstimate = await providerInstance.estimateCost(stepPrompt, {
        apiKey,
        model,
        maxTokens: parsedResponse.meta.tokens.output
      });
      parsedResponse.meta.cost = costEstimate.totalCost;
    } catch (error) {
      console.error('Error estimating cost:', error);
    }
    
    return parsedResponse;
  }
  
  /**
   * Generate a unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Export a singleton instance
export const taskPlanner = new TaskPlanner();