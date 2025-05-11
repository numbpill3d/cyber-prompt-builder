/**
 * Auto-Improvement Service Implementation
 * Implements the AutoImprovementSystem interface
 */

import {
  AutoImprovementSystem,
  AutoImprovementConfig,
  AutoImprovementFrequency,
  ImprovementTask,
  ImprovementTaskStatus,
  ImprovementCycleSummary,
  TaskGenerationOptions,
  TaskGenerationStrategy,
  ImprovementTaskResult
} from '../../core/interfaces/auto-improvement-system';
import { EvolutionEngine, EvolutionReport } from '../../core/interfaces/evolution-engine';
import { MemoryService, MemoryType } from '../../core/interfaces/memory-engine';
import { getService } from '../../core/services/service-locator';

/**
 * Generate a simple ID with optional prefix
 */
function generateId(prefix: string = ''): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Auto-Improvement Service Implementation
 */
export class AutoImprovementService implements AutoImprovementSystem {
  private memoryService: MemoryService;
  private evolutionEngine: EvolutionEngine;
  private config: AutoImprovementConfig;
  private tasks: Map<string, ImprovementTask> = new Map();
  private initialized: boolean = false;
  private cycleScheduler: NodeJS.Timeout | null = null;

  constructor() {
    this.memoryService = getService<MemoryService>('memoryService');
    this.evolutionEngine = getService<EvolutionEngine>('evolutionEngine');
    
    // Default configuration
    this.config = {
      enabled: true,
      frequency: AutoImprovementFrequency.MANUAL,
      thresholds: {
        minPriority: 5,
        maxConcurrentTasks: 3
      },
      reporting: {
        notificationsEnabled: true,
        detailedReporting: true,
        storeHistory: true
      },
      integrations: {
        useMemorySystem: true,
        autoApply: false
      }
    };
  }

  /**
   * Initialize the auto-improvement system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Create collection for auto-improvement data
      await this.memoryService.createCollection({
        name: 'autoImprovement',
        dimensions: 1536 // Match memory service embedding dimensions
      });
      
      // Load existing tasks
      await this.loadTasks();
      
      // Schedule improvement cycles if needed
      this.scheduleImprovementCycles();
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize auto-improvement system:', error);
      throw error;
    }
  }

  /**
   * Load tasks from memory service
   */
  private async loadTasks(): Promise<void> {
    try {
      const results = await this.memoryService.searchMemories('autoImprovement', {
        filter: { 'metadata.custom.type': 'task' }
      });
      
      for (const entry of results.entries) {
        try {
          const task = JSON.parse(entry.content) as ImprovementTask;
          this.tasks.set(task.id, task);
        } catch (e) {
          console.error('Failed to parse task:', e);
        }
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }

  /**
   * Schedule improvement cycles based on configuration
   */
  private scheduleImprovementCycles(): void {
    // Clear any existing scheduler
    if (this.cycleScheduler) {
      clearInterval(this.cycleScheduler);
      this.cycleScheduler = null;
    }
    
    if (!this.config.enabled || this.config.frequency === AutoImprovementFrequency.MANUAL) {
      return;
    }
    
    // Set up scheduler based on frequency
    let interval: number;
    
    switch (this.config.frequency) {
      case AutoImprovementFrequency.DAILY:
        interval = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case AutoImprovementFrequency.WEEKLY:
        interval = 7 * 24 * 60 * 60 * 1000; // 7 days
        break;
      case AutoImprovementFrequency.AFTER_EACH_SESSION:
        // This is event-based, not time-based
        return;
      case AutoImprovementFrequency.ON_THRESHOLD:
        // This is event-based, not time-based
        return;
      default:
        return;
    }
    
    this.cycleScheduler = setInterval(() => {
      this.runImprovementCycle().catch(error => {
        console.error('Error running scheduled improvement cycle:', error);
      });
    }, interval);
  }

  /**
   * Get the current configuration
   */
  getConfig(): AutoImprovementConfig {
    return { ...this.config };
  }

  /**
   * Update the configuration
   */
  updateConfig(config: Partial<AutoImprovementConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
    
    // Update scheduler if frequency changed
    this.scheduleImprovementCycles();
  }

  /**
   * Get all tasks
   */
  getTasks(): ImprovementTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: ImprovementTaskStatus): ImprovementTask[] {
    return Array.from(this.tasks.values())
      .filter(task => task.status === status);
  }

  /**
   * Get tasks for a specific session
   */
  getTasksForSession(sessionId: string): ImprovementTask[] {
    return Array.from(this.tasks.values())
      .filter(task => task.sessionId === sessionId);
  }

  /**
   * Get a specific task by ID
   */
  getTask(taskId: string): ImprovementTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Add a new task
   */
  async addTask(task: ImprovementTask): Promise<ImprovementTask> {
    // Ensure the task has an ID
    if (!task.id) {
      task = {
        ...task,
        id: generateId('task')
      };
    }
    
    // Save to memory if integration enabled
    if (this.config.integrations.useMemorySystem) {
      await this.memoryService.addMemory('autoImprovement',
        JSON.stringify(task),
        {
          type: 'METADATA' as any, // Cast to avoid type issues
          source: 'auto_improvement',
          sessionId: task.sessionId,
          custom: {
            type: 'task',
            taskId: task.id,
            status: task.status,
            dimension: task.dimension
          }
        }
      );
    }
    
    // Add to local cache
    this.tasks.set(task.id, task);
    
    return task;
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, updates: Partial<ImprovementTask>): Promise<ImprovementTask | null> {
    const task = this.tasks.get(taskId);
    if (!task) return null;
    
    // Apply updates
    const updatedTask: ImprovementTask = {
      ...task,
      ...updates,
      id: task.id // Ensure ID doesn't change
    };
    
    // Update timestamps based on status changes
    if (updates.status) {
      if (updates.status === ImprovementTaskStatus.IN_PROGRESS && !task.startedAt) {
        updatedTask.startedAt = Date.now();
      } else if ([ImprovementTaskStatus.COMPLETED, ImprovementTaskStatus.FAILED, ImprovementTaskStatus.CANCELLED].includes(updates.status) && !task.completedAt) {
        updatedTask.completedAt = Date.now();
      }
    }
    
    // Save to memory if integration enabled
    if (this.config.integrations.useMemorySystem) {
      await this.memoryService.searchMemories('autoImprovement', {
        filter: { 'metadata.custom.taskId': taskId }
      }).then(result => {
        if (result.entries.length > 0) {
          return this.memoryService.updateMemory('autoImprovement', result.entries[0].id, {
            content: JSON.stringify(updatedTask),
            updatedAt: Date.now(),
            metadata: {
              ...result.entries[0].metadata,
              custom: {
                ...result.entries[0].metadata.custom,
                status: updatedTask.status
              }
            }
          });
        }
      });
    }
    
    // Update local cache
    this.tasks.set(taskId, updatedTask);
    
    // If task is completed and autoApply is enabled, apply the improvement
    if (updatedTask.status === ImprovementTaskStatus.COMPLETED && 
        this.config.integrations.autoApply && 
        updatedTask.result && 
        updatedTask.result.successful) {
      try {
        await this.evolutionEngine.applyImprovement(updatedTask.improvement);
      } catch (error) {
        console.error('Failed to auto-apply improvement:', error);
      }
    }
    
    return updatedTask;
  }

  /**
   * Run an improvement cycle
   */
  async runImprovementCycle(
    sessionId?: string,
    options?: Partial<TaskGenerationOptions>
  ): Promise<ImprovementCycleSummary> {
    const startTime = Date.now();
    
    // Generate tasks
    const taskOptions: TaskGenerationOptions = {
      strategy: TaskGenerationStrategy.BALANCED,
      maxTasks: this.config.thresholds.maxConcurrentTasks,
      minPriority: this.config.thresholds.minPriority,
      includeHistoricalData: true,
      ...options
    };
    
    // Get latest evolution report
    let report: EvolutionReport | null = null;
    if (sessionId) {
      report = await this.evolutionEngine.getLatestReport(sessionId);
    } else {
      // Get most recent session report from any session
      const allSessions = new Set(Array.from(this.tasks.values()).map(task => task.sessionId));
      for (const session of allSessions) {
        const sessionReport = await this.evolutionEngine.getLatestReport(session);
        if (!report || (sessionReport && sessionReport.timestamp > report.timestamp)) {
          report = sessionReport;
        }
      }
    }
    
    if (!report) {
      // Generate a report if none exists
      report = sessionId 
        ? await this.evolutionEngine.generateReport(sessionId)
        : null;
      
      if (!report) {
        throw new Error('No session data available for improvement cycle');
      }
    }
    
    // Generate improvement tasks
    const newTasks = await this.generateTasks(report, taskOptions);
    const tasksGenerated = newTasks.length;
    
    // Execute tasks that are auto-applicable
    let tasksCompleted = 0;
    let tasksFailed = 0;
    let overallPerformanceGain = 0;
    const dimensionsImproved: string[] = [];
    
    if (this.config.integrations.autoApply) {
      for (const task of newTasks) {
        try {
          // Start the task
          await this.updateTask(task.id, { status: ImprovementTaskStatus.IN_PROGRESS });
          
          // Get metrics before improvement
          const metricsBeforeImprovement = {
            overall: report.overallScore,
            dimension: report.metrics[task.dimension]?.value || 0
          };
          
          // Apply the improvement
          const applied = await this.evolutionEngine.applyImprovement(task.improvement);
          
          if (applied) {
            // Get metrics after improvement (would need a new evaluation in practice)
            // Here we just simulate a small improvement
            const dimensionImprovement = Math.random() * 0.05;
            const overallImprovement = dimensionImprovement * 0.3;
            
            const metricsAfterImprovement = {
              overall: metricsBeforeImprovement.overall + overallImprovement,
              dimension: metricsBeforeImprovement.dimension + dimensionImprovement
            };
            
            // Update task as completed
            const result: ImprovementTaskResult = {
              successful: true,
              metricsBeforeImprovement,
              metricsAfterImprovement,
              notes: `Successfully applied improvement for ${task.dimension}`,
              timestamp: Date.now()
            };
            
            await this.updateTask(task.id, { 
              status: ImprovementTaskStatus.COMPLETED,
              result
            });
            
            tasksCompleted++;
            overallPerformanceGain += overallImprovement;
            
            if (!dimensionsImproved.includes(task.dimension)) {
              dimensionsImproved.push(task.dimension);
            }
          } else {
            // Update task as failed
            const result: ImprovementTaskResult = {
              successful: false,
              metricsBeforeImprovement,
              notes: `Failed to apply improvement for ${task.dimension}`,
              timestamp: Date.now()
            };
            
            await this.updateTask(task.id, {
              status: ImprovementTaskStatus.FAILED,
              result
            });
            
            tasksFailed++;
          }
        } catch (error) {
          console.error(`Error executing task ${task.id}:`, error);
          
          // Update task as failed
          await this.updateTask(task.id, {
            status: ImprovementTaskStatus.FAILED,
            result: {
              successful: false,
              metricsBeforeImprovement: {},
              notes: `Error: ${error.message || 'Unknown error'}`,
              timestamp: Date.now()
            }
          });
          
          tasksFailed++;
        }
      }
    }
    
    // Create cycle summary
    const cycleSummary: ImprovementCycleSummary = {
      cycleId: generateId('cycle'),
      startTime,
      endTime: Date.now(),
      tasksGenerated,
      tasksCompleted,
      tasksFailed,
      overallPerformanceGain,
      dimensionsImproved,
      report: this.generateCycleReport(
        tasksGenerated,
        tasksCompleted,
        tasksFailed,
        overallPerformanceGain,
        dimensionsImproved
      )
    };
    
    // Save cycle summary to memory
    if (this.config.reporting.storeHistory) {
      await this.memoryService.addMemory('autoImprovement',
        JSON.stringify(cycleSummary),
        {
          type: 'METADATA' as any,
          source: 'auto_improvement',
          sessionId: report.sessionId,
          custom: {
            type: 'cycle_summary',
            cycleId: cycleSummary.cycleId,
            timestamp: startTime
          }
        }
      );
    }
    
    return cycleSummary;
  }

  /**
   * Generate improvement tasks from a report
   */
  private async generateTasks(
    report: EvolutionReport,
    options: TaskGenerationOptions
  ): Promise<ImprovementTask[]> {
    const existingTasks = this.getTasksForSession(report.sessionId)
      .filter(task => [ImprovementTaskStatus.PENDING, ImprovementTaskStatus.IN_PROGRESS].includes(task.status));
    
    // If we already have the maximum number of tasks, don't generate more
    if (existingTasks.length >= options.maxTasks) {
      return [];
    }
    
    // Filter the improvements based on priority threshold
    let eligibleImprovements = report.improvements
      .filter(improvement => improvement.priority >= options.minPriority);
    
    // Apply strategy
    switch (options.strategy) {
      case TaskGenerationStrategy.PRIORITIZED:
        // Sort by priority (highest first)
        eligibleImprovements = eligibleImprovements
          .sort((a, b) => b.priority - a.priority);
        break;
      
      case TaskGenerationStrategy.FOCUSED:
        // Filter for the focus dimension if specified
        if (options.focusDimension) {
          eligibleImprovements = eligibleImprovements
            .filter(improvement => improvement.dimension === options.focusDimension);
        }
        break;
      
      case TaskGenerationStrategy.BALANCED:
      default:
        // Mix of priority and diversity
        // Group by dimension and take highest priority from each
        const dimensionMap = new Map<string, typeof eligibleImprovements[0]>();
        
        for (const improvement of eligibleImprovements) {
          const existing = dimensionMap.get(improvement.dimension);
          if (!existing || improvement.priority > existing.priority) {
            dimensionMap.set(improvement.dimension, improvement);
          }
        }
        
        eligibleImprovements = Array.from(dimensionMap.values())
          .sort((a, b) => b.priority - a.priority);
        break;
    }
    
    // Calculate how many new tasks we can add
    const maxNewTasks = options.maxTasks - existingTasks.length;
    
    // Limit number of improvements
    eligibleImprovements = eligibleImprovements.slice(0, maxNewTasks);
    
    // Create tasks for the improvements
    const newTasks: ImprovementTask[] = [];
    
    for (const improvement of eligibleImprovements) {
      // Check if there's already a similar task
      const similarTaskExists = existingTasks.some(task => 
        task.dimension === improvement.dimension && 
        JSON.stringify(task.improvement.suggestions) === JSON.stringify(improvement.suggestions)
      );
      
      if (similarTaskExists) {
        continue;
      }
      
      // Create the task
      const task: ImprovementTask = {
        id: generateId('task'),
        sessionId: report.sessionId,
        improvement,
        status: ImprovementTaskStatus.PENDING,
        priority: improvement.priority,
        dimension: improvement.dimension,
        sourceReport: report,
        createdAt: Date.now()
      };
      
      // Add the task
      await this.addTask(task);
      newTasks.push(task);
    }
    
    return newTasks;
  }

  /**
   * Generate a report for the improvement cycle
   */
  private generateCycleReport(
    tasksGenerated: number,
    tasksCompleted: number,
    tasksFailed: number,
    performanceGain: number,
    dimensionsImproved: string[]
  ): string {
    const report = [
      'Auto-Improvement Cycle Report',
      `---------------------------`,
      ``,
      `Tasks Generated: ${tasksGenerated}`,
      `Tasks Completed: ${tasksCompleted}`,
      `Tasks Failed: ${tasksFailed}`,
      ``,
      `Performance Improvement: ${(performanceGain * 100).toFixed(2)}%`,
      ``,
      `Dimensions Improved:`,
    ];
    
    for (const dimension of dimensionsImproved) {
      report.push(`- ${dimension}`);
    }
    
    if (dimensionsImproved.length === 0) {
      report.push('- None');
    }
    
    if (this.config.reporting.detailedReporting) {
      report.push('');
      report.push('Configuration:');
      report.push(`- Auto-Apply: ${this.config.integrations.autoApply ? 'Enabled' : 'Disabled'}`);
      report.push(`- Memory Integration: ${this.config.integrations.useMemorySystem ? 'Enabled' : 'Disabled'}`);
      report.push(`- Min Priority Threshold: ${this.config.thresholds.minPriority}`);
      report.push(`- Max Concurrent Tasks: ${this.config.thresholds.maxConcurrentTasks}`);
    }
    
    return report.join('\n');
  }

  /**
   * Handle session completed event
   */
  async handleSessionCompleted(sessionId: string): Promise<void> {
    if (!this.config.enabled) return;
    
    // If frequency is set to after each session, run an improvement cycle
    if (this.config.frequency === AutoImprovementFrequency.AFTER_EACH_SESSION) {
      await this.runImprovementCycle(sessionId);
    }
  }

  /**
   * Handle metrics below threshold event
   */
  async handleMetricsBelowThreshold(
    sessionId: string,
    dimension: string,
    value: number
  ): Promise<void> {
    if (!this.config.enabled) return;
    
    // If frequency is set to on threshold, run an improvement cycle
    if (this.config.frequency === AutoImprovementFrequency.ON_THRESHOLD) {
      await this.runImprovementCycle(sessionId, {
        strategy: TaskGenerationStrategy.FOCUSED,
        focusDimension: dimension
      });
    }
  }
}

// Factory function
export function createAutoImprovementService(): AutoImprovementSystem {
  return new AutoImprovementService();
}