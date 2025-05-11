/**
 * Evolution Engine Interface
 * Defines the contract for the evolution and self-improvement system
 */

/**
 * Evolution metric type
 */
export interface EvolutionMetric {
  value: number;
  previousValue?: number;
  target?: number;
  min?: number;
  max?: number;
  weight?: number;
  trend?: 'improving' | 'declining' | 'stable';
  trendStrength?: number;
}

/**
 * Evolution metrics collection
 */
export interface EvolutionMetrics {
  promptQuality: EvolutionMetric;
  codeQuality: EvolutionMetric;
  creativity: EvolutionMetric;
  efficiency: EvolutionMetric;
  consistency: EvolutionMetric;
  adaptability: EvolutionMetric;
  learning: EvolutionMetric;
  [key: string]: EvolutionMetric;
}

/**
 * Improvement suggestion
 */
export interface ImprovementSuggestion {
  dimension: string;
  suggestions: string[];
  priority: number;
  reasoning: string;
  algorithmicChanges?: string;
  implementationIdeas?: string[];
  impact?: number;
}

/**
 * Evolution report
 */
export interface EvolutionReport {
  id: string;
  sessionId: string;
  timestamp: number;
  metrics: EvolutionMetrics;
  overallScore: number;
  previousScore?: number;
  improvements: ImprovementSuggestion[];
  strengths: string[];
  summary: string;
}

/**
 * Evolution profile
 */
export interface EvolutionProfile {
  id: string;
  name: string;
  description?: string;
  metrics: EvolutionMetrics;
  targetMetrics: Partial<EvolutionMetrics>;
  createdAt: number;
  updatedAt: number;
}

/**
 * Tracking configuration
 */
export interface TrackingConfig {
  enableTracking: boolean;
  trackingFrequency: 'perSession' | 'perPrompt' | 'custom';
  customInterval?: number;
  saveHistory: boolean;
  historyLimit?: number;
  dimensions?: string[];
}

/**
 * Evolution engine interface
 */
export interface EvolutionEngine {
  // Initialization
  initialize(): Promise<void>;
  
  // Profiling
  createProfile(name: string, description?: string): Promise<EvolutionProfile>;
  getProfile(profileId: string): Promise<EvolutionProfile | null>;
  updateProfile(profileId: string, updates: Partial<EvolutionProfile>): Promise<EvolutionProfile>;
  getAllProfiles(): Promise<EvolutionProfile[]>;
  
  // Tracking
  getTrackingConfig(): TrackingConfig;
  updateTrackingConfig(config: Partial<TrackingConfig>): void;
  
  // Metrics
  trackInteraction(sessionId: string, data: any): Promise<void>;
  evaluateSessionMetrics(sessionId: string): Promise<EvolutionMetrics>;
  
  // Reporting
  generateReport(sessionId: string): Promise<EvolutionReport>;
  getLatestReport(sessionId: string): Promise<EvolutionReport | null>;
  getAllReports(sessionId: string): Promise<EvolutionReport[]>;
  
  // Improvements
  generateImprovementSuggestions(metrics: EvolutionMetrics): Promise<ImprovementSuggestion[]>;
  applyImprovement(improvement: ImprovementSuggestion): Promise<boolean>;
  
  // Performance tracking
  trackPerformance(dimension: string, value: number, sessionId: string): Promise<void>;
  getPerformanceHistory(dimension: string, sessionId?: string): Promise<{timestamp: number, value: number}[]>;
  
  // Export/Import
  exportEvolutionData(sessionId?: string): Promise<string>;
  importEvolutionData(data: string): Promise<number>;
}