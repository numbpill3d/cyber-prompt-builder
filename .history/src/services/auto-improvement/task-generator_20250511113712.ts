/**
 * Task Generator for Auto-Improvement System
 * 
 * Generates and prioritizes self-improvement tasks based on
 * Evolution Engine metrics and performance analysis.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  EvolutionReport, 
  Improvement, 
  EvolutionMetrics,
  ImprovementPriority
} from '../evolution/evolution-types';
import { 
  ImprovementTask, 
  ImprovementTaskStatus,
  TaskGenerationStrategy, 
  TaskGenerationOptions
} from './auto-improvement-types';
import { evolutionService } from '../evolution/evolution-service';

/**
 * TaskGenerator creates and prioritizes improvement tasks based on
 * evolution metrics and system performance data.
 */
export class TaskGenerator {
  /**
   * Generate improvement tasks from an evolution report
   */
  public generateTasks(
    report: EvolutionReport, 
    options: TaskGenerationOptions
  ): ImprovementTask[] {
    const tasks: ImprovementTask[] = [];
    
    // Get improvements from the report
    const improvements = [...report.improvements];
    
    // Apply minimum priority filter
    const minPriority = options.minPriority || 1;
    const filteredImprovements = improvements.filter(imp => imp.priority >= minPriority);
    
    // Early return if no improvements meet criteria
    if (filteredImprovements.length === 0) {
      return [];
    }
    
    // Apply strategy for selecting and prioritizing improvements
    const selectedImprovements = this.applyStrategy(filteredImprovements, options);
    
    // Generate tasks for each selected improvement
    for (const improvement of selectedImprovements) {
      tasks.push(this.createTask(report, improvement));
    }
    
    return tasks;
  }
  
  /**
   * Apply a task generation strategy to improvements
   */
  private applyStrategy(
    improvements: Improvement[], 
    options: TaskGenerationOptions
  ): Improvement[] {
    const { strategy, maxTasks = 5, focusDimension } = options;
    
    // Sort improvements by priority (highest first)
    const sortedImprovements = [...improvements].sort((a, b) => b.priority - a.priority);
    
    switch (strategy) {
      case TaskGenerationStrategy.PRIORITIZED:
        // Just take the top N by priority
        return sortedImprovements.slice(0, maxTasks);
        
      case TaskGenerationStrategy.BALANCED:
        // Get improvements across different dimensions
        return this.balanceAcrossDimensions(sortedImprovements, maxTasks);
        
      case TaskGenerationStrategy.FOCUSED:
        // Focus on a specific dimension
        if (!focusDimension) {
          return sortedImprovements.slice(0, maxTasks);
        }
        
        // Filter for the focus dimension and take top N
        const focusedImprovements = sortedImprovements
          .filter(imp => imp.dimension === focusDimension);
          
        return focusedImprovements.slice(0, maxTasks);
        
      case TaskGenerationStrategy.COMPREHENSIVE:
        // Take all improvements up to the max
        return sortedImprovements.slice(0, maxTasks);
        
      default:
        return sortedImprovements.slice(0, maxTasks);
    }
  }
  
  /**
   * Select improvements balancing across different dimensions
   */
  private balanceAcrossDimensions(
    improvements: Improvement[], 
    maxTasks: number
  ): Improvement[] {
    const result: Improvement[] = [];
    const dimensionMap = new Map<string, Improvement[]>();
    
    // Group by dimension
    for (const imp of improvements) {
      if (!dimensionMap.has(imp.dimension)) {
        dimensionMap.set(imp.dimension, []);
      }
      dimensionMap.get(imp.dimension)!.push(imp);
    }
    
    // Take the highest priority from each dimension in rounds
    // until we hit the max tasks
    let dimensionsLeft = true;
    
    while (result.length < maxTasks && dimensionsLeft) {
      dimensionsLeft = false;
      
      for (const [dimension, imps] of dimensionMap.entries()) {
        if (imps.length > 0 && result.length < maxTasks) {
          result.push(imps.shift()!);
          dimensionsLeft = dimensionsLeft || imps.length > 0;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Create a task from an improvement
   */
  private createTask(report: EvolutionReport, improvement: Improvement): ImprovementTask {
    return {
      id: uuidv4(),
      sessionId: report.sessionId,
      sourceReport: report,
      dimension: improvement.dimension,
      improvement,
      status: ImprovementTaskStatus.PENDING,
      priority: improvement.priority,
      createdAt: Date.now(),
      scheduledFor: this.calculateScheduleTime(improvement.priority)
    };
  }
  
  /**
   * Calculate when to schedule a task based on priority
   */
  private calculateScheduleTime(priority: number): number {
    // Higher priority = sooner scheduling
    // For now, simple logic: high priority tasks scheduled immediately
    // medium priority in 24h, low priority in 48h
    const now = Date.now();
    
    if (priority >= ImprovementPriority.HIGH) {
      return now; // Immediate
    } else if (priority >= ImprovementPriority.MEDIUM) {
      return now + 24 * 60 * 60 * 1000; // 24 hours
    } else {
      return now + 48 * 60 * 60 * 1000; // 48 hours
    }
  }
  
  /**
   * Generate tasks from historical data to address persistent issues
   */
  public async generateHistoricalTasks(
    sessionId: string,
    options: TaskGenerationOptions
  ): Promise<ImprovementTask[]> {
    try {
      // Get historical reports
      const reports = await evolutionService.getSessionReports(sessionId);
      
      if (reports.length === 0) {
        return [];
      }
      
      // Find persistent issues across reports
      const persistentIssues = this.identifyPersistentIssues(reports);
      
      // Generate tasks for persistent issues
      const latestReport = reports.reduce((latest, current) => 
        current.timestamp > latest.timestamp ? current : latest, reports[0]);
      
      const tasks: ImprovementTask[] = [];
      
      for (const [dimension, count] of persistentIssues.entries()) {
        // Only consider issues that appear in multiple reports
        if (count < 2) continue;
        
        // Find the improvement for this dimension in the latest report
        const improvement = latestReport.improvements.find(imp => imp.dimension === dimension);
        
        if (improvement) {
          // Boost priority for persistent issues
          improvement.priority = Math.min(10, improvement.priority + 2);
          tasks.push(this.createTask(latestReport, improvement));
        }
      }
      
      return tasks;
    } catch (error) {
      console.error('Error generating historical tasks:', error);
      return [];
    }
  }
  
  /**
   * Identify persistent issues across multiple reports
   */
  private identifyPersistentIssues(reports: EvolutionReport[]): Map<string, number> {
    const issueCount = new Map<string, number>();
    
    for (const report of reports) {
      for (const improvement of report.improvements) {
        const count = issueCount.get(improvement.dimension) || 0;
        issueCount.set(improvement.dimension, count + 1);
      }
    }
    
    return issueCount;
  }
  
  /**
   * Analyze a new evolution report and generate appropriate tasks
   */
  public async analyzeReportAndGenerateTasks(
    report: EvolutionReport,
    options: TaskGenerationOptions
  ): Promise<ImprovementTask[]> {
    // Generate tasks from current report
    const currentTasks = this.generateTasks(report, options);
    
    // If including historical data, get historical tasks
    if (options.includeHistoricalData) {
      const historicalTasks = await this.generateHistoricalTasks(report.sessionId, {
        ...options,
        maxTasks: Math.max(1, (options.maxTasks || 5) / 2) // Use fewer slots for historical
      });
      
      // Combine and deduplicate tasks
      const allTasks = [...currentTasks];
      
      for (const histTask of historicalTasks) {
        // Only add if not already targeting the same dimension
        if (!allTasks.some(task => task.dimension === histTask.dimension)) {
          allTasks.push(histTask);
        }
      }
      
      // Respect original max tasks
      return allTasks.slice(0, options.maxTasks || 5);
    }
    
    return currentTasks;
  }
}

// Export singleton instance
export const taskGenerator = new TaskGenerator();