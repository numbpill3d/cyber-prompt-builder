/**
 * Task Manager
 * Handles task breakdown, iteration, and context management for AI coding tasks
 */

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

  constructor(options: TaskManagerOptions = {}) {
    // Default options
    this.options = {
      maxIterations: 3,
      enableTaskBreakdown: true,
      enableIteration: true,
      enableContextMemory: true,
      ...options
    };
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
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (!this.options.enableTaskBreakdown) {
      // Just create a single step if task breakdown is disabled
      task.steps = [{
        id: this.generateStepId(),
        description: 'Complete task',
        completed: false
      }];
      return;
    }

    task.steps = steps.map(description => ({
      id: this.generateStepId(),
      description,
      completed: false
    }));
    task.updatedAt = new Date();
  }

  /**
   * Add context to a task
   * @param taskId The task ID
   * @param context The context to add
   */
  addContext(taskId: string, context: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (!this.options.enableContextMemory) {
      return;
    }

    task.context.push(context);
    task.updatedAt = new Date();
  }

  /**
   * Get the context for a task
   * @param taskId The task ID
   * @returns The task context or empty array if context memory is disabled
   */
  getContext(taskId: string): string[] {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (!this.options.enableContextMemory) {
      return [];
    }

    return task.context;
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
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const step = task.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step ${stepId} not found in task ${taskId}`);
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
    } else {
      task.currentStep = nextStepIndex;
    }

    task.updatedAt = new Date();
    return task.completed;
  }

  /**
   * Get the current step for a task
   * @param taskId The task ID
   * @returns The current step or undefined if the task is completed
   */
  getCurrentStep(taskId: string): TaskStep | undefined {
    const task = this.tasks.get(taskId);
    if (!task || task.completed) {
      return undefined;
    }

    return task.steps[task.currentStep];
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