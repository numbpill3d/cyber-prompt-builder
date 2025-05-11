/**
 * Evolution Engine - Type Definitions
 * Core data structures for the evolution engine that tracks and improves agent performance
 */

/**
 * Core evolution metrics for measuring agent performance
 */
export interface EvolutionMetrics {
  // Core metrics
  accuracy: number;         // Correctness of responses (0-1)
  relevance: number;        // Relevance to prompt (0-1)
  complexity: number;       // Complexity of handled tasks (0-10)
  efficiency: number;       // Resource usage efficiency (0-1)
  responsiveness: number;   // Speed of response (0-1)
  
  // Usage metrics
  successRate: number;      // Successful completion rate (0-1)
  userSatisfaction: number; // User feedback score (0-1)
  
  // Learning metrics
  adaptability: number;     // Adaptation to new tasks (0-1)
  knowledgeGrowth: number;  // Growth in knowledge areas (0-1)
  
  // Timestamp
  timestamp: number;
  
  // Context
  sessionId: string;
  modelId: string;
  taskType: string;
  
  // Raw data
  rawFeedback?: any;        // Raw user feedback data
  rawPerformance?: any;     // Raw performance data
}

/**
 * Performance dimension definition
 */
export interface PerformanceDimension {
  name: string;
  value: number;
  weight: number;
  threshold: number;        // Minimum acceptable value
  target: number;           // Target value for optimization
  description: string;
}

/**
 * Evolution report structure
 */
export interface EvolutionReport {
  sessionId: string;
  timestamp: number;
  metrics: EvolutionMetrics;
  dimensions: PerformanceDimension[];
  improvements: Improvement[];
  score: number;            // Aggregate performance score
  summary: string;          // Text summary of performance
}

/**
 * Improvement suggestion
 */
export interface Improvement {
  dimension: string;
  currentValue: number;
  targetValue: number;
  priority: number;         // 1-10, 10 being highest priority
  suggestions: string[];
  implemented: boolean;
}

/**
 * Configuration for the evolution service
 */
export interface EvolutionConfig {
  enableAutoOptimization: boolean;
  trackingFrequency: 'always' | 'session' | 'daily';
  dimensions: PerformanceDimension[];
  persistenceEnabled: boolean;
  thresholds: {
    success: number;        // Threshold for success
    warning: number;        // Threshold for warning
    failure: number;        // Threshold for failure
  };
}

/**
 * Evolution Engine enums
 */
export enum EvolutionMetricType {
  ACCURACY = 'accuracy',
  RELEVANCE = 'relevance',
  COMPLEXITY = 'complexity',
  EFFICIENCY = 'efficiency',
  RESPONSIVENESS = 'responsiveness',
  SUCCESS_RATE = 'successRate',
  USER_SATISFACTION = 'userSatisfaction',
  ADAPTABILITY = 'adaptability',
  KNOWLEDGE_GROWTH = 'knowledgeGrowth'
}

export enum ImprovementPriority {
  LOW = 1,
  MEDIUM = 5,
  HIGH = 10
}

export enum PerformanceLevel {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  SATISFACTORY = 'satisfactory',
  NEEDS_IMPROVEMENT = 'needsImprovement',
  POOR = 'poor'
}

/**
 * NEW TYPES FOR ENHANCED METRICS TRACKING
 */

/**
 * Task metadata - Captures detailed information about a task execution
 */
export interface TaskMetadata {
  // Task identification
  id?: string;
  sessionId: string;
  timestamp?: number;
  
  // Task classification
  taskType: string;
  taskDescription?: string;
  taskCategory?: string;
  taskTags?: string[];
  
  // Agent information
  agentConfig: AgentConfig;
  
  // Context information
  contextSize?: number;
  inputTokenCount?: number;
  previousTasks?: string[];
}

/**
 * Agent configuration - Captures details about the AI agent
 */
export interface AgentConfig {
  // Basic identification
  id?: string;
  name?: string;
  version: string;
  
  // Model details
  model: string;
  provider: string;
  temperature?: number;
  maxTokens?: number;
  
  // System configuration
  systemPrompt?: string;
  configParameters?: Record<string, unknown>;
  
  // Tracking
  createdAt?: number;
  updatedAt?: number;
  parentId?: string;
}

/**
 * Task execution metrics - Performance data from task execution
 */
export interface TaskExecutionMetrics {
  // Execution stats
  startTime: number;
  endTime?: number;
  responseTime: number;
  tokenCount: number;
  inputTokenCount?: number;
  outputTokenCount?: number;
  
  // Quality metrics
  successful: boolean;
  accuracy: number;
  relevance: number;
  complexity: number;
  efficiency: number;
  
  // User interaction
  userEditsCount: number;
  userOverrides: boolean;
  userSatisfaction: number;
  
  // System performance
  iterationCount: number;
  completionAttempts: number;
  errorCount: number;
  
  // Adaptability
  adaptability: number;
  
  // Raw data
  rawPerformance?: Record<string, unknown>;
}

/**
 * Agent modification - Tracks changes made to agent configuration
 */
export interface AgentModification {
  id?: string;
  timestamp?: number;
  
  // Agent identifiers
  parentAgentId: string;
  childAgentId: string;
  
  // Modification details
  modificationType: 'fork' | 'update' | 'merge';
  modificationDescription: string;
  
  // What changed
  changedParameters: Array<{
    parameter: string;
    oldValue: unknown;
    newValue: unknown;
    reason?: string;
  }>;
  
  // Performance impact
  performanceImpact?: Array<MetricDelta>;
  
  // Tracking
  createdBy: 'user' | 'system' | 'auto-optimization';
}

/**
 * Metric delta - Performance difference between agent versions
 */
export interface MetricDelta {
  metricName: string;
  baseValue: number;
  newValue: number;
  absoluteDelta: number;
  percentageDelta: number;
  improvement: boolean;
}

/**
 * Agent scorecard - Comprehensive performance analysis for an agent
 */
export interface AgentScorecard {
  agentId: string;
  agent?: AgentConfig;
  score: number;
  metrics: Record<string, number>;
  trends: Record<string, MetricTrend>;
  taskBreakdown: Record<string, TaskTypePerformance>;
  sampleSize: number;
  generatedAt: number;
}

/**
 * Metric trend - Analysis of how a metric changes over time
 */
export interface MetricTrend {
  values: Array<{timestamp: number, value: number}>;
  slope: number;
  direction: 'improving' | 'declining' | 'stable';
  strengthPercent: number;
  firstValue: number;
  lastValue: number;
  changePercent: number;
}

/**
 * Task type performance breakdown
 */
export interface TaskTypePerformance {
  count: number;
  successCount: number;
  successRate: number;
  averageMetrics: Record<string, number>;
}

/**
 * Serialized metric value with timestamp
 */
export interface TimestampedMetric {
  timestamp: number;
  value: number;
  metricName?: string;
}