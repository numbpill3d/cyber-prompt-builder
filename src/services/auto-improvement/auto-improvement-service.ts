/**
 * Auto-Improvement Service
 * 
 * Core implementation of the auto-improvement system that enables
 * autonomous self-improvement cycles based on Evolution Engine metrics.
 */

import { 
  AutoImprovementConfig, 
  AutoImprovementFrequency,
  ImprovementTask, 
  ImprovementTaskStatus,
  ImprovementTaskCollection,
  ImprovementCycleSummary,
  TaskGenerationStrategy,
  TaskGenerationOptions
} from './auto-improvement-types';
import { taskGenerator } from './task-generator';
import { evolutionService } from '../evolution/evolution-service';
import { getMemoryService } from '../memory/memory-service';
import { MemoryType } from '../memory/memory-types';

// Memory collection name for improvement tasks
const IMPROVEMENT_TASKS_COLLECTION = 'improvement_tasks';

// Default configuration
const DEFAULT_CONFIG: AutoImprovementConfig = {
  enabled: true,
  frequency: AutoImprovementFrequency.DAILY,
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

/**
 * AutoImprovementService provides the core functionality for autonomous
 * self-improvement cycles based on Evolution Engine metrics.
 */
export class AutoImprovementService {
  private config: AutoImprovementConfig;
  private initialized: boolean = false;
  private taskCollection: ImprovementTaskCollection;
  private cycleTimer: any = null;
  
  constructor(config: Partial<AutoImprovementConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    
    this.taskCollection = {
      tasks: [],
      activeTaskCount: 0,
      completedTaskCount: 0,
      failedTaskCount: 0,
      lastUpdated: Date.now()
    };
  }
  
  /**
   * Initialize the auto-improvement service
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Make sure evolution service is initialized
      await evolutionService.initialize();
      
      // Setup memory collection for improvement tasks if using memory system
      if (this.config.integrations.useMemorySystem) {
        const memoryService = await getMemoryService();
        
        // Ensure the collection exists
        const collections = await memoryService.listCollections();
        if (!collections.includes(IMPROVEMENT_TASKS_COLLECTION)) {
          await memoryService.createCollection({
            name: IMPROVEMENT_TASKS_COLLECTION,
            metadata: {
              description: 'Auto-improvement tasks and results'
            }
          });
        }
        
        // Load existing tasks
        await this.loadTasksFromMemory();
      }
      
      // Schedule improvement cycles based on frequency setting
      this.scheduleImprovementCycles();
      
      this.initialized = true;
      console.log('Auto-improvement service initialized');
    } catch (error) {
      console.error('Failed to initialize auto-improvement service:', error);
      throw error;
    }
  }
  
  /**
   * Get the current configuration
   */
  public getConfig(): AutoImprovementConfig {
    return { ...this.config };
  }
  
  /**
   * Update the configuration
   */
  public updateConfig(config: Partial<AutoImprovementConfig>): void {
    const oldFrequency = this.config.frequency;
    
    this.config = {
      ...this.config,
      ...config
    };
    
    // If frequency changed, reschedule improvement cycles
    if (oldFrequency !== this.config.frequency) {
      this.scheduleImprovementCycles();
    }
  }
  
  /**
   * Schedule improvement cycles based on frequency setting
   */
  private scheduleImprovementCycles(): void {
    // Clear existing timer if any
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
    
    // Don't schedule if not enabled or if set to manual
    if (!this.config.enabled || this.config.frequency === AutoImprovementFrequency.MANUAL) {
      return;
    }
    
    // Set interval based on frequency
    let interval: number;
    
    switch (this.config.frequency) {
      case AutoImprovementFrequency.DAILY:
        interval = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case AutoImprovementFrequency.WEEKLY:
        interval = 7 * 24 * 60 * 60 * 1000; // 7 days
        break;
      case AutoImprovementFrequency.AFTER_EACH_SESSION:
        // This will be triggered by session events, not a timer
        return;
      case AutoImprovementFrequency.ON_THRESHOLD:
        // This will be triggered by evolution metrics, not a timer
        return;
      default:
        interval = 24 * 60 * 60 * 1000; // Default to 24 hours
    }
    
    // Schedule improvement cycle
    this.cycleTimer = setInterval(() => {
      this.runImprovementCycle();
    }, interval);
  }
  
  /**
   * Get all improvement tasks
   */
  public getTasks(): ImprovementTask[] {
    return [...this.taskCollection.tasks];
  }
  
  /**
   * Get tasks by status
   */
  public getTasksByStatus(status: ImprovementTaskStatus): ImprovementTask[] {
    return this.taskCollection.tasks.filter(task => task.status === status);
  }
  
  /**
   * Get tasks for a specific session
   */
  public getTasksForSession(sessionId: string): ImprovementTask[] {
    return this.taskCollection.tasks.filter(task => task.sessionId === sessionId);
  }
  
  /**
   * Get a specific task by ID
   */
  public getTask(taskId: string): ImprovementTask | undefined {
    return this.taskCollection.tasks.find(task => task.id === taskId);
  }
  
  /**
   * Add a new improvement task
   */
  public async addTask(task: ImprovementTask): Promise<ImprovementTask> {
    await this.initialize();
    
    // Add task to collection
    this.taskCollection.tasks.push(task);
    this.taskCollection.activeTaskCount += (task.status === ImprovementTaskStatus.IN_PROGRESS) ? 1 : 0;
    this.taskCollection.lastUpdated = Date.now();
    
    // Store in memory system if enabled
    if (this.config.integrations.useMemorySystem) {
      await this.saveTaskToMemory(task);
    }
    
    return task;
  }
  
  /**
   * Update an existing task
   */
  public async updateTask(taskId: string, updates: Partial<ImprovementTask>): Promise<ImprovementTask | null> {
    await this.initialize();
    
    const taskIndex = this.taskCollection.tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      return null;
    }
    
    const oldTask = this.taskCollection.tasks[taskIndex];
    const updatedTask = { ...oldTask, ...updates, startedAt: oldTask.startedAt };
    
    // Update active task count if status changed
    if (updates.status !== undefined && updates.status !== oldTask.status) {
      if (oldTask.status === ImprovementTaskStatus.IN_PROGRESS) {
        this.taskCollection.activeTaskCount--;
      }
      
      if (updates.status === ImprovementTaskStatus.IN_PROGRESS) {
        this.taskCollection.activeTaskCount++;
        
        // If task is being started, set startedAt timestamp
        if (oldTask.status !== ImprovementTaskStatus.IN_PROGRESS) {
          updatedTask.startedAt = Date.now();
        }
      }
      
      if (updates.status === ImprovementTaskStatus.COMPLETED) {
        this.taskCollection.completedTaskCount++;
        updatedTask.completedAt = Date.now();
      }
      
      if (updates.status === ImprovementTaskStatus.FAILED) {
        this.taskCollection.failedTaskCount++;
        updatedTask.completedAt = Date.now();
      }
    }
    
    // Update task in collection
    this.taskCollection.tasks[taskIndex] = updatedTask;
    this.taskCollection.lastUpdated = Date.now();
    
    // Update in memory system if enabled
    if (this.config.integrations.useMemorySystem) {
      await this.saveTaskToMemory(updatedTask);
    }
    
    return updatedTask;
  }
  
  /**
   * Run a full improvement cycle
   */
  public async runImprovementCycle(
    sessionId?: string,
    options?: Partial<TaskGenerationOptions>
  ): Promise<ImprovementCycleSummary> {
    await this.initialize();
    
    const cycleStartTime = Date.now();
    const cycleId = this.generateId('cycle');
    let tasksGenerated = 0;
    let tasksCompleted = 0;
    let tasksFailed = 0;
    
    try {
      // Get latest reports for either specific session or all sessions
      const reports = sessionId 
        ? [await evolutionService.getLatestReport(sessionId)]
        : await this.getAllLatestReports();
      
      // Filter out null reports
      const validReports = reports.filter(r => r !== null) as any[];
      
      if (validReports.length === 0) {
        return this.createEmptyCycleSummary(cycleId, cycleStartTime);
      }
      
      // Generate improvement tasks for each report
      for (const report of validReports) {
        // Skip if no improvements needed
        if (report.improvements.length === 0) continue;
        
        // Generate tasks using task generator
        const generationOptions: TaskGenerationOptions = {
          strategy: TaskGenerationStrategy.PRIORITIZED,
          maxTasks: this.config.thresholds.maxConcurrentTasks,
          minPriority: this.config.thresholds.minPriority,
          includeHistoricalData: true,
          ...options
        };
        
        const tasks = await taskGenerator.analyzeReportAndGenerateTasks(report, generationOptions);
        
        // Add tasks to collection
        for (const task of tasks) {
          await this.addTask(task);
          tasksGenerated++;
        }
        
        // Auto-apply improvements if enabled
        if (this.config.integrations.autoApply) {
          const results = await this.applyImprovements(tasks);
          
          tasksCompleted += results.completed;
          tasksFailed += results.failed;
        }
      }
      
      // Create cycle summary
      const summary: ImprovementCycleSummary = {
        cycleId,
        startTime: cycleStartTime,
        endTime: Date.now(),
        tasksGenerated,
        tasksCompleted,
        tasksFailed,
        overallPerformanceGain: 0, // Will be calculated later
        dimensionsImproved: this.getUniqueImprovementDimensions(),
        report: this.generateCycleReport(tasksGenerated, tasksCompleted, tasksFailed)
      };
      
      // Store summary in memory if enabled
      if (this.config.reporting.storeHistory && this.config.integrations.useMemorySystem) {
        await this.saveCycleSummaryToMemory(summary);
      }
      
      return summary;
    } catch (error) {
      console.error('Error running improvement cycle:', error);
      
      return {
        cycleId,
        startTime: cycleStartTime,
        endTime: Date.now(),
        tasksGenerated,
        tasksCompleted,
        tasksFailed,
        overallPerformanceGain: 0,
        dimensionsImproved: [],
        report: `Error running improvement cycle: ${error.message}`
      };
    }
  }
  
  /**
   * Apply improvements from a list of tasks
   */
  private async applyImprovements(tasks: ImprovementTask[]): Promise<{ completed: number, failed: number }> {
    let completed = 0;
    let failed = 0;
    
    for (const task of tasks) {
      try {
        // Update task status to in-progress
        await this.updateTask(task.id, { status: ImprovementTaskStatus.IN_PROGRESS });
        
        // Apply the improvement
        const success = await evolutionService.applyImprovement(task.improvement);
        
        if (success) {
          await this.updateTask(task.id, { 
            status: ImprovementTaskStatus.COMPLETED,
            result: {
              successful: true,
              metricsBeforeImprovement: this.extractMetricsForDimension(task),
              notes: `Successfully applied improvement for ${task.dimension}`,
              timestamp: Date.now()
            }
          });
          completed++;
        } else {
          await this.updateTask(task.id, { 
            status: ImprovementTaskStatus.FAILED,
            result: {
              successful: false,
              metricsBeforeImprovement: this.extractMetricsForDimension(task),
              notes: `Failed to apply improvement for ${task.dimension}`,
              timestamp: Date.now()
            }
          });
          failed++;
        }
      } catch (error) {
        await this.updateTask(task.id, { 
          status: ImprovementTaskStatus.FAILED,
          result: {
            successful: false,
            metricsBeforeImprovement: this.extractMetricsForDimension(task),
            notes: `Error applying improvement: ${error.message}`,
            timestamp: Date.now()
          }
        });
        failed++;
      }
    }
    
    return { completed, failed };
  }
  
  /**
   * Extract metrics for a specific dimension from a task
   */
  private extractMetricsForDimension(task: ImprovementTask): Partial<any> {
    const dimension = task.dimension;
    const metrics = task.sourceReport.metrics;
    
    return {
      [dimension]: metrics[dimension as keyof typeof metrics]
    };
  }
  
  /**
   * Get unique improvement dimensions from all tasks
   */
  private getUniqueImprovementDimensions(): string[] {
    const dimensions = new Set<string>();
    
    for (const task of this.taskCollection.tasks) {
      dimensions.add(task.dimension);
    }
    
    return Array.from(dimensions);
  }
  
  /**
   * Generate a report for an improvement cycle
   */
  private generateCycleReport(
    tasksGenerated: number, 
    tasksCompleted: number, 
    tasksFailed: number
  ): string {
    let report = `Auto-Improvement Cycle Report\n`;
    report += `--------------------------------\n`;
    report += `Tasks Generated: ${tasksGenerated}\n`;
    report += `Tasks Completed: ${tasksCompleted}\n`;
    report += `Tasks Failed: ${tasksFailed}\n\n`;
    
    if (tasksGenerated === 0) {
      report += `No improvements were needed at this time.\n`;
      return report;
    }
    
    // Add details about specific improvements
    const completedTasks = this.getTasksByStatus(ImprovementTaskStatus.COMPLETED);
    
    if (completedTasks.length > 0) {
      report += `Completed Improvements:\n`;
      
      for (const task of completedTasks) {
        report += `- ${task.dimension}: ${task.improvement.suggestions[0]}\n`;
      }
    }
    
    return report;
  }
  
  /**
   * Create an empty cycle summary when no tasks were generated
   */
  private createEmptyCycleSummary(cycleId: string, startTime: number): ImprovementCycleSummary {
    return {
      cycleId,
      startTime,
      endTime: Date.now(),
      tasksGenerated: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      overallPerformanceGain: 0,
      dimensionsImproved: [],
      report: 'No improvements needed at this time.'
    };
  }
  
  /**
   * Trigger improvement cycles based on session completion
   */
  public async handleSessionCompleted(sessionId: string): Promise<void> {
    if (!this.config.enabled) return;
    
    if (this.config.frequency === AutoImprovementFrequency.AFTER_EACH_SESSION) {
      await this.runImprovementCycle(sessionId);
    }
  }
  
  /**
   * Trigger improvement cycles based on metrics falling below threshold
   */
  public async handleMetricsBelowThreshold(
    sessionId: string, 
    dimension: string, 
    value: number
  ): Promise<void> {
    if (!this.config.enabled) return;
    
    if (this.config.frequency === AutoImprovementFrequency.ON_THRESHOLD) {
      await this.runImprovementCycle(sessionId, {
        strategy: TaskGenerationStrategy.FOCUSED,
        focusDimension: dimension
      });
    }
  }
  
  /**
   * Get all latest reports from all sessions
   */
  private async getAllLatestReports(): Promise<any[]> {
    // First, we need to get all sessions
    const memoryService = await getMemoryService();
    const result = await memoryService.searchMemories('evolution_data', {
      tags: ['evolution', 'report']
    });
    
    // Extract session IDs
    const sessionIds = new Set<string>();
    for (const entry of result.entries) {
      if (entry.metadata.sessionId) {
        sessionIds.add(entry.metadata.sessionId);
      }
    }
    
    // Get latest report for each session
    const reports = [];
    for (const sessionId of sessionIds) {
      const report = await evolutionService.getLatestReport(sessionId);
      if (report) {
        reports.push(report);
      }
    }
    
    return reports;
  }
  
  /**
   * Save a task to the memory system
   */
  private async saveTaskToMemory(task: ImprovementTask): Promise<void> {
    if (!this.config.integrations.useMemorySystem) return;
    
    try {
      const memoryService = await getMemoryService();
      
      // Search for existing task
      const result = await memoryService.searchMemories(IMPROVEMENT_TASKS_COLLECTION, {
        tags: ['task', task.id]
      });
      
      if (result.entries.length > 0) {
        // Update existing task
        await memoryService.updateMemory(
          IMPROVEMENT_TASKS_COLLECTION,
          result.entries[0].id,
          {
            content: JSON.stringify(task),
            updatedAt: Date.now()
          }
        );
      } else {
        // Add new task
        await memoryService.addMemory(
          IMPROVEMENT_TASKS_COLLECTION,
          JSON.stringify(task),
          {
            sessionId: task.sessionId,
            type: MemoryType.CONTEXT,
            source: 'auto-improvement',
            tags: ['task', task.id, task.dimension, task.status],
            custom: {
              dimension: task.dimension,
              status: task.status,
              priority: task.priority
            }
          }
        );
      }
    } catch (error) {
      console.error('Error saving task to memory:', error);
    }
  }
  
  /**
   * Save a cycle summary to the memory system
   */
  private async saveCycleSummaryToMemory(summary: ImprovementCycleSummary): Promise<void> {
    if (!this.config.integrations.useMemorySystem) return;
    
    try {
      const memoryService = await getMemoryService();
      
      await memoryService.addMemory(
        IMPROVEMENT_TASKS_COLLECTION,
        JSON.stringify(summary),
        {
          type: MemoryType.CONTEXT,
          source: 'auto-improvement',
          tags: ['cycle', 'summary', summary.cycleId],
          custom: {
            tasksGenerated: summary.tasksGenerated,
            tasksCompleted: summary.tasksCompleted,
            tasksFailed: summary.tasksFailed
          }
        }
      );
    } catch (error) {
      console.error('Error saving cycle summary to memory:', error);
    }
  }
  
  /**
   * Load tasks from the memory system
   */
  private async loadTasksFromMemory(): Promise<void> {
    if (!this.config.integrations.useMemorySystem) return;
    
    try {
      const memoryService = await getMemoryService();
      
      const result = await memoryService.searchMemories(IMPROVEMENT_TASKS_COLLECTION, {
        tags: ['task'],
        maxResults: 1000
      });
      
      // Reset task collection
      this.taskCollection = {
        tasks: [],
        activeTaskCount: 0,
        completedTaskCount: 0,
        failedTaskCount: 0,
        lastUpdated: Date.now()
      };
      
      // Load tasks
      for (const entry of result.entries) {
        try {
          const task = JSON.parse(entry.content) as ImprovementTask;
          
          this.taskCollection.tasks.push(task);
          
          if (task.status === ImprovementTaskStatus.IN_PROGRESS) {
            this.taskCollection.activeTaskCount++;
          } else if (task.status === ImprovementTaskStatus.COMPLETED) {
            this.taskCollection.completedTaskCount++;
          } else if (task.status === ImprovementTaskStatus.FAILED) {
            this.taskCollection.failedTaskCount++;
          }
        } catch (error) {
          console.error('Error parsing task from memory:', error);
        }
      }
    } catch (error) {
      console.error('Error loading tasks from memory:', error);
    }
  }
  
  /**
   * Generate a unique ID with prefix
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Export singleton instance
export const autoImprovementService = new AutoImprovementService();