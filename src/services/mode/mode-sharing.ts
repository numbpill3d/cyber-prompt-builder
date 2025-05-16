/**
 * Mode Sharing Service
 * Handles exporting and importing modes
 */

import { Logger } from '../logging/logger';
import { errorHandler } from '../error/error-handler';
import { Mode } from './mode-types';
import { modeService } from './mode-service';

/**
 * Exported mode format
 */
export interface ExportedMode {
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  userPreferences: {
    tone: string;
    format: string;
    includeExplanations: boolean;
    includeExamples: boolean;
    customInstructions?: string;
  };
  customSettings?: Record<string, any>;
  metadata: {
    exportedAt: string;
    version: string;
    source: string;
  };
}

/**
 * Mode sharing service
 */
export class ModeSharingService {
  private static instance: ModeSharingService;
  private logger: Logger;
  
  private constructor() {
    this.logger = new Logger('ModeSharingService');
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ModeSharingService {
    if (!ModeSharingService.instance) {
      ModeSharingService.instance = new ModeSharingService();
    }
    return ModeSharingService.instance;
  }
  
  /**
   * Export a mode to a shareable format
   * @param modeId The ID of the mode to export
   * @returns The exported mode data as a JSON string
   */
  public exportMode(modeId: string): string {
    try {
      const mode = modeService.getMode(modeId);
      if (!mode) {
        throw new Error(`Mode with ID ${modeId} not found`);
      }
      
      const exportedMode: ExportedMode = {
        name: mode.name,
        description: mode.description,
        icon: mode.icon,
        systemPrompt: mode.systemPrompt,
        userPreferences: {
          tone: mode.userPreferences.tone,
          format: mode.userPreferences.format,
          includeExplanations: mode.userPreferences.includeExplanations,
          includeExamples: mode.userPreferences.includeExamples,
          customInstructions: mode.userPreferences.customInstructions
        },
        customSettings: mode.customSettings,
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '1.0',
          source: 'Cyber Prompt Builder'
        }
      };
      
      return JSON.stringify(exportedMode, null, 2);
    } catch (error) {
      this.logger.error('Failed to export mode', { error, modeId });
      errorHandler.handleError(error as Error, { context: 'mode-sharing-export' });
      throw error;
    }
  }
  
  /**
   * Import a mode from a shareable format
   * @param jsonData The exported mode data as a JSON string
   * @returns The ID of the imported mode
   */
  public importMode(jsonData: string): string {
    try {
      // Parse the JSON data
      const importedMode = JSON.parse(jsonData) as ExportedMode;
      
      // Validate the imported data
      this.validateImportedMode(importedMode);
      
      // Create a new mode from the imported data
      const modeData: Omit<Mode, 'id' | 'isCustom'> = {
        name: importedMode.name,
        description: importedMode.description,
        icon: importedMode.icon,
        systemPrompt: importedMode.systemPrompt,
        userPreferences: {
          tone: importedMode.userPreferences.tone as any,
          format: importedMode.userPreferences.format as any,
          includeExplanations: importedMode.userPreferences.includeExplanations,
          includeExamples: importedMode.userPreferences.includeExamples,
          customInstructions: importedMode.userPreferences.customInstructions
        },
        customSettings: importedMode.customSettings
      };
      
      // Create the mode
      const newModeId = modeService.createCustomMode(modeData);
      
      this.logger.info('Mode imported successfully', { modeId: newModeId });
      return newModeId;
    } catch (error) {
      this.logger.error('Failed to import mode', { error });
      errorHandler.handleError(error as Error, { context: 'mode-sharing-import' });
      throw error;
    }
  }
  
  /**
   * Validate an imported mode
   * @param mode The imported mode to validate
   * @throws Error if the mode is invalid
   */
  private validateImportedMode(mode: ExportedMode): void {
    // Check required fields
    if (!mode.name) throw new Error('Mode name is required');
    if (!mode.systemPrompt) throw new Error('System prompt is required');
    if (!mode.userPreferences) throw new Error('User preferences are required');
    
    // Check user preferences
    const { userPreferences } = mode;
    if (typeof userPreferences.tone !== 'string') throw new Error('Invalid tone');
    if (typeof userPreferences.format !== 'string') throw new Error('Invalid format');
    if (typeof userPreferences.includeExplanations !== 'boolean') throw new Error('Invalid includeExplanations');
    if (typeof userPreferences.includeExamples !== 'boolean') throw new Error('Invalid includeExamples');
    
    // Validate metadata if present
    if (mode.metadata) {
      if (!mode.metadata.version) throw new Error('Metadata version is required');
    }
  }
  
  /**
   * Generate a shareable URL for a mode
   * @param modeId The ID of the mode to share
   * @returns A shareable URL
   */
  public generateShareableUrl(modeId: string): string {
    try {
      const exportedData = this.exportMode(modeId);
      const encodedData = encodeURIComponent(exportedData);
      
      // Create a URL with the encoded data
      return `${window.location.origin}/modes/import?data=${encodedData}`;
    } catch (error) {
      this.logger.error('Failed to generate shareable URL', { error, modeId });
      errorHandler.handleError(error as Error, { context: 'mode-sharing-url' });
      throw error;
    }
  }
  
  /**
   * Import a mode from a shareable URL
   * @param url The shareable URL
   * @returns The ID of the imported mode
   */
  public importFromUrl(url: string): string {
    try {
      // Parse the URL
      const urlObj = new URL(url);
      const encodedData = urlObj.searchParams.get('data');
      
      if (!encodedData) {
        throw new Error('No mode data found in URL');
      }
      
      // Decode the data
      const jsonData = decodeURIComponent(encodedData);
      
      // Import the mode
      return this.importMode(jsonData);
    } catch (error) {
      this.logger.error('Failed to import mode from URL', { error, url });
      errorHandler.handleError(error as Error, { context: 'mode-sharing-url-import' });
      throw error;
    }
  }
}

// Export singleton instance
export const modeSharingService = ModeSharingService.getInstance();
