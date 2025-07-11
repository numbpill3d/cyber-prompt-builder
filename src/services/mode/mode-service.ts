/**
 * Mode Service
 * Manages the application's operational modes/personas
 */

import { Mode, ModeSettings, DEFAULT_MODES } from './mode-types';
import { Logger } from '../logging/logger';
import { errorHandler } from '../error/error-handler';
import { settingsService } from '../settings/settings-service';
import { ResponseFormat, ResponseTone } from '../prompt-builder/layers/user-preferences-layer';
// Simple browser-compatible event emitter
class SimpleEventEmitter {
  private listeners: Record<string, Function[]> = {};

  on(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, data?: any): void {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
}

/**
 * Mode change event
 */
export interface ModeChangeEvent {
  previousMode: string;
  currentMode: string;
  mode: Mode;
}

/**
 * Mode Service class
 */
export class ModeService {
  private static instance: ModeService;
  private logger: Logger;
  private eventEmitter: SimpleEventEmitter;
  private _activeMode: string = 'code'; // Default to code mode
  private _modes: Record<string, Mode> = { ...DEFAULT_MODES };
  private _customModes: Record<string, Mode> = {};

  private constructor() {
    this.logger = new Logger('ModeService');
    this.eventEmitter = new SimpleEventEmitter();
    this.initialize();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ModeService {
    if (!ModeService.instance) {
      ModeService.instance = new ModeService();
    }
    return ModeService.instance;
  }

  /**
   * Initialize the mode service
   */
  private initialize(): void {
    try {
      // Load modes from settings if available
      const settings = settingsService.getSettings();
      
      if (settings.mode) {
        this._activeMode = settings.mode.activeMode || 'code';
        
        // Merge default modes with saved modes
        if (settings.mode.modes) {
          this._modes = { ...DEFAULT_MODES, ...settings.mode.modes };
        }
        
        // Load custom modes
        if (settings.mode.customModes) {
          this._customModes = { ...settings.mode.customModes };
        }
      } else {
        // Initialize with defaults if no settings exist
        this.saveToSettings();
      }
      
      this.logger.info(`Mode service initialized with active mode: ${this._activeMode}`);
    } catch (error) {
      this.logger.error('Failed to initialize mode service', { error });
      errorHandler.handleError(error as Error, { context: 'mode-service-init' });
    }
  }

  /**
   * Save current mode settings to the application settings
   */
  private saveToSettings(): void {
    try {
      const settings = settingsService.getSettings();
      
      // Update mode settings
      settings.mode = {
        activeMode: this._activeMode,
        modes: this._modes,
        customModes: this._customModes
      };
      
      // Save updated settings
      settingsService.updateSettings(settings);
      this.logger.debug('Mode settings saved');
    } catch (error) {
      this.logger.error('Failed to save mode settings', { error });
      errorHandler.handleError(error as Error, { context: 'mode-service-save' });
    }
  }

  /**
   * Get the active mode
   */
  public getActiveMode(): Mode {
    return this._modes[this._activeMode] || this._customModes[this._activeMode] || DEFAULT_MODES.code;
  }

  /**
   * Get the active mode ID
   */
  public getActiveModeId(): string {
    return this._activeMode;
  }

  /**
   * Set the active mode
   */
  public setActiveMode(modeId: string): boolean {
    try {
      const previousMode = this._activeMode;
      
      // Check if mode exists
      if (!this._modes[modeId] && !this._customModes[modeId]) {
        throw new Error(`Mode with ID ${modeId} does not exist`);
      }
      
      this._activeMode = modeId;
      this.saveToSettings();
      
      const mode = this.getActiveMode();
      this.logger.info(`Active mode changed to: ${modeId}`);
      
      // Emit mode change event
      this.eventEmitter.emit('modeChange', {
        previousMode,
        currentMode: modeId,
        mode
      });
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to set active mode to ${modeId}`, { error });
      errorHandler.handleError(error as Error, { context: 'mode-service-set-active' });
      return false;
    }
  }

  /**
   * Get all available modes
   */
  public getAllModes(): Mode[] {
    return [
      ...Object.values(this._modes),
      ...Object.values(this._customModes)
    ];
  }

  /**
   * Get a specific mode by ID
   */
  public getMode(modeId: string): Mode | null {
    return this._modes[modeId] || this._customModes[modeId] || null;
  }

  /**
   * Create a custom mode
   */
  public createCustomMode(mode: Omit<Mode, 'id' | 'isCustom'>): string {
    try {
      const id = `custom-${Date.now()}`;
      const newMode: Mode = {
        ...mode,
        id,
        isCustom: true
      };
      
      this._customModes[id] = newMode;
      this.saveToSettings();
      
      this.logger.info(`Custom mode created: ${id}`);
      return id;
    } catch (error) {
      this.logger.error('Failed to create custom mode', { error });
      errorHandler.handleError(error as Error, { context: 'mode-service-create-custom' });
      throw error;
    }
  }

  /**
   * Update a custom mode
   */
  public updateCustomMode(modeId: string, updates: Partial<Mode>): boolean {
    try {
      if (!this._customModes[modeId]) {
        throw new Error(`Custom mode with ID ${modeId} does not exist`);
      }
      
      this._customModes[modeId] = {
        ...this._customModes[modeId],
        ...updates,
        id: modeId, // Ensure ID doesn't change
        isCustom: true // Ensure isCustom flag remains
      };
      
      this.saveToSettings();
      this.logger.info(`Custom mode updated: ${modeId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update custom mode ${modeId}`, { error });
      errorHandler.handleError(error as Error, { context: 'mode-service-update-custom' });
      return false;
    }
  }

  /**
   * Delete a custom mode
   */
  public deleteCustomMode(modeId: string): boolean {
    try {
      if (!this._customModes[modeId]) {
        throw new Error(`Custom mode with ID ${modeId} does not exist`);
      }
      
      // If the active mode is being deleted, switch to code mode
      if (this._activeMode === modeId) {
        this._activeMode = 'code';
      }
      
      delete this._customModes[modeId];
      this.saveToSettings();
      
      this.logger.info(`Custom mode deleted: ${modeId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete custom mode ${modeId}`, { error });
      errorHandler.handleError(error as Error, { context: 'mode-service-delete-custom' });
      return false;
    }
  }

  /**
   * Subscribe to mode change events
   */
  public onModeChange(callback: (event: ModeChangeEvent) => void): void {
    this.eventEmitter.on('modeChange', callback);
  }

  /**
   * Unsubscribe from mode change events
   */
  public offModeChange(callback: (event: ModeChangeEvent) => void): void {
    this.eventEmitter.off('modeChange', callback);
  }
}

// Export singleton instance
export const modeService = ModeService.getInstance();
