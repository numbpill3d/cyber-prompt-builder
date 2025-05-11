/**
 * Auto-Improvement System - Type Definitions
 * 
 * Provides type definitions for the auto-improvement system that enables
 * automated self-improvement cycles based on Evolution Engine metrics.
 */

import { Improvement, EvolutionMetrics, EvolutionReport } from '../evolution/evolution-types';

/**
 * Configuration for the auto-improvement system
 */
export interface AutoImprovementConfig {
  // Enable/disable automated improvement cycles
  enabled: boolean;
  
  // Frequency settings for automated cycles
  frequency: AutoImprovementFrequency;
  
  // Thresholds for triggering improvement tasks
  thresholds: {
    // Minimum priority level to trigger improvement (1-10)
    minPriority: number;
    
    // Maximum number of concurrent improvement tasks
    maxConcurrentTasks: number;
  };
  
  // Notification and reporting settings
  reporting: {
    // Enable notifications for improvements
    notificationsEnabled: boolean;
    
    // Generate detailed reports
    detailedReporting: boolean;
    
    // Store improvement history
    storeHistory: boolean;
  };
  
  // Integration settings
  integrations: {
    // Use memory system for task storage and retrieval
    useMemorySystem: boolean;
    
    // Apply improvements automatically without confirmation
    autoApply: boolean;
  };
}

/**
 * Frequency settings for auto-improvement cycles
 */
export enum AutoImprovementFrequency {
  AFTER_EACH_SESSION = 'afterEachSession',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  ON_THRESHOLD = 'onThreshold', // Only when metrics drop below threshold
  MANUAL = 'manual' // Only when manually triggered
}

/**
 * Status of an improvement task
 */
export enum ImprovementTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SCHEDULED = 'scheduled'
}

/**
 * Result of an improvement task
 */
export interface ImprovementResult {
  successful: boolean;
  metricsBeforeImprovement: Partial<EvolutionMetrics>;
  metricsAfterImprovement?: Partial<EvolutionMetrics>;
  performanceGain?: number; // Percentage improvement
  notes: string;
  timestamp: number;
}

/**
 * An auto-improvement task
 */
export interface ImprovementTask {
  id: string;
  sessionId: string;
  sourceReport: EvolutionReport; // The report that triggered this task
  dimension: string; // The dimension to improve
  improvement: Improvement; // The improvement to implement
  status: ImprovementTaskStatus;
  priority: number; // 1-10
  createdAt: number;
  scheduledFor?: number;
  startedAt?: number;
  completedAt?: number;
  assignedTo?: string; // Component or agent responsible
  result?: ImprovementResult;
}

/**
 * Collection of improvement tasks for tracking and management
 */
export interface ImprovementTaskCollection {
  tasks: ImprovementTask[];
  activeTaskCount: number;
  completedTaskCount: number;
  failedTaskCount: number;
  lastUpdated: number;
}

/**
 * Auto-improvement cycle summary
 */
export interface ImprovementCycleSummary {
  cycleId: string;
  startTime: number;
  endTime: number;
  tasksGenerated: number;
  tasksCompleted: number;
  tasksFailed: number;
  overallPerformanceGain: number;
  dimensionsImproved: string[];
  report: string;
}

/**
 * Task generation strategy
 */
export enum TaskGenerationStrategy {
  PRIORITIZED = 'prioritized', // Focus on highest priority improvements
  BALANCED = 'balanced',       // Balance across different dimensions
  FOCUSED = 'focused',         // Focus on a specific dimension
  COMPREHENSIVE = 'comprehensive' // Address all identified improvements
}

/**
 * Task generation options
 */
export interface TaskGenerationOptions {
  strategy: TaskGenerationStrategy;
  focusDimension?: string;     // For FOCUSED strategy
  maxTasks?: number;           // Maximum tasks to generate
  minPriority?: number;        // Minimum priority threshold
  includeHistoricalData?: boolean; // Include past performance data
}