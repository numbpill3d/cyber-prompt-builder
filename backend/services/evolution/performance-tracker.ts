/**
 * Performance Tracker
 * 
 * Collects and analyzes performance metrics for the evolution engine.
 * Enables tracking of various performance dimensions and generates insights.
 */

import { 
  EvolutionMetrics, 
  PerformanceDimension, 
  EvolutionMetricType,
  PerformanceLevel
} from './evolution-types';

import { getMemoryService } from '../memory/memory-service';
import { MemoryType } from '../memory/memory-types';

/**
 * Memory collection for performance data
 */
const PERFORMANCE_COLLECTION = 'evolution_metrics';

/**
 * Performance Tracker
 * Responsible for tracking, storing, and analyzing agent performance metrics
 */
export class PerformanceTracker {
  private dimensions: Map<string, PerformanceDimension>;
  private initialized: boolean = false;
  
  constructor() {
    this.dimensions = new Map<string, PerformanceDimension>();
    this.initDefaultDimensions();
  }

  /**
   * Initialize the performance tracker
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const memoryService = await getMemoryService();
      
      // Ensure the collection exists
      const collections = await memoryService.listCollections();
      if (!collections.includes(PERFORMANCE_COLLECTION)) {
        await memoryService.createCollection({
          name: PERFORMANCE_COLLECTION,
          metadata: {
            description: 'Evolution engine performance metrics'
          }
        });
      }
      
      this.initialized = true;
      console.log('Performance tracker initialized');
    } catch (error) {
      console.error('Failed to initialize performance tracker:', error);
      throw error;
    }
  }
  
  /**
   * Initialize default performance dimensions with weights and targets
   */
  private initDefaultDimensions(): void {
    this.registerDimension({
      name: EvolutionMetricType.ACCURACY,
      value: 0,
      weight: 1.0,
      threshold: 0.7,
      target: 0.95,
      description: 'Accuracy of responses compared to expected results'
    });
    
    this.registerDimension({
      name: EvolutionMetricType.RELEVANCE,
      value: 0,
      weight: 0.9,
      threshold: 0.6,
      target: 0.9,
      description: 'Relevance of responses to the original prompt'
    });
    
    this.registerDimension({
      name: EvolutionMetricType.COMPLEXITY,
      value: 0,
      weight: 0.7,
      threshold: 3,
      target: 8,
      description: 'Complexity of tasks the system can handle'
    });
    
    this.registerDimension({
      name: EvolutionMetricType.EFFICIENCY,
      value: 0,
      weight: 0.8,
      threshold: 0.5,
      target: 0.85,
      description: 'Efficiency of resource usage'
    });
    
    this.registerDimension({
      name: EvolutionMetricType.RESPONSIVENESS,
      value: 0,
      weight: 0.75,
      threshold: 0.6,
      target: 0.9,
      description: 'Speed and responsiveness to requests'
    });
    
    this.registerDimension({
      name: EvolutionMetricType.SUCCESS_RATE,
      value: 0,
      weight: 1.0,
      threshold: 0.8,
      target: 0.95,
      description: 'Rate of successful task completions'
    });
    
    this.registerDimension({
      name: EvolutionMetricType.USER_SATISFACTION,
      value: 0,
      weight: 1.0,
      threshold: 0.7,
      target: 0.9,
      description: 'User satisfaction with responses'
    });
    
    this.registerDimension({
      name: EvolutionMetricType.ADAPTABILITY,
      value: 0,
      weight: 0.8,
      threshold: 0.6,
      target: 0.85,
      description: 'Ability to adapt to new types of tasks'
    });
    
    this.registerDimension({
      name: EvolutionMetricType.KNOWLEDGE_GROWTH,
      value: 0,
      weight: 0.7,
      threshold: 0.5,
      target: 0.8,
      description: 'Growth in knowledge and capabilities over time'
    });
  }
  
  /**
   * Register a performance dimension for tracking
   */
  public registerDimension(dimension: PerformanceDimension): void {
    this.dimensions.set(dimension.name, dimension);
  }
  
  /**
   * Record performance metrics
   */
  public async recordMetrics(metrics: Partial<EvolutionMetrics>, sessionId: string, modelId: string): Promise<EvolutionMetrics> {
    await this.initialize();
    
    const timestamp = Date.now();
    
    // Merge with defaults
    const fullMetrics: EvolutionMetrics = {
      accuracy: metrics.accuracy ?? 0,
      relevance: metrics.relevance ?? 0,
      complexity: metrics.complexity ?? 0,
      efficiency: metrics.efficiency ?? 0,
      responsiveness: metrics.responsiveness ?? 0,
      successRate: metrics.successRate ?? 0,
      userSatisfaction: metrics.userSatisfaction ?? 0,
      adaptability: metrics.adaptability ?? 0,
      knowledgeGrowth: metrics.knowledgeGrowth ?? 0,
      timestamp,
      sessionId,
      modelId,
      taskType: metrics.taskType ?? 'general',
      rawFeedback: metrics.rawFeedback,
      rawPerformance: metrics.rawPerformance
    };
    
    // Store in memory service
    try {
      const memoryService = await getMemoryService();
      await memoryService.addMemory(
        PERFORMANCE_COLLECTION,
        JSON.stringify(fullMetrics),
        {
          sessionId,
          type: MemoryType.CONTEXT,
          source: 'evolution-engine',
          tags: ['performance', 'metrics', modelId, fullMetrics.taskType],
          custom: {
            modelId,
            taskType: fullMetrics.taskType,
            timestamp
          }
        }
      );
      return fullMetrics;
    } catch (error) {
      console.error('Failed to record performance metrics:', error);
      throw error;
    }
  }
  
  /**
   * Get performance metrics for a specific session
   */
  public async getSessionMetrics(sessionId: string): Promise<EvolutionMetrics[]> {
    await this.initialize();
    
    try {
      const memoryService = await getMemoryService();
      const result = await memoryService.searchMemories(PERFORMANCE_COLLECTION, {
        sessionId,
        types: [MemoryType.CONTEXT],
        tags: ['performance', 'metrics']
      });
      
      return result.entries.map(entry => JSON.parse(entry.content) as EvolutionMetrics);
    } catch (error) {
      console.error('Failed to get session metrics:', error);
      return [];
    }
  }
  
  /**
   * Get all performance metrics for a model
   */
  public async getModelMetrics(modelId: string): Promise<EvolutionMetrics[]> {
    await this.initialize();
    
    try {
      const memoryService = await getMemoryService();
      const result = await memoryService.searchMemories(PERFORMANCE_COLLECTION, {
        tags: ['performance', 'metrics', modelId]
      });
      
      return result.entries.map(entry => JSON.parse(entry.content) as EvolutionMetrics);
    } catch (error) {
      console.error('Failed to get model metrics:', error);
      return [];
    }
  }
  
  /**
   * Calculate performance score based on metrics and dimension weights
   */
  public calculatePerformanceScore(metrics: EvolutionMetrics): number {
    let totalWeight = 0;
    let weightedSum = 0;
    
    // Calculate weighted sum of all metrics
    for (const [name, dimension] of this.dimensions.entries()) {
      if (name in metrics) {
        const value = metrics[name as keyof EvolutionMetrics] as number;
        weightedSum += value * dimension.weight;
        totalWeight += dimension.weight;
      }
    }
    
    // Return normalized score (0-1)
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  
  /**
   * Determine performance level based on score
   */
  public getPerformanceLevel(score: number): PerformanceLevel {
    if (score >= 0.9) return PerformanceLevel.EXCELLENT;
    if (score >= 0.8) return PerformanceLevel.GOOD;
    if (score >= 0.7) return PerformanceLevel.SATISFACTORY;
    if (score >= 0.5) return PerformanceLevel.NEEDS_IMPROVEMENT;
    return PerformanceLevel.POOR;
  }
  
  /**
   * Identify dimensions that need improvement
   */
  public identifyImprovementAreas(metrics: EvolutionMetrics): string[] {
    const improvementAreas: string[] = [];
    
    for (const [name, dimension] of this.dimensions.entries()) {
      if (name in metrics) {
        const value = metrics[name as keyof EvolutionMetrics] as number;
        
        // If value is below threshold, it needs improvement
        if (value < dimension.threshold) {
          improvementAreas.push(name);
        }
      }
    }
    
    return improvementAreas;
  }
  
  /**
   * Get all registered performance dimensions
   */
  public getDimensions(): PerformanceDimension[] {
    return Array.from(this.dimensions.values());
  }
  
  /**
   * Get a specific performance dimension
   */
  public getDimension(name: string): PerformanceDimension | undefined {
    return this.dimensions.get(name);
  }
}

// Export singleton instance
export const performanceTracker = new PerformanceTracker();