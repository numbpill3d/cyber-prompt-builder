/**
 * Evolution Service Implementation
 * Implements the EvolutionEngine interface
 */

import {
  EvolutionEngine,
  EvolutionMetric,
  EvolutionMetrics,
  ImprovementSuggestion,
  EvolutionReport,
  EvolutionProfile,
  TrackingConfig
} from '../../core/interfaces/evolution-engine';
import { MemoryService, MemoryType } from '../../core/interfaces/memory-engine';
import { getService } from '../../core/services/service-locator';

/**
 * Generate a simple ID with optional prefix
 */
function generateId(prefix: string = ''): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Default evolution metrics 
 */
function createDefaultMetrics(): EvolutionMetrics {
  return {
    promptQuality: { value: 0.5 },
    codeQuality: { value: 0.5 },
    creativity: { value: 0.5 },
    efficiency: { value: 0.5 },
    consistency: { value: 0.5 },
    adaptability: { value: 0.5 },
    learning: { value: 0.5 }
  };
}

/**
 * Implementation of Evolution Engine
 */
export class EvolutionService implements EvolutionEngine {
  private memoryService: MemoryService;
  private profiles: Map<string, EvolutionProfile> = new Map();
  private reports: Map<string, EvolutionReport[]> = new Map();
  private trackingConfig: TrackingConfig;
  private performanceHistory: Map<string, { timestamp: number, value: number }[]> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.memoryService = getService<MemoryService>('memoryService');
    
    // Default tracking configuration
    this.trackingConfig = {
      enableTracking: true,
      trackingFrequency: 'perSession',
      saveHistory: true,
      historyLimit: 50,
      dimensions: [
        'promptQuality', 'codeQuality', 'creativity', 'efficiency', 
        'consistency', 'adaptability', 'learning'
      ]
    };
  }

  /**
   * Initialize the evolution engine
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Create collection for evolution data
      await this.memoryService.createCollection({
        name: 'evolution',
        dimensions: 1536 // Match memory service embedding dimensions
      });
      
      // Load existing profiles
      await this.loadProfiles();
      
      // Create default profile if none exists
      if (this.profiles.size === 0) {
        await this.createProfile('Default', 'Default evolution profile');
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize evolution engine:', error);
      throw error;
    }
  }

  /**
   * Load profiles from memory service
   */
  private async loadProfiles(): Promise<void> {
    try {
      const results = await this.memoryService.searchMemories('evolution', {
        filter: { 'metadata.custom.type': 'profile' }
      });
      
      for (const entry of results.entries) {
        try {
          const profile = JSON.parse(entry.content) as EvolutionProfile;
          this.profiles.set(profile.id, profile);
        } catch (e) {
          console.error('Failed to parse profile:', e);
        }
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  }

  /**
   * Create a new evolution profile
   */
  async createProfile(name: string, description?: string): Promise<EvolutionProfile> {
    const profile: EvolutionProfile = {
      id: generateId('profile'),
      name,
      description,
      metrics: createDefaultMetrics(),
      targetMetrics: {
        promptQuality: { value: 0.8, target: 0.9 },
        codeQuality: { value: 0.8, target: 0.9 },
        creativity: { value: 0.7, target: 0.8 },
        efficiency: { value: 0.7, target: 0.9 },
        consistency: { value: 0.8, target: 0.9 },
        adaptability: { value: 0.6, target: 0.8 },
        learning: { value: 0.6, target: 0.9 }
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Save to memory
    await this.memoryService.addMemory('evolution', 
      JSON.stringify(profile),
      {
        type: 'METADATA' as any, // Cast to avoid type issues
        source: 'evolution',
        sessionId: 'system',
        custom: {
          type: 'profile',
          profileId: profile.id
        }
      }
    );
    
    // Add to local cache
    this.profiles.set(profile.id, profile);
    
    return profile;
  }

  /**
   * Get a profile by ID
   */
  async getProfile(profileId: string): Promise<EvolutionProfile | null> {
    return this.profiles.get(profileId) || null;
  }

  /**
   * Update a profile
   */
  async updateProfile(profileId: string, updates: Partial<EvolutionProfile>): Promise<EvolutionProfile> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile with ID ${profileId} not found`);
    }
    
    // Apply updates
    const updatedProfile: EvolutionProfile = {
      ...profile,
      ...updates,
      id: profile.id, // Ensure ID doesn't change
      updatedAt: Date.now()
    };
    
    // Save to memory
    await this.memoryService.searchMemories('evolution', {
      filter: { 'metadata.custom.profileId': profileId }
    }).then(result => {
      if (result.entries.length > 0) {
        return this.memoryService.updateMemory('evolution', result.entries[0].id, {
          content: JSON.stringify(updatedProfile),
          updatedAt: Date.now()
        });
      }
    });
    
    // Update local cache
    this.profiles.set(profileId, updatedProfile);
    
    return updatedProfile;
  }

  /**
   * Get all profiles
   */
  async getAllProfiles(): Promise<EvolutionProfile[]> {
    return Array.from(this.profiles.values());
  }

  /**
   * Get tracking configuration
   */
  getTrackingConfig(): TrackingConfig {
    return { ...this.trackingConfig };
  }

  /**
   * Update tracking configuration
   */
  updateTrackingConfig(config: Partial<TrackingConfig>): void {
    this.trackingConfig = {
      ...this.trackingConfig,
      ...config
    };
  }

  /**
   * Track interaction for metrics analysis
   */
  async trackInteraction(sessionId: string, data: any): Promise<void> {
    if (!this.trackingConfig.enableTracking) return;
    
    // Store interaction data in memory
    await this.memoryService.addMemory('evolution',
      JSON.stringify(data),
      {
        type: 'METADATA' as any,
        source: 'evolution_interaction',
        sessionId,
        custom: {
          type: 'interaction',
          timestamp: Date.now()
        }
      }
    );
    
    // If tracking frequency is per prompt, evaluate metrics now
    if (this.trackingConfig.trackingFrequency === 'perPrompt') {
      await this.evaluateSessionMetrics(sessionId);
    }
  }

  /**
   * Evaluate metrics for a session
   */
  async evaluateSessionMetrics(sessionId: string): Promise<EvolutionMetrics> {
    // Get interaction data for the session
    const interactions = await this.memoryService.searchMemories('evolution', {
      sessionId,
      filter: { 'metadata.custom.type': 'interaction' },
      sortBy: 'createdAt',
      sortDirection: 'desc',
      maxResults: 50
    });
    
    // Get the most recent metrics for the session
    const previousMetrics = await this.getLatestSessionMetrics(sessionId);
    
    // Calculate new metrics based on interactions
    const metrics = this.calculateMetrics(interactions.entries, previousMetrics);
    
    // Store the metrics in memory
    await this.memoryService.addMemory('evolution',
      JSON.stringify(metrics),
      {
        type: 'METADATA' as any,
        source: 'evolution_metrics',
        sessionId,
        custom: {
          type: 'metrics',
          timestamp: Date.now()
        }
      }
    );
    
    // Track performance for each dimension
    for (const [dimension, metric] of Object.entries(metrics)) {
      await this.trackPerformance(dimension, metric.value, sessionId);
    }
    
    return metrics;
  }

  /**
   * Get the latest metrics for a session
   */
  private async getLatestSessionMetrics(sessionId: string): Promise<EvolutionMetrics | null> {
    const results = await this.memoryService.searchMemories('evolution', {
      sessionId,
      filter: { 'metadata.custom.type': 'metrics' },
      sortBy: 'createdAt',
      sortDirection: 'desc',
      maxResults: 1
    });
    
    if (results.entries.length === 0) {
      return null;
    }
    
    try {
      return JSON.parse(results.entries[0].content) as EvolutionMetrics;
    } catch (error) {
      console.error('Failed to parse metrics:', error);
      return null;
    }
  }

  /**
   * Calculate metrics based on interactions
   */
  private calculateMetrics(
    interactions: Array<any>,
    previousMetrics: EvolutionMetrics | null
  ): EvolutionMetrics {
    // Start with default metrics or previous metrics
    const metrics = previousMetrics ? {...previousMetrics} : createDefaultMetrics();
    
    // In a real implementation, this would analyze the interactions
    // and calculate metrics based on complex algorithms. This is a simplified version.
    
    if (interactions.length === 0) {
      return metrics;
    }
    
    // Simple random variation for demo purposes
    // In a real implementation, this would be based on actual analysis
    for (const dimensionName of Object.keys(metrics)) {
      const dimension = metrics[dimensionName];
      
      // Store previous value
      dimension.previousValue = dimension.value;
      
      // Calculate new value (simulated)
      const randomChange = (Math.random() * 0.1) - 0.05; // -0.05 to +0.05
      dimension.value = Math.min(1.0, Math.max(0.0, dimension.value + randomChange));
      
      // Calculate trend
      if (dimension.previousValue !== undefined) {
        const diff = dimension.value - dimension.previousValue;
        if (diff > 0.01) {
          dimension.trend = 'improving';
          dimension.trendStrength = diff * 10; // Scale for visibility
        } else if (diff < -0.01) {
          dimension.trend = 'declining';
          dimension.trendStrength = Math.abs(diff) * 10; // Scale for visibility
        } else {
          dimension.trend = 'stable';
          dimension.trendStrength = 0;
        }
      }
    }
    
    return metrics;
  }

  /**
   * Generate a report for a session
   */
  async generateReport(sessionId: string): Promise<EvolutionReport> {
    // Evaluate metrics first
    const metrics = await this.evaluateSessionMetrics(sessionId);
    
    // Get previous report for comparison
    const previousReport = await this.getLatestReport(sessionId);
    
    // Calculate overall score (weighted average)
    const weights = {
      promptQuality: 0.15,
      codeQuality: 0.2,
      creativity: 0.15,
      efficiency: 0.15,
      consistency: 0.15,
      adaptability: 0.1,
      learning: 0.1
    };
    
    let overallScore = 0;
    let totalWeight = 0;
    
    for (const [dimension, metric] of Object.entries(metrics)) {
      const weight = weights[dimension] || 0.1;
      overallScore += metric.value * weight;
      totalWeight += weight;
    }
    
    overallScore = totalWeight > 0 ? overallScore / totalWeight : 0;
    
    // Generate improvement suggestions
    const suggestions = await this.generateImprovementSuggestions(metrics);
    
    // Create strengths list based on top metrics
    const strengths = Object.entries(metrics)
      .filter(([_, metric]) => metric.value >= 0.7)
      .map(([dimension, _]) => dimension);
    
    // Create report
    const report: EvolutionReport = {
      id: generateId('report'),
      sessionId,
      timestamp: Date.now(),
      metrics,
      overallScore,
      previousScore: previousReport?.overallScore,
      improvements: suggestions,
      strengths,
      summary: this.generateReportSummary(metrics, overallScore, previousReport?.overallScore)
    };
    
    // Save report to memory
    await this.memoryService.addMemory('evolution',
      JSON.stringify(report),
      {
        type: 'METADATA' as any,
        source: 'evolution_report',
        sessionId,
        custom: {
          type: 'report',
          reportId: report.id,
          timestamp: report.timestamp
        }
      }
    );
    
    // Add to local cache
    if (!this.reports.has(sessionId)) {
      this.reports.set(sessionId, []);
    }
    this.reports.get(sessionId)!.push(report);
    
    return report;
  }

  /**
   * Generate a summary for a report
   */
  private generateReportSummary(
    metrics: EvolutionMetrics,
    overallScore: number,
    previousScore?: number
  ): string {
    let summary = `Evolution Report Summary\n\n`;
    summary += `Overall Score: ${(overallScore * 100).toFixed(1)}%`;
    
    if (previousScore !== undefined) {
      const diff = overallScore - previousScore;
      const trend = diff > 0.01 ? 'improving' : diff < -0.01 ? 'declining' : 'stable';
      summary += ` (${trend}, ${(Math.abs(diff) * 100).toFixed(1)}% ${diff >= 0 ? 'increase' : 'decrease'})`;
    }
    
    summary += `\n\nTop performing areas:\n`;
    
    // Add top metrics
    const topMetrics = Object.entries(metrics)
      .sort(([_, a], [__, b]) => b.value - a.value)
      .slice(0, 3);
    
    for (const [dimension, metric] of topMetrics) {
      summary += `- ${dimension}: ${(metric.value * 100).toFixed(1)}%`;
      if (metric.trend) {
        summary += ` (${metric.trend})`;
      }
      summary += `\n`;
    }
    
    summary += `\nAreas for improvement:\n`;
    
    // Add bottom metrics
    const bottomMetrics = Object.entries(metrics)
      .sort(([_, a], [__, b]) => a.value - b.value)
      .slice(0, 3);
    
    for (const [dimension, metric] of bottomMetrics) {
      summary += `- ${dimension}: ${(metric.value * 100).toFixed(1)}%`;
      if (metric.trend) {
        summary += ` (${metric.trend})`;
      }
      summary += `\n`;
    }
    
    return summary;
  }

  /**
   * Get the latest report for a session
   */
  async getLatestReport(sessionId: string): Promise<EvolutionReport | null> {
    const cachedReports = this.reports.get(sessionId);
    if (cachedReports && cachedReports.length > 0) {
      return cachedReports[cachedReports.length - 1];
    }
    
    // Check memory service
    const results = await this.memoryService.searchMemories('evolution', {
      sessionId,
      filter: { 'metadata.custom.type': 'report' },
      sortBy: 'createdAt',
      sortDirection: 'desc',
      maxResults: 1
    });
    
    if (results.entries.length === 0) {
      return null;
    }
    
    try {
      const report = JSON.parse(results.entries[0].content) as EvolutionReport;
      
      // Cache the report
      if (!this.reports.has(sessionId)) {
        this.reports.set(sessionId, []);
      }
      this.reports.get(sessionId)!.push(report);
      
      return report;
    } catch (error) {
      console.error('Failed to parse report:', error);
      return null;
    }
  }

  /**
   * Get all reports for a session
   */
  async getAllReports(sessionId: string): Promise<EvolutionReport[]> {
    const results = await this.memoryService.searchMemories('evolution', {
      sessionId,
      filter: { 'metadata.custom.type': 'report' },
      sortBy: 'createdAt',
      sortDirection: 'asc'
    });
    
    const reports: EvolutionReport[] = [];
    
    for (const entry of results.entries) {
      try {
        const report = JSON.parse(entry.content) as EvolutionReport;
        reports.push(report);
      } catch (error) {
        console.error('Failed to parse report:', error);
      }
    }
    
    // Update cache
    this.reports.set(sessionId, reports);
    
    return reports;
  }

  /**
   * Generate improvement suggestions based on metrics
   */
  async generateImprovementSuggestions(metrics: EvolutionMetrics): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];
    
    // Find dimensions that need improvement (below 0.7)
    const improvementNeeded = Object.entries(metrics)
      .filter(([_, metric]) => metric.value < 0.7)
      .sort(([_, a], [__, b]) => a.value - b.value); // Sort by ascending value
    
    // Generate suggestions for top 3 areas needing improvement
    for (const [dimension, metric] of improvementNeeded.slice(0, 3)) {
      // Priority is inverse of metric value, normalized to 1-10
      const priority = Math.round(10 - metric.value * 10);
      
      const suggestion: ImprovementSuggestion = {
        dimension,
        suggestions: this.getSuggestionsForDimension(dimension, metric),
        priority,
        reasoning: `${dimension} is currently at ${(metric.value * 100).toFixed(1)}%, ${
          metric.trend ? `and is ${metric.trend}` : `which is below target`
        }. Improving this area will enhance overall performance.`,
        impact: 0.1 * priority / 10 // Estimated impact proportional to priority
      };
      
      suggestions.push(suggestion);
    }
    
    return suggestions;
  }

  /**
   * Get suggestions for a specific dimension
   */
  private getSuggestionsForDimension(dimension: string, metric: EvolutionMetric): string[] {
    // These would typically be AI-generated based on actual analysis
    // Here we use hardcoded suggestions for demonstration
    
    const suggestions: Record<string, string[]> = {
      promptQuality: [
        'Improve prompt clarity by using more specific language',
        'Add more context to prompts',
        'Structure prompts with clear sections and examples'
      ],
      codeQuality: [
        'Increase test coverage',
        'Refactor complex methods into smaller functions',
        'Implement more consistent error handling'
      ],
      creativity: [
        'Generate multiple solution approaches',
        'Incorporate ideas from different domains',
        'Use more varied coding patterns'
      ],
      efficiency: [
        'Optimize performance bottlenecks',
        'Reduce unnecessary computation',
        'Implement caching strategies'
      ],
      consistency: [
        'Standardize coding style',
        'Use consistent naming conventions',
        'Apply uniform error handling patterns'
      ],
      adaptability: [
        'Improve handling of edge cases',
        'Make components more modular',
        'Enhance context sensitivity'
      ],
      learning: [
        'Incorporate feedback from previous interactions',
        'Improve retention of user preferences',
        'Build on previously successful approaches'
      ]
    };
    
    return suggestions[dimension] || ['Improve overall performance in this area'];
  }

  /**
   * Apply an improvement
   */
  async applyImprovement(improvement: ImprovementSuggestion): Promise<boolean> {
    // In a real implementation, this would trigger automated improvements
    // or learning processes based on the suggestion
    
    // For now, just log the application
    console.log(`Applying improvement for ${improvement.dimension}:`, improvement.suggestions);
    
    // Store the application in memory
    await this.memoryService.addMemory('evolution',
      JSON.stringify({
        dimension: improvement.dimension,
        suggestions: improvement.suggestions,
        appliedAt: Date.now()
      }),
      {
        type: 'METADATA' as any,
        source: 'evolution_improvement',
        sessionId: 'system',
        custom: {
          type: 'improvement_application',
          dimension: improvement.dimension,
          timestamp: Date.now()
        }
      }
    );
    
    return true;
  }

  /**
   * Track performance for a dimension
   */
  async trackPerformance(dimension: string, value: number, sessionId: string): Promise<void> {
    const timestamp = Date.now();
    
    // Store in local cache
    const key = `${sessionId}_${dimension}`;
    if (!this.performanceHistory.has(key)) {
      this.performanceHistory.set(key, []);
    }
    
    const history = this.performanceHistory.get(key)!;
    history.push({ timestamp, value });
    
    // Trim history if needed
    if (this.trackingConfig.historyLimit && history.length > this.trackingConfig.historyLimit) {
      history.splice(0, history.length - this.trackingConfig.historyLimit);
    }
    
    // Store in memory if tracking is enabled
    if (this.trackingConfig.saveHistory) {
      await this.memoryService.addMemory('evolution',
        JSON.stringify({ dimension, value, timestamp }),
        {
          type: 'METADATA' as any,
          source: 'evolution_performance',
          sessionId,
          custom: {
            type: 'performance',
            dimension,
            timestamp
          }
        }
      );
    }
  }

  /**
   * Get performance history for a dimension
   */
  async getPerformanceHistory(
    dimension: string,
    sessionId?: string
  ): Promise<{timestamp: number, value: number}[]> {
    if (sessionId) {
      // Get history for specific session
      const key = `${sessionId}_${dimension}`;
      
      if (this.performanceHistory.has(key)) {
        return [...this.performanceHistory.get(key)!];
      }
      
      // Try to load from memory
      const results = await this.memoryService.searchMemories('evolution', {
        sessionId,
        filter: { 
          'metadata.custom.type': 'performance',
          'metadata.custom.dimension': dimension
        },
        sortBy: 'createdAt',
        sortDirection: 'asc'
      });
      
      const history: {timestamp: number, value: number}[] = [];
      
      for (const entry of results.entries) {
        try {
          const data = JSON.parse(entry.content);
          if (data.dimension === dimension && typeof data.value === 'number') {
            history.push({
              timestamp: data.timestamp,
              value: data.value
            });
          }
        } catch (error) {
          console.error('Failed to parse performance data:', error);
        }
      }
      
      // Cache the results
      this.performanceHistory.set(key, history);
      
      return history;
    } else {
      // Get aggregated history across all sessions
      // This is more complex and would involve aggregating data points
      
      // For now, just return an empty array
      return [];
    }
  }

  /**
   * Export evolution data
   */
  async exportEvolutionData(sessionId?: string): Promise<string> {
    const filter: any = { 'metadata.source': 'evolution' };
    
    if (sessionId) {
      filter['metadata.sessionId'] = sessionId;
    }
    
    const results = await this.memoryService.searchMemories('evolution', {
      filter
    });
    
    const exportData = {
      profiles: Array.from(this.profiles.values()),
      trackingConfig: this.trackingConfig,
      rawEntries: results.entries
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import evolution data
   */
  async importEvolutionData(data: string): Promise<number> {
    try {
      const importData = JSON.parse(data);
      let importCount = 0;
      
      // Import profiles
      if (Array.isArray(importData.profiles)) {
        for (const profile of importData.profiles) {
          this.profiles.set(profile.id, profile);
          importCount++;
        }
      }
      
      // Import tracking config
      if (importData.trackingConfig) {
        this.trackingConfig = {
          ...this.trackingConfig,
          ...importData.trackingConfig
        };
      }
      
      // Import raw entries if we need to restore all memory entries
      // This would be a more complex operation in practice
      
      return importCount;
    } catch (error) {
      console.error('Failed to import evolution data:', error);
      return 0;
    }
  }
}

// Factory function
export function createEvolutionService(): EvolutionEngine {
  return new EvolutionService();
}