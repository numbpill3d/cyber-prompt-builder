/**
 * Task Manager
 * Handles task breakdown, iteration, and context management for AI coding tasks
 */

import { Logger } from '../logging/logger';
import { errorHandler, TaskError } from '../error/error-handler';
import { configService } from '../config/config-service';

export interface TaskStep {
  id: string;
  description: string;
  completed: boolean;
  output?: string;
  error?: string;
}

export interface Task {
  id: string;
  prompt: string;
  steps: TaskStep[];
  context: string[];
  currentStep: number;
  completed: boolean;
  output: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskManagerOptions {
  maxIterations?: number;
  enableTaskBreakdown?: boolean;
  enableIteration?: boolean;
  enableContextMemory?: boolean;
}

export class TaskManager {
  private tasks: Map<string, Task> = new Map();
  private options: TaskManagerOptions;
  private logger: Logger;

  constructor(options: TaskManagerOptions = {}) {
    this.logger = new Logger('TaskManager');
    
    // Load options from config if available
    try {
      const configOptions: TaskManagerOptions = {
        maxIterations: configService.get<number>('agent', 'max_iterations'),
        enableTaskBreakdown: configService.get<boolean>('agent', 'enable_task_breakdown'),
        enableIteration: configService.get<boolean>('agent', 'enable_iteration'),
        enableContextMemory: configService.get<boolean>('agent', 'enable_context_memory')
      };
      
      // Merge with provided options, with provided options taking precedence
      this.options = {
        ...configOptions,
        ...options
      };
    } catch (error) {
      // Fall back to default options if config not available
      this.logger.warn('Failed to load task manager options from config, using defaults', { error });
      
      this.options = {
        maxIterations: 3,
        enableTaskBreakdown: true,
        enableIteration: true,
        enableContextMemory: true,
        ...options
      };
    }
    
    this.logger.info('TaskManager initialized', { options: this.options });
  }

  /**
   * Create a new task
   * @param prompt The user's prompt
   * @param provider The AI provider to use
   * @returns The created task
   */
  createTask(prompt: string, provider: string): Task {
    const taskId = this.generateTaskId();
    const task: Task = {
      id: taskId,
      prompt,
      steps: [],
      context: [],
      currentStep: 0,
      completed: false,
      output: '',
      provider,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.set(taskId, task);
    return task;
  }

  /**
   * Get a task by ID
   * @param taskId The task ID
   * @returns The task or undefined if not found
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   * @returns Array of all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Break down a task into steps
   * @param taskId The task ID
   * @param steps The steps to break the task into
   */
  breakdownTask(taskId: string, steps: string[]): void {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        throw new TaskError(`Task ${taskId} not found`);
      }

      if (!this.options.enableTaskBreakdown) {
        // Just create a single step if task breakdown is disabled
        task.steps = [{
          id: this.generateStepId(),
          description: 'Complete task',
          completed: false
        }];
        this.logger.debug(`Created single step for task ${taskId} (task breakdown disabled)`);
        return;
      }

      task.steps = steps.map(description => ({
        id: this.generateStepId(),
        description,
        completed: false
      }));
      task.updatedAt = new Date();
      
      this.logger.debug(`Task ${taskId} broken down into ${steps.length} steps`, {
        taskId,
        stepCount: steps.length
      });
    } catch (error) {
      this.logger.error(`Failed to break down task ${taskId}`, { error, taskId, steps });
      throw errorHandler.handleError(error as Error, { taskId, steps });
    }
  }

  /**
   * Add context to a task
   * @param taskId The task ID
   * @param context The context to add
   */
  addContext(taskId: string, context: string): void {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        throw new TaskError(`Task ${taskId} not found`);
      }

      if (!this.options.enableContextMemory) {
        this.logger.debug(`Context not added to task ${taskId} (context memory disabled)`);
        return;
      }

      task.context.push(context);
      task.updatedAt = new Date();
      
      this.logger.debug(`Context added to task ${taskId}`, { taskId, contextLength: context.length });
    } catch (error) {
      this.logger.error(`Failed to add context to task ${taskId}`, { error, taskId });
      throw errorHandler.handleError(error as Error, { taskId });
    }
  }

  /**
   * Get the context for a task
   * @param taskId The task ID
   * @returns The task context or empty array if context memory is disabled
   */
  getContext(taskId: string): string[] {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        throw new TaskError(`Task ${taskId} not found`);
      }

      if (!this.options.enableContextMemory) {
        this.logger.debug(`Returning empty context for task ${taskId} (context memory disabled)`);
        return [];
      }

      return task.context;
    } catch (error) {
      this.logger.error(`Failed to get context for task ${taskId}`, { error, taskId });
      throw errorHandler.handleError(error as Error, { taskId });
    }
  }

  /**
   * Complete a step in a task
   * @param taskId The task ID
   * @param stepId The step ID
   * @param output The output of the step
   * @param error Any error that occurred
   * @returns True if the task is completed, false otherwise
   */
  completeStep(taskId: string, stepId: string, output: string, error?: string): boolean {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        throw new TaskError(`Task ${taskId} not found`);
      }

      const step = task.steps.find(s => s.id === stepId);
      if (!step) {
        throw new TaskError(`Step ${stepId} not found in task ${taskId}`);
      }

      step.completed = true;
      step.output = output;
      step.error = error;

      // Move to the next step
      const nextStepIndex = task.steps.findIndex(s => !s.completed);
      if (nextStepIndex === -1) {
        // All steps completed
        task.completed = true;
        task.output = task.steps.map(s => s.output).filter(Boolean).join('\n\n');
        this.logger.info(`Task ${taskId} completed`, { taskId, outputLength: task.output.length });
      } else {
        task.currentStep = nextStepIndex;
        this.logger.debug(`Moving to next step ${task.steps[nextStepIndex].id} for task ${taskId}`, {
          taskId,
          nextStep: task.currentStep,
          totalSteps: task.steps.length
        });
      }

      task.updatedAt = new Date();
      return task.completed;
    } catch (error) {
      this.logger.error(`Failed to complete step ${stepId} for task ${taskId}`, {
        error,
        taskId,
        stepId
      });
      throw errorHandler.handleError(error as Error, { taskId, stepId });
    }
  }

  /**
   * Get the current step for a task
   * @param taskId The task ID
   * @returns The current step or undefined if the task is completed
   */
  getCurrentStep(taskId: string): TaskStep | undefined {
    try {
      const task = this.tasks.get(taskId);
      if (!task || task.completed) {
        return undefined;
      }

      return task.steps[task.currentStep];
    } catch (error) {
      this.logger.error(`Failed to get current step for task ${taskId}`, { error, taskId });
      throw errorHandler.handleError(error as Error, { taskId });
    }
  }

  /**
   * Generate a unique task ID
   * @returns A unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique step ID
   * @returns A unique step ID
   */
  private generateStepId(): string {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}