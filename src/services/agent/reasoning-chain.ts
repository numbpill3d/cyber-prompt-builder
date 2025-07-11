/**
 * Advanced Reasoning Chain
 * Implements sophisticated chain-of-thought reasoning with self-reflection and critique
 */

import { AIPrompt, AIResponse } from '../providers/index';
import { getProvider } from '../providers/providers';
import { settingsManager } from '../settings-manager';
import { StructuredResponse } from '../response-handler';

export interface ReasoningStep {
  id: string;
  type: 'analysis' | 'hypothesis' | 'validation' | 'synthesis' | 'critique' | 'refinement';
  description: string;
  input: string;
  reasoning: string;
  output: string;
  confidence: number;
  dependencies: string[];
  timestamp: number;
  metadata: Record<string, any>;
}

export interface ReasoningChain {
  id: string;
  goal: string;
  context: string;
  steps: ReasoningStep[];
  currentStepIndex: number;
  status: 'planning' | 'reasoning' | 'reflecting' | 'completed' | 'failed';
  finalConclusion?: string;
  confidenceScore: number;
  alternativeApproaches: string[];
  critiques: Critique[];
  improvements: string[];
  startTime: number;
  endTime?: number;
}

export interface Critique {
  id: string;
  stepId: string;
  type: 'logical_flaw' | 'missing_consideration' | 'bias_detection' | 'improvement_suggestion';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion: string;
  confidence: number;
}

export interface ReasoningStrategy {
  name: string;
  description: string;
  stepTypes: ReasoningStep['type'][];
  prompts: Record<string, string>;
  criteriaMet: (context: string, goal: string) => boolean;
}

/**
 * Advanced Reasoning Chain Engine
 */
export class ReasoningChainEngine {
  private chains: Map<string, ReasoningChain> = new Map();
  private strategies: Map<string, ReasoningStrategy> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Start a new reasoning chain
   */
  async startReasoningChain(
    goal: string,
    context: string,
    options: {
      strategy?: string;
      maxSteps?: number;
      enableSelfCritique?: boolean;
      provider?: string;
    } = {}
  ): Promise<ReasoningChain> {
    const chainId = this.generateId('chain');
    const strategy = this.selectStrategy(goal, context, options.strategy);
    
    const chain: ReasoningChain = {
      id: chainId,
      goal,
      context,
      steps: [],
      currentStepIndex: 0,
      status: 'planning',
      confidenceScore: 0,
      alternativeApproaches: [],
      critiques: [],
      improvements: [],
      startTime: Date.now()
    };

    this.chains.set(chainId, chain);

    // Generate initial reasoning plan
    await this.generateReasoningPlan(chain, strategy, options);
    
    // Start executing the reasoning chain
    if (options.enableSelfCritique !== false) {
      await this.executeReasoningChain(chainId, options);
    }

    return chain;
  }

  /**
   * Generate a reasoning plan based on the goal and strategy
   */
  private async generateReasoningPlan(
    chain: ReasoningChain,
    strategy: ReasoningStrategy,
    options: any
  ): Promise<void> {
    const provider = options.provider || settingsManager.getActiveProvider();
    const apiKey = settingsManager.getApiKey(provider);
    
    if (!apiKey) {
      throw new Error(`API key not configured for ${provider}`);
    }

    const planningPrompt: AIPrompt = {
      content: `Create a detailed reasoning plan for the following goal:

GOAL: ${chain.goal}
CONTEXT: ${chain.context}
STRATEGY: ${strategy.name} - ${strategy.description}

Generate a step-by-step reasoning plan that follows this structure:
1. Analysis - Break down the problem and identify key components
2. Hypothesis - Form initial hypotheses or approaches
3. Validation - Test and validate the hypotheses
4. Synthesis - Combine insights into a coherent solution
5. Critique - Identify potential flaws or improvements
6. Refinement - Improve the solution based on critique

For each step, provide:
- Clear description of what needs to be done
- Specific reasoning approach to use
- Expected output format
- Dependencies on previous steps

Format as JSON:
{
  "steps": [
    {
      "type": "analysis|hypothesis|validation|synthesis|critique|refinement",
      "description": "What this step accomplishes",
      "reasoning_approach": "How to approach this step",
      "expected_output": "What should be produced",
      "dependencies": ["step_ids_this_depends_on"]
    }
  ],
  "alternative_approaches": ["list", "of", "alternative", "methods"],
  "success_criteria": "How to measure success"
}`,
      systemPrompt: `You are an expert reasoning strategist. Your role is to create comprehensive, logical reasoning plans that lead to well-reasoned conclusions. Focus on:
- Systematic thinking and logical progression
- Identifying potential biases and blind spots
- Considering multiple perspectives and approaches
- Building in self-correction mechanisms
- Ensuring each step builds logically on previous ones`
    };

    const providerInstance = getProvider(provider);
    const planResult = await providerInstance.generateResponse(planningPrompt, {
      apiKey,
      model: settingsManager.getPreferredModel(provider),
      temperature: 0.3
    });

    try {
      const planData = this.extractJSON(planResult.content);
      const parsed = JSON.parse(planData);
      
      // Create reasoning steps from the plan
      chain.steps = parsed.steps.map((stepData: any, index: number) => ({
        id: this.generateId('step'),
        type: stepData.type,
        description: stepData.description,
        input: '',
        reasoning: stepData.reasoning_approach,
        output: '',
        confidence: 0,
        dependencies: stepData.dependencies || [],
        timestamp: Date.now(),
        metadata: {
          expectedOutput: stepData.expected_output,
          order: index
        }
      }));

      chain.alternativeApproaches = parsed.alternative_approaches || [];
      chain.status = 'reasoning';
      
    } catch (error) {
      console.error('Error parsing reasoning plan:', error);
      // Fallback to default plan
      this.createDefaultReasoningPlan(chain);
    }
  }

  /**
   * Execute the reasoning chain step by step
   */
  private async executeReasoningChain(
    chainId: string,
    options: any
  ): Promise<void> {
    const chain = this.chains.get(chainId);
    if (!chain) return;

    const maxSteps = options.maxSteps || 10;
    let stepCount = 0;

    while (chain.currentStepIndex < chain.steps.length && stepCount < maxSteps) {
      const currentStep = chain.steps[chain.currentStepIndex];
      
      // Check dependencies
      if (!this.areDependenciesMet(currentStep, chain.steps)) {
        chain.status = 'failed';
        throw new Error(`Dependencies not met for step: ${currentStep.description}`);
      }

      // Execute the step
      await this.executeReasoningStep(chain, currentStep, options);
      
      // Self-critique if enabled
      if (options.enableSelfCritique !== false) {
        await this.performSelfCritique(chain, currentStep, options);
      }

      chain.currentStepIndex++;
      stepCount++;
    }

    // Finalize the reasoning chain
    await this.finalizeReasoningChain(chain, options);
  }

  /**
   * Execute a single reasoning step
   */
  private async executeReasoningStep(
    chain: ReasoningChain,
    step: ReasoningStep,
    options: any
  ): Promise<void> {
    const provider = options.provider || settingsManager.getActiveProvider();
    const apiKey = settingsManager.getApiKey(provider);
    
    // Build context from previous steps
    const previousContext = this.buildStepContext(chain, step);
    
    const stepPrompt: AIPrompt = {
      content: `Execute this reasoning step:

OVERALL GOAL: ${chain.goal}
STEP TYPE: ${step.type}
STEP DESCRIPTION: ${step.description}
REASONING APPROACH: ${step.reasoning}
EXPECTED OUTPUT: ${step.metadata.expectedOutput}

PREVIOUS CONTEXT:
${previousContext}

CURRENT TASK:
${this.getStepPrompt(step.type, chain.goal, step.description)}

Provide your reasoning in this format:
1. **Analysis**: Your detailed analysis of the current step
2. **Reasoning Process**: Step-by-step logical reasoning
3. **Conclusion**: Your conclusion for this step
4. **Confidence**: Rate your confidence (0-1) and explain why
5. **Next Considerations**: What should be considered in subsequent steps`,
      
      systemPrompt: `You are an expert reasoner executing a specific step in a logical reasoning chain. Focus on:
- Clear, systematic thinking
- Explicit reasoning processes
- Identifying assumptions and limitations
- Providing well-justified conclusions
- Maintaining logical consistency with previous steps`
    };

    const providerInstance = getProvider(provider);
    const stepResult = await providerInstance.generateResponse(stepPrompt, {
      apiKey,
      model: settingsManager.getPreferredModel(provider),
      temperature: 0.4
    });

    // Parse and store the step result
    step.input = previousContext;
    step.output = stepResult.content;
    step.confidence = this.extractConfidence(stepResult.content);
    step.timestamp = Date.now();
  }

  /**
   * Perform self-critique on a reasoning step
   */
  private async performSelfCritique(
    chain: ReasoningChain,
    step: ReasoningStep,
    options: any
  ): Promise<void> {
    const provider = options.provider || settingsManager.getActiveProvider();
    const apiKey = settingsManager.getApiKey(provider);

    const critiquePrompt: AIPrompt = {
      content: `Critically evaluate this reasoning step:

STEP TYPE: ${step.type}
STEP DESCRIPTION: ${step.description}
REASONING OUTPUT: ${step.output}
CONFIDENCE: ${step.confidence}

Analyze this step for:
1. **Logical Consistency**: Are there any logical flaws or contradictions?
2. **Completeness**: What important considerations might be missing?
3. **Bias Detection**: Are there any cognitive biases affecting the reasoning?
4. **Alternative Perspectives**: What other viewpoints should be considered?
5. **Improvement Opportunities**: How could this reasoning be strengthened?

Format your critique as JSON:
{
  "critiques": [
    {
      "type": "logical_flaw|missing_consideration|bias_detection|improvement_suggestion",
      "severity": "low|medium|high|critical",
      "description": "What is the issue?",
      "suggestion": "How to address it?",
      "confidence": 0.8
    }
  ],
  "overall_assessment": "Summary of the step's quality",
  "improvement_priority": "What should be improved first?"
}`,
      
      systemPrompt: `You are a critical reasoning evaluator. Your job is to identify flaws, biases, and improvement opportunities in reasoning processes. Be thorough but constructive in your critique.`
    };

    const providerInstance = getProvider(provider);
    const critiqueResult = await providerInstance.generateResponse(critiquePrompt, {
      apiKey,
      model: settingsManager.getPreferredModel(provider),
      temperature: 0.3
    });

    try {
      const critiqueData = this.extractJSON(critiqueResult.content);
      const parsed = JSON.parse(critiqueData);
      
      // Add critiques to the chain
      for (const critiqueItem of parsed.critiques || []) {
        const critique: Critique = {
          id: this.generateId('critique'),
          stepId: step.id,
          type: critiqueItem.type,
          severity: critiqueItem.severity,
          description: critiqueItem.description,
          suggestion: critiqueItem.suggestion,
          confidence: critiqueItem.confidence || 0.7
        };
        
        chain.critiques.push(critique);
      }

      // If there are critical issues, attempt to refine the step
      const criticalIssues = chain.critiques.filter(c => 
        c.stepId === step.id && c.severity === 'critical'
      );
      
      if (criticalIssues.length > 0) {
        await this.refineReasoningStep(chain, step, criticalIssues, options);
      }
      
    } catch (error) {
      console.error('Error parsing critique:', error);
    }
  }

  /**
   * Refine a reasoning step based on critiques
   */
  private async refineReasoningStep(
    chain: ReasoningChain,
    step: ReasoningStep,
    critiques: Critique[],
    options: any
  ): Promise<void> {
    const provider = options.provider || settingsManager.getActiveProvider();
    const apiKey = settingsManager.getApiKey(provider);

    const refinementPrompt: AIPrompt = {
      content: `Refine this reasoning step based on the identified critiques:

ORIGINAL STEP OUTPUT: ${step.output}
CRITIQUES TO ADDRESS:
${critiques.map(c => `- ${c.description}: ${c.suggestion}`).join('\n')}

Provide an improved version that addresses these critiques while maintaining the core reasoning. Focus on:
1. Fixing logical flaws
2. Adding missing considerations
3. Reducing bias
4. Strengthening the overall argument

Format your response as:
**REFINED REASONING**: [Your improved reasoning]
**CHANGES MADE**: [What you changed and why]
**REMAINING LIMITATIONS**: [Any limitations that still exist]`,
      
      systemPrompt: `You are refining reasoning based on constructive critique. Maintain the core logic while addressing the identified issues.`
    };

    const providerInstance = getProvider(provider);
    const refinementResult = await providerInstance.generateResponse(refinementPrompt, {
      apiKey,
      model: settingsManager.getPreferredModel(provider),
      temperature: 0.3
    });

    // Update the step with refined output
    step.output = refinementResult.content;
    step.metadata.refined = true;
    step.metadata.originalOutput = step.output;
    step.timestamp = Date.now();
  }

  /**
   * Finalize the reasoning chain with a comprehensive conclusion
   */
  private async finalizeReasoningChain(
    chain: ReasoningChain,
    options: any
  ): Promise<void> {
    const provider = options.provider || settingsManager.getActiveProvider();
    const apiKey = settingsManager.getApiKey(provider);

    const finalizationPrompt: AIPrompt = {
      content: `Synthesize the complete reasoning chain into a final conclusion:

ORIGINAL GOAL: ${chain.goal}
CONTEXT: ${chain.context}

REASONING STEPS COMPLETED:
${chain.steps.map((step, i) => 
  `${i + 1}. ${step.type.toUpperCase()}: ${step.description}\n   Output: ${step.output.substring(0, 200)}...`
).join('\n\n')}

CRITIQUES IDENTIFIED:
${chain.critiques.map(c => `- ${c.description} (${c.severity})`).join('\n')}

Provide a comprehensive final conclusion that:
1. **Synthesizes** all reasoning steps into a coherent answer
2. **Addresses** the original goal completely
3. **Acknowledges** limitations and uncertainties
4. **Suggests** next steps or further considerations
5. **Rates** overall confidence in the conclusion

Format as:
**FINAL CONCLUSION**: [Your synthesized conclusion]
**CONFIDENCE LEVEL**: [0-1 with justification]
**KEY INSIGHTS**: [Most important insights gained]
**LIMITATIONS**: [What limitations exist]
**NEXT STEPS**: [Recommended follow-up actions]`,
      
      systemPrompt: `You are synthesizing a complete reasoning chain. Provide a comprehensive, well-reasoned conclusion that addresses the original goal.`
    };

    const providerInstance = getProvider(provider);
    const conclusionResult = await providerInstance.generateResponse(finalizationPrompt, {
      apiKey,
      model: settingsManager.getPreferredModel(provider),
      temperature: 0.2
    });

    chain.finalConclusion = conclusionResult.content;
    chain.confidenceScore = this.calculateOverallConfidence(chain);
    chain.status = 'completed';
    chain.endTime = Date.now();
  }

  /**
   * Get a reasoning chain by ID
   */
  getReasoningChain(chainId: string): ReasoningChain | undefined {
    return this.chains.get(chainId);
  }

  /**
   * Get all reasoning chains
   */
  getAllReasoningChains(): ReasoningChain[] {
    return Array.from(this.chains.values());
  }

  /**
   * Helper methods
   */
  private initializeStrategies(): void {
    // Problem-solving strategy
    this.strategies.set('problem_solving', {
      name: 'Problem Solving',
      description: 'Systematic approach to solving complex problems',
      stepTypes: ['analysis', 'hypothesis', 'validation', 'synthesis'],
      prompts: {},
      criteriaMet: (context, goal) => 
        goal.toLowerCase().includes('solve') || goal.toLowerCase().includes('problem')
    });

    // Decision-making strategy
    this.strategies.set('decision_making', {
      name: 'Decision Making',
      description: 'Structured approach to making informed decisions',
      stepTypes: ['analysis', 'hypothesis', 'validation', 'critique', 'synthesis'],
      prompts: {},
      criteriaMet: (context, goal) => 
        goal.toLowerCase().includes('decide') || goal.toLowerCase().includes('choose')
    });

    // Code analysis strategy
    this.strategies.set('code_analysis', {
      name: 'Code Analysis',
      description: 'Systematic code review and improvement',
      stepTypes: ['analysis', 'critique', 'refinement', 'validation'],
      prompts: {},
      criteriaMet: (context, goal) => 
        context.includes('code') || goal.toLowerCase().includes('code')
    });
  }

  private selectStrategy(goal: string, context: string, preferredStrategy?: string): ReasoningStrategy {
    if (preferredStrategy && this.strategies.has(preferredStrategy)) {
      return this.strategies.get(preferredStrategy)!;
    }

    // Auto-select based on criteria
    for (const strategy of this.strategies.values()) {
      if (strategy.criteriaMet(context, goal)) {
        return strategy;
      }
    }

    // Default to problem solving
    return this.strategies.get('problem_solving')!;
  }

  private createDefaultReasoningPlan(chain: ReasoningChain): void {
    chain.steps = [
      {
        id: this.generateId('step'),
        type: 'analysis',
        description: 'Analyze the problem and identify key components',
        input: '',
        reasoning: 'Break down the problem systematically',
        output: '',
        confidence: 0,
        dependencies: [],
        timestamp: Date.now(),
        metadata: { order: 0 }
      },
      {
        id: this.generateId('step'),
        type: 'hypothesis',
        description: 'Generate potential solutions or approaches',
        input: '',
        reasoning: 'Form testable hypotheses',
        output: '',
        confidence: 0,
        dependencies: [],
        timestamp: Date.now(),
        metadata: { order: 1 }
      },
      {
        id: this.generateId('step'),
        type: 'synthesis',
        description: 'Combine insights into a coherent solution',
        input: '',
        reasoning: 'Integrate findings logically',
        output: '',
        confidence: 0,
        dependencies: [],
        timestamp: Date.now(),
        metadata: { order: 2 }
      }
    ];
  }

  private areDependenciesMet(step: ReasoningStep, allSteps: ReasoningStep[]): boolean {
    return step.dependencies.every(depId => {
      const depStep = allSteps.find(s => s.id === depId);
      return depStep && depStep.output !== '';
    });
  }

  private buildStepContext(chain: ReasoningChain, currentStep: ReasoningStep): string {
    const completedSteps = chain.steps.filter((s, i) => 
      i < chain.currentStepIndex && s.output !== ''
    );

    if (completedSteps.length === 0) {
      return `Starting reasoning chain for: ${chain.goal}\nContext: ${chain.context}`;
    }

    return completedSteps.map((step, i) => 
      `Step ${i + 1} (${step.type}): ${step.description}\nResult: ${step.output.substring(0, 300)}...`
    ).join('\n\n');
  }

  private getStepPrompt(stepType: ReasoningStep['type'], goal: string, description: string): string {
    const prompts = {
      analysis: `Analyze the following goal and break it down into key components: ${goal}`,
      hypothesis: `Based on the analysis, generate potential hypotheses or approaches for: ${goal}`,
      validation: `Validate the proposed hypotheses or approaches for: ${goal}`,
      synthesis: `Synthesize the findings into a coherent solution for: ${goal}`,
      critique: `Critically evaluate the current reasoning and identify potential improvements`,
      refinement: `Refine and improve the current solution based on identified issues`
    };

    return prompts[stepType] || description;
  }

  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : '{}';
  }

  private extractConfidence(text: string): number {
    const confidenceMatch = text.match(/confidence[:\s]*([0-9.]+)/i);
    if (confidenceMatch) {
      return Math.min(1, Math.max(0, parseFloat(confidenceMatch[1])));
    }
    return 0.7; // Default confidence
  }

  private calculateOverallConfidence(chain: ReasoningChain): number {
    if (chain.steps.length === 0) return 0;
    
    const avgStepConfidence = chain.steps.reduce((sum, step) => sum + step.confidence, 0) / chain.steps.length;
    const criticalIssues = chain.critiques.filter(c => c.severity === 'critical').length;
    const confidencePenalty = criticalIssues * 0.1;
    
    return Math.max(0, avgStepConfidence - confidencePenalty);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Export singleton instance
export const reasoningChainEngine = new ReasoningChainEngine();