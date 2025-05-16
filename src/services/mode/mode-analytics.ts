/**
 * Mode Analytics Service
 * Tracks usage statistics for different modes
 */

import { Logger } from '../logging/logger';
import { errorHandler } from '../error/error-handler';
import { settingsService } from '../settings/settings-service';
import { Mode } from './mode-types';
import { modeService } from './mode-service';

/**
 * Mode usage statistics
 */
export interface ModeUsageStats {
  modeId: string;
  usageCount: number;
  lastUsed: Date;
  averageDuration: number; // in seconds
  taskTypes: Record<string, number>; // task type -> count
}

/**
 * Mode analytics data
 */
export interface ModeAnalyticsData {
  modeUsage: Record<string, ModeUsageStats>;
  totalUsageCount: number;
  mostUsedModeId: string | null;
  lastActiveMode: string | null;
  lastModeSwitch: Date | null;
}

/**
 * Mode analytics service
 */
export class ModeAnalyticsService {
  private static instance: ModeAnalyticsService;
  private logger: Logger;
  private data: ModeAnalyticsData;
  private currentModeStartTime: number | null = null;
  
  private constructor() {
    this.logger = new Logger('ModeAnalyticsService');
    this.data = this.loadAnalyticsData();
    this.initialize();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ModeAnalyticsService {
    if (!ModeAnalyticsService.instance) {
      ModeAnalyticsService.instance = new ModeAnalyticsService();
    }
    return ModeAnalyticsService.instance;
  }
  
  /**
   * Initialize the analytics service
   */
  private initialize(): void {
    try {
      // Subscribe to mode changes
      modeService.onModeChange(this.handleModeChange.bind(this));
      
      // Start tracking current mode
      const activeModeId = modeService.getActiveModeId();
      this.startModeUsage(activeModeId);
      
      this.logger.info('Mode analytics service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize mode analytics service', { error });
      errorHandler.handleError(error as Error, { context: 'mode-analytics-init' });
    }
  }
  
  /**
   * Load analytics data from settings
   */
  private loadAnalyticsData(): ModeAnalyticsData {
    try {
      const settings = settingsService.getSettings();
      
      if (settings.modeAnalytics) {
        // Convert date strings back to Date objects
        const data = settings.modeAnalytics as any;
        
        // Process mode usage stats
        if (data.modeUsage) {
          Object.values(data.modeUsage).forEach((stats: any) => {
            if (stats.lastUsed) {
              stats.lastUsed = new Date(stats.lastUsed);
            }
          });
        }
        
        // Process last mode switch
        if (data.lastModeSwitch) {
          data.lastModeSwitch = new Date(data.lastModeSwitch);
        }
        
        return data as ModeAnalyticsData;
      }
    } catch (error) {
      this.logger.error('Failed to load mode analytics data', { error });
    }
    
    // Return default data if loading fails
    return {
      modeUsage: {},
      totalUsageCount: 0,
      mostUsedModeId: null,
      lastActiveMode: null,
      lastModeSwitch: null
    };
  }
  
  /**
   * Save analytics data to settings
   */
  private saveAnalyticsData(): void {
    try {
      const settings = settingsService.getSettings();
      settings.modeAnalytics = this.data;
      settingsService.updateSettings(settings);
    } catch (error) {
      this.logger.error('Failed to save mode analytics data', { error });
    }
  }
  
  /**
   * Handle mode change event
   */
  private handleModeChange(event: any): void {
    const { previousMode, currentMode } = event;
    
    // End tracking for previous mode
    if (previousMode) {
      this.endModeUsage(previousMode);
    }
    
    // Start tracking for new mode
    this.startModeUsage(currentMode);
    
    // Update last mode switch
    this.data.lastModeSwitch = new Date();
    this.data.lastActiveMode = currentMode;
    
    // Save updated data
    this.saveAnalyticsData();
  }
  
  /**
   * Start tracking mode usage
   */
  private startModeUsage(modeId: string): void {
    this.currentModeStartTime = Date.now();
    
    // Initialize mode stats if not exists
    if (!this.data.modeUsage[modeId]) {
      this.data.modeUsage[modeId] = {
        modeId,
        usageCount: 0,
        lastUsed: new Date(),
        averageDuration: 0,
        taskTypes: {}
      };
    }
    
    // Update last used timestamp
    this.data.modeUsage[modeId].lastUsed = new Date();
  }
  
  /**
   * End tracking mode usage
   */
  private endModeUsage(modeId: string): void {
    if (!this.currentModeStartTime) return;
    
    const duration = (Date.now() - this.currentModeStartTime) / 1000; // in seconds
    this.currentModeStartTime = null;
    
    // Update mode stats
    const stats = this.data.modeUsage[modeId];
    if (stats) {
      // Update usage count
      stats.usageCount++;
      this.data.totalUsageCount++;
      
      // Update average duration
      const totalDuration = stats.averageDuration * (stats.usageCount - 1) + duration;
      stats.averageDuration = totalDuration / stats.usageCount;
      
      // Update most used mode
      if (!this.data.mostUsedModeId || 
          stats.usageCount > (this.data.modeUsage[this.data.mostUsedModeId]?.usageCount || 0)) {
        this.data.mostUsedModeId = modeId;
      }
    }
  }
  
  /**
   * Record task completion with a specific mode
   */
  public recordTaskCompletion(modeId: string, taskType: string): void {
    try {
      const stats = this.data.modeUsage[modeId];
      if (stats) {
        // Increment task type count
        stats.taskTypes[taskType] = (stats.taskTypes[taskType] || 0) + 1;
        this.saveAnalyticsData();
      }
    } catch (error) {
      this.logger.error('Failed to record task completion', { error, modeId, taskType });
    }
  }
  
  /**
   * Get usage statistics for all modes
   */
  public getAllModeStats(): ModeUsageStats[] {
    return Object.values(this.data.modeUsage);
  }
  
  /**
   * Get usage statistics for a specific mode
   */
  public getModeStats(modeId: string): ModeUsageStats | null {
    return this.data.modeUsage[modeId] || null;
  }
  
  /**
   * Get the most used mode
   */
  public getMostUsedMode(): Mode | null {
    if (!this.data.mostUsedModeId) return null;
    return modeService.getMode(this.data.mostUsedModeId);
  }
  
  /**
   * Get the most common task type for a mode
   */
  public getMostCommonTaskType(modeId: string): string | null {
    const stats = this.data.modeUsage[modeId];
    if (!stats || Object.keys(stats.taskTypes).length === 0) return null;
    
    let maxCount = 0;
    let mostCommonType = null;
    
    for (const [type, count] of Object.entries(stats.taskTypes)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonType = type;
      }
    }
    
    return mostCommonType;
  }
  
  /**
   * Get analytics summary
   */
  public getAnalyticsSummary(): {
    totalUsageCount: number;
    mostUsedMode: Mode | null;
    lastActiveMode: Mode | null;
    lastModeSwitch: Date | null;
  } {
    return {
      totalUsageCount: this.data.totalUsageCount,
      mostUsedMode: this.data.mostUsedModeId ? modeService.getMode(this.data.mostUsedModeId) : null,
      lastActiveMode: this.data.lastActiveMode ? modeService.getMode(this.data.lastActiveMode) : null,
      lastModeSwitch: this.data.lastModeSwitch
    };
  }
  
  /**
   * Reset analytics data
   */
  public resetAnalytics(): void {
    this.data = {
      modeUsage: {},
      totalUsageCount: 0,
      mostUsedModeId: null,
      lastActiveMode: null,
      lastModeSwitch: null
    };
    
    this.saveAnalyticsData();
    this.logger.info('Mode analytics data reset');
  }
}

// Export singleton instance
export const modeAnalyticsService = ModeAnalyticsService.getInstance();
