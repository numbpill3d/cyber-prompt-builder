/**
 * AgentMetricsManager
 * 
 * Provides high-level APIs for tracking and visualizing agent performance metrics.
 * Acts as a facade for the EvaluationLogger and adds visualization capabilities.
 */

import { evaluationLogger } from './EvaluationLogger';
import { 
  AgentConfig, 
  TaskMetadata, 
  TaskExecutionMetrics, 
  AgentModification,
  MetricDelta,
  AgentScorecard,
  EvolutionMetrics
} from './evolution-types';
import { getMemoryService } from '../memory/memory-service';

/**
 * AgentMetricsManager - Handles agent performance tracking and visualization
 */
export class AgentMetricsManager {
  private initialized: boolean = false;

  /**
   * Initialize the metrics manager
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Initialize the evaluation logger
    await evaluationLogger.initialize();
    
    this.initialized = true;
    console.log('AgentMetricsManager initialized');
  }

  /**
   * Track a task execution with detailed metrics
   * 
   * @param taskMetadata Task metadata including agent configuration
   * @param metrics Performance metrics for the task execution
   * @returns ID of the recorded task
   */
  public async trackTask(
    taskMetadata: TaskMetadata,
    metrics: TaskExecutionMetrics
  ): Promise<string> {
    await this.initialize();
    return evaluationLogger.recordTaskExecution(taskMetadata, metrics);
  }

  /**
   * Register a new agent configuration for tracking
   * 
   * @param agentConfig Agent configuration details
   * @returns ID of the registered agent
   */
  public async registerAgent(agentConfig: AgentConfig): Promise<string> {
    await this.initialize();
    return evaluationLogger.registerAgentConfig(agentConfig);
  }

  /**
   * Track a modification (fork) between agent versions
   * 
   * @param modification Details of the agent modification
   * @returns ID of the recorded modification
   */
  public async trackAgentModification(modification: AgentModification): Promise<string> {
    await this.initialize();
    
    // If we have performance metrics for both agents, calculate the impact
    if (!modification.performanceImpact) {
      const deltas = await evaluationLogger.calculatePerformanceDeltas(
        modification.parentAgentId,
        modification.childAgentId
      );
      
      if (deltas.length > 0) {
        modification.performanceImpact = deltas;
      }
    }
    
    return evaluationLogger.recordAgentModification(modification);
  }

  /**
   * Generate a performance scorecard for an agent
   * 
   * @param agentId ID of the agent to generate scorecard for
   * @returns Agent performance scorecard
   */
  public async generateScorecard(agentId: string): Promise<AgentScorecard> {
    await this.initialize();
    return evaluationLogger.generateAgentScorecard(agentId);
  }

  /**
   * Compare performance between two agent versions
   * 
   * @param baseAgentId ID of the base agent
   * @param targetAgentId ID of the target agent to compare against
   * @returns Array of metric deltas between agents
   */
  public async compareAgents(
    baseAgentId: string,
    targetAgentId: string
  ): Promise<MetricDelta[]> {
    await this.initialize();
    return evaluationLogger.calculatePerformanceDeltas(baseAgentId, targetAgentId);
  }

  /**
   * Get the performance timeline for an agent
   * 
   * @param agentId ID of the agent
   * @param metricName Name of the metric to track
   * @returns Array of timestamped metric values
   */
  public async getPerformanceTimeline(
    agentId: string, 
    metricName: string
  ): Promise<Array<{timestamp: number, value: number}>> {
    await this.initialize();
    
    const metrics = await evaluationLogger.getAgentTaskExecutions(agentId);
    
    return metrics
      .filter(data => data.metrics && typeof data.metrics[metricName as keyof TaskExecutionMetrics] === 'number')
      .map(data => ({
        timestamp: data.metadata.timestamp || 0,
        value: data.metrics[metricName as keyof TaskExecutionMetrics] as number
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get the modification history (fork tree) for an agent
   * 
   * @param rootAgentId ID of the root agent
   * @returns Array of agent modifications
   */
  public async getModificationHistory(rootAgentId: string): Promise<AgentModification[]> {
    await this.initialize();
    return evaluationLogger.getAgentModificationHistory(rootAgentId);
  }

  /**
   * Get all registered agents
   * 
   * @returns Array of agent configurations
   */
  public async getAllAgents(): Promise<AgentConfig[]> {
    await this.initialize();
    return evaluationLogger.getAllAgents();
  }

  /**
   * Generate visualization data for cause-effect mapping
   * 
   * @param rootAgentId ID of the root agent
   * @returns Data structure for visualizing cause-effect relationships
   */
  public async generateCauseEffectMap(rootAgentId: string): Promise<{
    nodes: Array<{id: string, label: string, type: string}>,
    links: Array<{source: string, target: string, label: string, impact: number}>
  }> {
    await this.initialize();
    
    // Get agent modification history
    const modifications = await this.getModificationHistory(rootAgentId);
    
    // Get all involved agents
    const agentIds = new Set<string>();
    agentIds.add(rootAgentId);
    
    modifications.forEach(mod => {
      agentIds.add(mod.parentAgentId);
      agentIds.add(mod.childAgentId);
    });
    
    // Get agent details
    const agents = await this.getAllAgents();
    const relevantAgents = agents.filter(agent => agentIds.has(agent.id || ''));
    
    // Prepare nodes and links
    const nodes = relevantAgents.map(agent => ({
      id: agent.id || '',
      label: agent.name || agent.model,
      type: 'agent'
    }));
    
    const links = modifications.map(mod => {
      // Calculate overall impact
      let totalImpact = 0;
      let impactLabel = '';
      
      if (mod.performanceImpact && mod.performanceImpact.length > 0) {
        const positiveImpacts = mod.performanceImpact.filter(delta => delta.improvement);
        const avgImpact = positiveImpacts.reduce((sum, delta) => sum + delta.percentageDelta, 0) / 
          (positiveImpacts.length || 1);
        
        totalImpact = avgImpact;
        
        // Create impact label from top 3 improvements
        const topImprovements = [...positiveImpacts]
          .sort((a, b) => b.percentageDelta - a.percentageDelta)
          .slice(0, 3);
        
        impactLabel = topImprovements.map(imp => 
          `${imp.metricName}: ${imp.percentageDelta > 0 ? '+' : ''}${imp.percentageDelta.toFixed(1)}%`
        ).join(', ');
      }
      
      return {
        source: mod.parentAgentId,
        target: mod.childAgentId,
        label: mod.modificationDescription + (impactLabel ? ` → ${impactLabel}` : ''),
        impact: totalImpact
      };
    });
    
    return { nodes, links };
  }

  /**
   * Generate comparative visualization data for multiple agents
   * 
   * @param agentIds Array of agent IDs to compare
   * @returns Data structure for visualizing agent comparisons
   */
  public async generateAgentComparison(agentIds: string[]): Promise<{
    labels: string[],
    datasets: Array<{
      label: string,
      data: number[],
      backgroundColor: string
    }>
  }> {
    await this.initialize();
    
    // Get agent details
    const agents = await this.getAllAgents();
    const relevantAgents = agents.filter(agent => agentIds.includes(agent.id || ''));
    
    // Get scorecards for each agent
    const scorecards = await Promise.all(
      relevantAgents.map(agent => this.generateScorecard(agent.id || ''))
    );
    
    // Prepare metrics for comparison
    const allMetrics = new Set<string>();
    scorecards.forEach(card => {
      Object.keys(card.metrics).forEach(key => allMetrics.add(key));
    });
    
    // Filter out non-numeric or internal metrics
    const metricsToShow = Array.from(allMetrics).filter(metric => 
      !['timestamp', 'sessionId', 'modelId', 'taskType'].includes(metric)
    );
    
    // Prepare chart data
    const chartData = {
      labels: relevantAgents.map(agent => agent.name || agent.model),
      datasets: metricsToShow.map((metric, index) => {
        // Generate a deterministic color based on the metric name
        const hue = (index * 137) % 360;
        
        return {
          label: metric,
          data: scorecards.map(card => card.metrics[metric] || 0),
          backgroundColor: `hsla(${hue}, 70%, 60%, 0.7)`
        };
      })
    };
    
    return chartData;
  }
}

// Export singleton instance
export const agentMetricsManager = new AgentMetricsManager();