/**
 * Task Runner
 * Orchestrates the execution of multi-step AI coding tasks
 */

import { taskPlanner, TaskPlan, PlannedStep, NextStepSuggestion } from './task-planner';
import { Task } from './task-manager';
import { AIPrompt } from '../providers/index';
import { generateCode, GenerateCodeParams } from '../aiService';
import { StructuredResponse } from '../response-handler';
import { sessionManager, Session } from '../session-manager';
import { pluginManager } from '../plugin-system/plugin-manager';
import { settingsManager } from '../settings-manager';
import { modelRouter } from '../model-router';

// Status for a task execution
export type TaskRunStatus = 
  'preparing' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

// Events that can be emitted during task running
export type TaskRunnerEvent = 
  'plan-created' | 'step-started' | 'step-completed' | 'step-failed' | 
  'task-completed' | 'task-failed' | 'task-paused' | 'task-resumed' | 
  'suggestions-ready';

// Event handler type
export type TaskRunnerEventHandler = (
  event: TaskRunnerEvent, 
  data: any
) => void;

// Task run options
export interface TaskRunOptions {
  autoExecute?: boolean;
  provider?: string;
  complexity?: 'auto' | 'simple' | 'medium' | 'complex';
  includeExplanations?: boolean;
  maxStepsBeforePause?: number;
  sessionId?: string;
}

// TaskRun represents an instance of a running task
export interface TaskRun {
  id: string;
  plan: TaskPlan;
  sessionId: string;
  status: TaskRunStatus;
  currentStepIndex: number;
  startTime: number;
  endTime?: number;
  responses: Record<string, StructuredResponse>;
  error?: string;
  nextStepSuggestions?: NextStepSuggestion[];
}

/**
 * TaskRunner orchestrates the execution of multi-step AI tasks
 */
export class TaskRunner {
  private runs: Map<string, TaskRun> = new Map();
  private eventHandlers: Set<TaskRunnerEventHandler> = new Set();
  
  /**
   * Start a new task run based on a prompt
   */
  async startRun(
    prompt: string,
    options: TaskRunOptions = {}
  ): Promise<TaskRun> {
    try {
      // Emit event for plan creation start
      this.emitEvent('plan-created', { prompt });
      
      // Resolve the provider to use
      const provider = options.provider || settingsManager.getActiveProvider();
      
      // Create or get the session
      const sessionId = options.sessionId || sessionManager.createSession();
      const session = sessionManager.getSession(sessionId);
      if (!session) {
        throw new Error(`Failed to create or get session: ${sessionId}`);
      }
      
      // Analyze the prompt and create a task plan
      const plan = await taskPlanner.decomposeTask(prompt, provider, {
        complexity: options.complexity || 'auto'
      });
      
      // Create a unique ID for this run
      const runId = this.generateId('run');
      
      // Create the task run
      const taskRun: TaskRun = {
        id: runId,
        plan,
        sessionId,
        status: 'preparing',
        currentStepIndex: 0,
        startTime: Date.now(),
        responses: {}
      };
      
      // Store the run
      this.runs.set(runId, taskRun);
      
      // If auto-execute is enabled, start executing the plan
      if (options.autoExecute !== false) {
        await this.executeNextStep(runId);
      } else {
        // Mark as paused if not auto-executing
        taskRun.status = 'paused';
      }
      
      return taskRun;
    } catch (error) {
      console.error('Error starting task run:', error);
      throw error;
    }
  }
  
  /**
   * Execute the next step in a task run
   */
  async executeNextStep(runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`Task run not found: ${runId}`);
    }
    
    // If the run is completed or failed, do nothing
    if (run.status === 'completed' || run.status === 'failed') {
      return;
    }
    
    // Update status to running
    run.status = 'running';
    
    // Get the current step
    const currentStep = run.plan.steps[run.currentStepIndex];
    if (!currentStep) {
      // No more steps, mark as completed
      run.status = 'completed';
      run.endTime = Date.now();
      this.emitEvent('task-completed', { runId, run });
      
      // Generate next step suggestions
      await this.generateNextStepSuggestions(runId);
      
      return;
    }
    
    try {
      // Check if this step has dependencies that haven't been completed
      const pendingDependencies = currentStep.dependencies.filter(depId => {
        const depStep = run.plan.steps.find(step => step.id === depId);
        return depStep && depStep.status !== 'completed';
      });
      
      if (pendingDependencies.length > 0) {
        throw new Error(`Step ${currentStep.id} has unmet dependencies: ${pendingDependencies.join(', ')}`);
      }
      
      // Emit event for step start
      this.emitEvent('step-started', { runId, step: currentStep });
      
      // Update step status
      currentStep.status = 'in_progress';
      
      // Get previous responses to build context
      const previousResponses: StructuredResponse[] = [];
      for (let i = 0; i < run.currentStepIndex; i++) {
        const stepId = run.plan.steps[i].id;
        if (run.responses[stepId]) {
          previousResponses.push(run.responses[stepId]);
        }
      }
      
      // Get the session
      const session = sessionManager.getSession(run.sessionId);
      if (!session) {
        throw new Error(`Session not found: ${run.sessionId}`);
      }
      
      // Create a task object that the task planner can use
      const task: Task = {
        id: runId,
        prompt: currentStep.prompt,
        steps: [],
        context: [],
        currentStep: 0,
        completed: false,
        output: '',
        provider: settingsManager.getActiveProvider(),
        createdAt: new Date(run.startTime),
        updatedAt: new Date()
      };
      
      // Execute the step using the task planner
      const response = await taskPlanner.executeStep(
        currentStep,
        task,
        settingsManager.getActiveProvider(),
        previousResponses
      );
      
      // Store the response
      run.responses[currentStep.id] = response;
      
      // Update step status
      currentStep.status = 'completed';
      currentStep.response = response;
      
      // Emit event for step completion
      this.emitEvent('step-completed', { 
        runId, 
        step: currentStep, 
        response 
      });
      
      // Add the step results to the session
      const stepIteration = sessionManager.addIteration(
        run.sessionId,
        { content: currentStep.prompt },
        response,
        settingsManager.getActiveProvider(),
        settingsManager.getPreferredModel(settingsManager.getActiveProvider())
      );
      
      // Move to the next step
      run.currentStepIndex++;
      
      // Check if we've reached the end of the plan
      if (run.currentStepIndex >= run.plan.steps.length) {
        // All steps completed
        run.status = 'completed';
        run.endTime = Date.now();
        this.emitEvent('task-completed', { runId, run });
        
        // Generate next step suggestions
        await this.generateNextStepSuggestions(runId);
      } else {
        // Continue with the next step
        await this.executeNextStep(runId);
      }
    } catch (error) {
      console.error(`Error executing step ${currentStep.id}:`, error);
      
      // Update step and run status
      currentStep.status = 'failed';
      run.status = 'failed';
      run.error = error instanceof Error ? error.message : String(error);
      run.endTime = Date.now();
      
      // Emit event for step failure
      this.emitEvent('step-failed', { 
        runId, 
        step: currentStep, 
        error: run.error 
      });
      
      // Emit event for task failure
      this.emitEvent('task-failed', { 
        runId, 
        run,
        error: run.error 
      });
    }
  }
  
  /**
   * Pause a running task
   */
  pauseRun(runId: string): boolean {
    const run = this.runs.get(runId);
    if (!run || run.status !== 'running') {
      return false;
    }
    
    run.status = 'paused';
    this.emitEvent('task-paused', { runId, run });
    return true;
  }
  
  /**
   * Resume a paused task
   */
  async resumeRun(runId: string): Promise<boolean> {
    const run = this.runs.get(runId);
    if (!run || run.status !== 'paused') {
      return false;
    }
    
    this.emitEvent('task-resumed', { runId, run });
    await this.executeNextStep(runId);
    return true;
  }
  
  /**
   * Cancel a running or paused task
   */
  cancelRun(runId: string): boolean {
    const run = this.runs.get(runId);
    if (!run || (run.status !== 'running' && run.status !== 'paused')) {
      return false;
    }
    
    run.status = 'cancelled';
    run.endTime = Date.now();
    this.emitEvent('task-failed', { 
      runId, 
      run,
      error: 'Task cancelled by user' 
    });
    
    return true;
  }
  
  /**
   * Get a task run by ID
   */
  getRun(runId: string): TaskRun | undefined {
    return this.runs.get(runId);
  }
  
  /**
   * Get all task runs
   */
  getAllRuns(): TaskRun[] {
    return Array.from(this.runs.values());
  }
  
  /**
   * Generate next step suggestions for a completed task
   */
  private async generateNextStepSuggestions(runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (!run || run.status !== 'completed') {
      return;
    }
    
    try {
      // Get the task that was completed
      const task: Task = {
        id: runId,
        prompt: run.plan.description,
        steps: [],
        context: [],
        currentStep: 0,
        completed: true,
        output: '',
        provider: settingsManager.getActiveProvider(),
        createdAt: new Date(run.startTime),
        updatedAt: new Date(run.endTime || Date.now())
      };
      
      // Get the final response
      const finalStepId = run.plan.steps[run.plan.steps.length - 1].id;
      const finalResponse = run.responses[finalStepId];
      
      if (!finalResponse) {
        return;
      }
      
      // Generate suggestions using the task planner
      const suggestions = await taskPlanner.generateNextStepSuggestions(
        task,
        finalResponse,
        settingsManager.getActiveProvider()
      );
      
      // Store the suggestions
      run.nextStepSuggestions = suggestions;
      
      // Emit event with suggestions
      this.emitEvent('suggestions-ready', {
        runId,
        suggestions
      });
    } catch (error) {
      console.error('Error generating next step suggestions:', error);
    }
  }
  
  /**
   * Execute a suggested next step
   */
  async executeSuggestion(
    runId: string,
    suggestionId: string,
    sessionId?: string
  ): Promise<TaskRun> {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`Task run not found: ${runId}`);
    }
    
    // Find the suggestion
    const suggestion = run.nextStepSuggestions?.find(s => s.id === suggestionId);
    if (!suggestion) {
      throw new Error(`Suggestion not found: ${suggestionId}`);
    }
    
    // Start a new run with the suggestion
    return this.startRun(suggestion.prompt, {
      sessionId: sessionId || run.sessionId,
      autoExecute: true
    });
  }
  
  /**
   * Add an event handler
   */
  addEventListener(handler: TaskRunnerEventHandler): void {
    this.eventHandlers.add(handler);
  }
  
  /**
   * Remove an event handler
   */
  removeEventListener(handler: TaskRunnerEventHandler): void {
    this.eventHandlers.delete(handler);
  }
  
  /**
   * Emit an event to all handlers
   */
  private emitEvent(event: TaskRunnerEvent, data: any): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event, data);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    }
  }
  
  /**
   * Generate a unique ID with a prefix
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Export singleton instance
export const taskRunner = new TaskRunner();