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