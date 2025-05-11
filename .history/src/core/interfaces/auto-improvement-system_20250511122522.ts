/**
 * Auto-Improvement System Interface
 * Defines the contract for the auto-improvement system that enables 
 * autonomous self-improvement cycles based on Evolution Engine metrics
 */

import { ImprovementSuggestion, EvolutionReport } from './evolution-engine';

/**
 * Auto-improvement frequency enum
 */
export enum AutoImprovementFrequency {
  MANUAL = 'manual',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  AFTER_EACH_SESSION = 'after_each_session',
  ON_THRESHOLD = 'on_threshold'
}

/**
 * Auto-improvement configuration
 */
export interface AutoImprovementConfig {
  enabled: boolean;
  frequency: AutoImprovementFrequency;
  thresholds: {
    minPriority: number;
    maxConcurrentTasks: number;
  };
  reporting: {
    notificationsEnabled: boolean;
    detailedReporting: boolean;
    storeHistory: boolean;
  };
  integrations: {
    useMemorySystem: boolean;
    autoApply: boolean;
  };
}

/**
 * Improvement task status enum
 */
export enum ImprovementTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Improvement task result
 */
export interface ImprovementTaskResult {
  successful: boolean;
  metricsBeforeImprovement: Record<string, any>;
  metricsAfterImprovement?: Record<string, any>;
  notes: string;
  timestamp: number;
}

/**
 * Improvement task
 */
export interface ImprovementTask {
  id: string;
  sessionId: string;
  improvement: ImprovementSuggestion;
  status: ImprovementTaskStatus;
  priority: number;
  dimension: string;
  sourceReport: EvolutionReport;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: ImprovementTaskResult;
}

/**
 * Improvement task collection
 */
export interface ImprovementTaskCollection {
  tasks: ImprovementTask[];
  activeTaskCount: number;
  completedTaskCount: number;
  failedTaskCount: number;
  lastUpdated: number;
}

/**
 * Improvement cycle summary
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
 * Task generation strategy enum
 */
export enum TaskGenerationStrategy {
  BALANCED = 'balanced',
  PRIORITIZED = 'prioritized',
  FOCUSED = 'focused'
}

/**
 * Task generation options
 */
export interface TaskGenerationOptions {
  strategy: TaskGenerationStrategy;
  maxTasks: number;
  minPriority: number;
  includeHistoricalData: boolean;
  focusDimension?: string;
}

/**
 * Auto-improvement system interface
 */
export interface AutoImprovementSystem {
  // Initialization
  initialize(): Promise<void>;
  
  // Configuration
  getConfig(): AutoImprovementConfig;
  updateConfig(config: Partial<AutoImprovementConfig>): void;
  
  // Task management
  getTasks(): ImprovementTask[];
  getTasksByStatus(status: ImprovementTaskStatus): ImprovementTask[];
  getTasksForSession(sessionId: string): ImprovementTask[];
  getTask(taskId: string): ImprovementTask | undefined;
  addTask(task: ImprovementTask): Promise<ImprovementTask>;
  updateTask(taskId: string, updates: Partial<ImprovementTask>): Promise<ImprovementTask | null>;
  
  // Improvement cycles
  runImprovementCycle(sessionId?: string, options?: Partial<TaskGenerationOptions>): Promise<ImprovementCycleSummary>;
  
  // Event handlers
  handleSessionCompleted(sessionId: string): Promise<void>;
  handleMetricsBelowThreshold(sessionId: string, dimension: string, value: number): Promise<void>;
}