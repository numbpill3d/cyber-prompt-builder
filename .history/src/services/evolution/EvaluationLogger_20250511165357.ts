/**
 * EvaluationLogger
 * 
 * Provides high-resolution analytics for tracking agent performance and task execution details.
 * Responsible for collecting, storing, and analyzing detailed task metadata.
 */

import { performanceTracker } from './performance-tracker';
import { getMemoryService } from '../memory/memory-service';
import { TaskMetadata, AgentConfig, TaskExecutionMetrics, AgentModification, MetricDelta } from './evolution-types';
import { MemoryType } from '../memory/memory-types';

// Collection names for storing different types of data
const TASK_COLLECTION = 'evolution_tasks';
const AGENT_COLLECTION = 'evolution_agents';
const FORK_COLLECTION = 'evolution_forks';

/**
 * EvaluationLogger - Tracks detailed agent and task performance data
 */
export class EvaluationLogger {
  private initialized: boolean = false;

  /**
   * Initialize the evaluation logger
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const memoryService = await getMemoryService();
      
      // Ensure collections exist
      const collections = await memoryService.listCollections();
      
      // Create task metadata collection if it doesn't exist
      if (!collections.includes(TASK_COLLECTION)) {
        await memoryService.createCollection({
          name: TASK_COLLECTION,
          metadata: {
            description: 'Detailed task execution metadata'
          }
        });
      }
      
      // Create agent config collection if it doesn't exist
      if (!collections.includes(AGENT_COLLECTION)) {
        await memoryService.createCollection({
          name: AGENT_COLLECTION,
          metadata: {
            description: 'Agent configuration tracking'
          }
        });
      }
      
      // Create fork tracking collection if it doesn't exist
      if (!collections.includes(FORK_COLLECTION)) {
        await memoryService.createCollection({
          name: FORK_COLLECTION,
          metadata: {
            description: 'Agent modification and fork tracking'
          }
        });
      }
      
      this.initialized = true;
      console.log('EvaluationLogger initialized');
    } catch (error) {
      console.error('Failed to initialize EvaluationLogger:', error);
      throw error;
    }
  }

  /**
   * Record task execution details with high-res metadata
   */
  public async recordTaskExecution(
    taskMetadata: TaskMetadata,
    executionMetrics: TaskExecutionMetrics
  ): Promise<string> {
    await this.initialize();
    
    const timestamp = Date.now();
    const recordId = `task_${timestamp}_${Math.random().toString(36).substring(2, 10)}`;
    
    const taskRecord = {
      id: recordId,
      timestamp,
      metadata: taskMetadata,
      metrics: executionMetrics
    };
    
    try {
      const memoryService = await getMemoryService();
      await memoryService.addMemory(
        TASK_COLLECTION,
        JSON.stringify(taskRecord),
        {
          sessionId: taskMetadata.sessionId,
          type: MemoryType.CONTEXT,
          source: 'evolution-engine',
          tags: [
            'task', 
            taskMetadata.taskType,
            taskMetadata.agentConfig.model,
            taskMetadata.agentConfig.provider
          ],
          custom: {
            taskType: taskMetadata.taskType,
            model: taskMetadata.agentConfig.model,
            provider: taskMetadata.agentConfig.provider,
            success: executionMetrics.successful,
            timestamp
          }
        }
      );
      
      // Also record performance metrics for the task
      await performanceTracker.recordMetrics({
        accuracy: executionMetrics.accuracy,
        relevance: executionMetrics.relevance,
        complexity: executionMetrics.complexity,
        efficiency: executionMetrics.efficiency,
        responsiveness: executionMetrics.responseTime / 10000, // Normalize to 0-1
        successRate: executionMetrics.successful ? 1 : 0,
        userSatisfaction: executionMetrics.userSatisfaction,
        adaptability: executionMetrics.adaptability,
        knowledgeGrowth: 0, // Not tracked per task
        taskType: taskMetadata.taskType,
        modelId: taskMetadata.agentConfig.model,
        rawPerformance: {
          tokenCount: executionMetrics.tokenCount,
          responseTime: executionMetrics.responseTime,
          iterationCount: executionMetrics.iterationCount,
          userEditsRequired: executionMetrics.userEditsCount
        }
      }, taskMetadata.sessionId, taskMetadata.agentConfig.model);
      
      return recordId;
    } catch (error) {
      console.error('Failed to record task execution:', error);
      throw error;
    }
  }
  
  /**
   * Register an agent configuration for tracking
   */
  public async registerAgentConfig(agentConfig: AgentConfig): Promise<string> {
    await this.initialize();
    
    const timestamp = Date.now();
    const agentId = agentConfig.id || `agent_${timestamp}_${Math.random().toString(36).substring(2, 10)}`;
    
    if (!agentConfig.id) {
      agentConfig.id = agentId;
    }
    
    agentConfig.createdAt = agentConfig.createdAt || timestamp;
    agentConfig.updatedAt = timestamp;
    
    try {
      const memoryService = await getMemoryService();
      await memoryService.addMemory(
        AGENT_COLLECTION,
        JSON.stringify(agentConfig),
        {
          sessionId: 'system',
          type: MemoryType.CONTEXT,
          source: 'evolution-engine',
          tags: ['agent', agentConfig.model, agentConfig.provider],
          custom: {
            agentId,
            model: agentConfig.model,
            provider: agentConfig.provider,
            version: agentConfig.version,
            timestamp
          }
        }
      );
      
      return agentId;
    } catch (error) {
      console.error('Failed to register agent config:', error);
      throw error;
    }
  }
  
  /**
   * Record an agent modification/fork
   */
  public async recordAgentModification(
    modification: AgentModification
  ): Promise<string> {
    await this.initialize();
    
    const timestamp = Date.now();
    const modificationId = `mod_${timestamp}_${Math.random().toString(36).substring(2, 10)}`;
    
    modification.id = modificationId;
    modification.timestamp = timestamp;
    
    // Ensure the parent and child agent exist
    try {
      const memoryService = await getMemoryService();
      
      // Record the modification
      await memoryService.addMemory(
        FORK_COLLECTION,
        JSON.stringify(modification),
        {
          sessionId: 'system',
          type: MemoryType.CONTEXT,
          source: 'evolution-engine',
          tags: ['fork', 'modification', modification.parentAgentId, modification.childAgentId],
          custom: {
            modificationId,
            parentAgentId: modification.parentAgentId,
            childAgentId: modification.childAgentId,
            timestamp
          }
        }
      );
      
      return modificationId;
    } catch (error) {
      console.error('Failed to record agent modification:', error);
      throw error;
    }
  }
  
  /**
   * Get all task executions for a specific agent
   */
  public async getAgentTaskExecutions(
    agentId: string, 
    limit: number = 100
  ): Promise<Array<{metadata: TaskMetadata, metrics: TaskExecutionMetrics}>> {
    await this.initialize();
    
    try {
      const memoryService = await getMemoryService();
      const result = await memoryService.searchMemories(TASK_COLLECTION, {
        filter: { 'metadata.custom.model': agentId },
        limit,
        sortBy: 'timestamp',
        sortDirection: 'desc'
      });
      
      return result.entries.map(entry => {
        const data = JSON.parse(entry.content);
        return {
          metadata: data.metadata,
          metrics: data.metrics
        };
      });
    } catch (error) {
      console.error('Failed to get agent task executions:', error);
      return [];
    }
  }
  
  /**
   * Get all tracked agents
   */
  public async getAllAgents(): Promise<AgentConfig[]> {
    await this.initialize();
    
    try {
      const memoryService = await getMemoryService();
      const result = await memoryService.searchMemories(AGENT_COLLECTION, {
        tags: ['agent']
      });
      
      return result.entries.map(entry => JSON.parse(entry.content));
    } catch (error) {
      console.error('Failed to get all agents:', error);
      return [];
    }
  }
  
  /**
   * Get agent modification history (fork tree)
   */
  public async getAgentModificationHistory(rootAgentId: string): Promise<AgentModification[]> {
    await this.initialize();
    
    try {
      const memoryService = await getMemoryService();
      const result = await memoryService.searchMemories(FORK_COLLECTION, {
        tags: ['fork', rootAgentId]
      });
      
      return result.entries.map(entry => JSON.parse(entry.content));
    } catch (error) {
      console.error('Failed to get agent modification history:', error);
      return [];
    }
  }
  
  /**
   * Calculate performance deltas between agent versions
   */
  public async calculatePerformanceDeltas(
    baseAgentId: string,
    comparisonAgentId: string,
    metricTypes: string[] = []
  ): Promise<MetricDelta[]> {
    await this.initialize();
    
    try {
      // Get base agent performance metrics
      const baseMetrics = await performanceTracker.getModelMetrics(baseAgentId);
      
      // Get comparison agent performance metrics
      const comparisonMetrics = await performanceTracker.getModelMetrics(comparisonAgentId);
      
      if (baseMetrics.length === 0 || comparisonMetrics.length === 0) {
        return [];
      }
      
      // Calculate averages for each metric type
      const baseAverages = this.calculateAverageMetrics(baseMetrics);
      const comparisonAverages = this.calculateAverageMetrics(comparisonMetrics);
      
      // Calculate deltas
      const deltas: MetricDelta[] = [];
      
      // If specific metric types requested, use only those
      const metricKeys = metricTypes.length > 0 
        ? metricTypes 
        : Object.keys(baseAverages);
      
      for (const metricKey of metricKeys) {
        if (metricKey in baseAverages && metricKey in comparisonAverages) {
          const baseValue = baseAverages[metricKey];
          const comparisonValue = comparisonAverages[metricKey];
          const absoluteDelta = comparisonValue - baseValue;
          const percentageDelta = baseValue !== 0 
            ? (absoluteDelta / baseValue) * 100 
            : 0;
          
          deltas.push({
            metricName: metricKey,
            baseValue,
            newValue: comparisonValue,
            absoluteDelta,
            percentageDelta,
            improvement: absoluteDelta > 0
          });
        }
      }
      
      return deltas;
    } catch (error) {
      console.error('Failed to calculate performance deltas:', error);
      return [];
    }
  }
  
  /**
   * Helper function to calculate average metrics
   */
  private calculateAverageMetrics(metrics: EvolutionMetrics[]): Record<string, number> {
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};
    
    // Calculate sums
    for (const metric of metrics) {
      for (const [key, value] of Object.entries(metric)) {
        if (typeof value === 'number') {
          sums[key] = (sums[key] || 0) + value;
          counts[key] = (counts[key] || 0) + 1;
        }
      }
    }
    
    // Calculate averages
    const averages: Record<string, number> = {};
    for (const key in sums) {
      averages[key] = sums[key] / counts[key];
    }
    
    return averages;
  }
  
  /**
   * Generate performance scorecards for an agent
   */
  public async generateAgentScorecard(agentId: string): Promise<AgentScorecard> {
    await this.initialize();
    
    try {
      // Get all metrics for this agent
      const metrics = await performanceTracker.getModelMetrics(agentId);
      
      if (metrics.length === 0) {
        return {
          agentId,
          score: 0,
          metrics: {},
          trends: {},
          taskBreakdown: {}
        };
      }
      
      // Get agent details
      const agents = await this.getAllAgents();
      const agent = agents.find(a => a.id === agentId);
      
      // Calculate overall score
      const averageMetrics = this.calculateAverageMetrics(metrics);
      const score = performanceTracker.calculatePerformanceScore({
        ...averageMetrics,
        timestamp: Date.now(),
        sessionId: 'analysis',
        modelId: agentId,
        taskType: 'scorecard'
      });
      
      // Generate trends over time
      const trends = this.calculateMetricTrends(metrics);
      
      // Calculate task type breakdown
      const taskBreakdown = this.calculateTaskTypeBreakdown(metrics);
      
      return {
        agentId,
        agent,
        score,
        metrics: averageMetrics,
        trends,
        taskBreakdown,
        sampleSize: metrics.length,
        generatedAt: Date.now()
      };
    } catch (error) {
      console.error('Failed to generate agent scorecard:', error);
      throw error;
    }
  }
  
  /**
   * Calculate metric trends over time
   */
  private calculateMetricTrends(metrics: EvolutionMetrics[]): Record<string, MetricTrend> {
    // Sort metrics by timestamp
    const sortedMetrics = [...metrics].sort((a, b) => a.timestamp - b.timestamp);
    
    // Prepare result structure
    const trends: Record<string, MetricTrend> = {};
    
    // Get all numeric metric keys
    const metricKeys = new Set<string>();
    for (const metric of sortedMetrics) {
      Object.entries(metric).forEach(([key, value]) => {
        if (typeof value === 'number' && key !== 'timestamp') {
          metricKeys.add(key);
        }
      });
    }
    
    // Calculate trends for each metric
    for (const key of metricKeys) {
      const values = sortedMetrics.map(m => ({
        timestamp: m.timestamp,
        value: m[key] || 0
      }));
      
      // Skip metrics with insufficient data
      if (values.length < 2) continue;
      
      // Calculate simple linear regression
      const regression = this.calculateLinearRegression(values);
      
      trends[key] = {
        values,
        slope: regression.slope,
        direction: regression.slope > 0 ? 'improving' : regression.slope < 0 ? 'declining' : 'stable',
        strengthPercent: Math.abs(regression.slope) * 1000, // Scale for visibility
        firstValue: values[0].value,
        lastValue: values[values.length - 1].value,
        changePercent: values[0].value !== 0 
          ? ((values[values.length - 1].value - values[0].value) / values[0].value) * 100 
          : 0
      };
    }
    
    return trends;
  }
  
  /**
   * Calculate simple linear regression
   */
  private calculateLinearRegression(points: Array<{timestamp: number, value: number}>): {slope: number, intercept: number} {
    // Normalize timestamps to avoid numerical issues
    const firstTimestamp = points[0].timestamp;
    const normalizedPoints = points.map(p => ({
      x: (p.timestamp - firstTimestamp) / (24 * 60 * 60 * 1000), // Convert to days
      y: p.value
    }));
    
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    const n = normalizedPoints.length;
    
    for (const point of normalizedPoints) {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumXX += point.x * point.x;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }
  
  /**
   * Calculate task type breakdown
   */
  private calculateTaskTypeBreakdown(metrics: EvolutionMetrics[]): Record<string, TaskTypePerformance> {
    const taskTypes: Record<string, {
      count: number,
      successCount: number,
      averageMetrics: Record<string, number>
    }> = {};
    
    for (const metric of metrics) {
      const taskType = metric.taskType || 'unknown';
      
      if (!taskTypes[taskType]) {
        taskTypes[taskType] = {
          count: 0,
          successCount: 0,
          averageMetrics: {}
        };
      }
      
      // Increment counters
      taskTypes[taskType].count++;
      
      if (metric.successRate === 1) {
        taskTypes[taskType].successCount++;
      }
      
      // Update metrics
      for (const [key, value] of Object.entries(metric)) {
        if (typeof value === 'number' && key !== 'timestamp') {
          taskTypes[taskType].averageMetrics[key] = taskTypes[taskType].averageMetrics[key] || 0;
          taskTypes[taskType].averageMetrics[key] += value;
        }
      }
    }
    
    // Calculate averages
    for (const taskType in taskTypes) {
      const count = taskTypes[taskType].count;
      
      for (const key in taskTypes[taskType].averageMetrics) {
        taskTypes[taskType].averageMetrics[key] /= count;
      }
      
      // Add success rate
      taskTypes[taskType].successRate = taskTypes[taskType].successCount / count;
    }
    
    return taskTypes;
  }
}

// Export singleton instance
export const evaluationLogger = new EvaluationLogger();