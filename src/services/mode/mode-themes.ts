/**
 * Mode Themes Service
 * Manages UI themes for different modes
 */

import { Logger } from '../logging/logger';
import { errorHandler } from '../error/error-handler';
import { modeService } from './mode-service';

/**
 * Theme colors interface
 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
}

/**
 * Mode theme interface
 */
export interface ModeTheme {
  modeId: string;
  colors: ThemeColors;
  fontFamily?: string;
  borderRadius?: string;
  accentGradient?: string;
}

/**
 * Mode themes service
 */
export class ModeThemesService {
  private static instance: ModeThemesService;
  private logger: Logger;
  private themes: Record<string, ModeTheme>;
  private activeTheme: string | null = null;
  private defaultTheme: ThemeColors;
  
  private constructor() {
    this.logger = new Logger('ModeThemesService');
    
    // Define default theme
    this.defaultTheme = {
      primary: 'hsl(222.2, 47.4%, 11.2%)',
      secondary: 'hsl(217.2, 32.6%, 17.5%)',
      accent: 'hsl(210, 100%, 50%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(222.2, 84%, 4.9%)',
      muted: 'hsl(210, 40%, 96.1%)',
      border: 'hsl(214.3, 31.8%, 91.4%)'
    };
    
    // Initialize themes
    this.themes = this.initializeThemes();
    
    // Subscribe to mode changes
    modeService.onModeChange(this.handleModeChange.bind(this));
    
    // Apply theme for current mode
    const activeModeId = modeService.getActiveModeId();
    this.applyTheme(activeModeId);
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ModeThemesService {
    if (!ModeThemesService.instance) {
      ModeThemesService.instance = new ModeThemesService();
    }
    return ModeThemesService.instance;
  }
  
  /**
   * Initialize predefined themes
   */
  private initializeThemes(): Record<string, ModeTheme> {
    return {
      'code': {
        modeId: 'code',
        colors: {
          primary: 'hsl(222.2, 47.4%, 11.2%)',
          secondary: 'hsl(217.2, 32.6%, 17.5%)',
          accent: 'hsl(210, 100%, 50%)',
          background: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(222.2, 84%, 4.9%)',
          muted: 'hsl(210, 40%, 96.1%)',
          border: 'hsl(214.3, 31.8%, 91.4%)'
        },
        accentGradient: 'linear-gradient(135deg, hsl(210, 100%, 50%), hsl(240, 100%, 70%))'
      },
      'architect': {
        modeId: 'architect',
        colors: {
          primary: 'hsl(220, 40%, 15%)',
          secondary: 'hsl(215, 30%, 22%)',
          accent: 'hsl(180, 70%, 40%)',
          background: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(220, 40%, 15%)',
          muted: 'hsl(180, 20%, 96%)',
          border: 'hsl(180, 15%, 85%)'
        },
        accentGradient: 'linear-gradient(135deg, hsl(180, 70%, 40%), hsl(200, 70%, 50%))'
      },
      'ask': {
        modeId: 'ask',
        colors: {
          primary: 'hsl(270, 40%, 20%)',
          secondary: 'hsl(265, 30%, 30%)',
          accent: 'hsl(280, 80%, 60%)',
          background: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(270, 40%, 20%)',
          muted: 'hsl(280, 20%, 96%)',
          border: 'hsl(280, 15%, 90%)'
        },
        accentGradient: 'linear-gradient(135deg, hsl(280, 80%, 60%), hsl(320, 80%, 70%))'
      },
      'devops': {
        modeId: 'devops',
        colors: {
          primary: 'hsl(200, 40%, 20%)',
          secondary: 'hsl(195, 30%, 30%)',
          accent: 'hsl(190, 80%, 40%)',
          background: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(200, 40%, 20%)',
          muted: 'hsl(190, 20%, 96%)',
          border: 'hsl(190, 15%, 90%)'
        },
        accentGradient: 'linear-gradient(135deg, hsl(190, 80%, 40%), hsl(220, 80%, 50%))'
      },
      'debug': {
        modeId: 'debug',
        colors: {
          primary: 'hsl(0, 40%, 20%)',
          secondary: 'hsl(5, 30%, 30%)',
          accent: 'hsl(10, 80%, 50%)',
          background: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(0, 40%, 20%)',
          muted: 'hsl(10, 20%, 96%)',
          border: 'hsl(10, 15%, 90%)'
        },
        accentGradient: 'linear-gradient(135deg, hsl(10, 80%, 50%), hsl(40, 80%, 60%))'
      },
      'test': {
        modeId: 'test',
        colors: {
          primary: 'hsl(140, 40%, 15%)',
          secondary: 'hsl(135, 30%, 25%)',
          accent: 'hsl(130, 70%, 40%)',
          background: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(140, 40%, 15%)',
          muted: 'hsl(130, 20%, 96%)',
          border: 'hsl(130, 15%, 90%)'
        },
        accentGradient: 'linear-gradient(135deg, hsl(130, 70%, 40%), hsl(160, 70%, 50%))'
      }
    };
  }
  
  /**
   * Handle mode change event
   */
  private handleModeChange(event: any): void {
    const { currentMode } = event;
    this.applyTheme(currentMode);
  }
  
  /**
   * Apply theme for a mode
   */
  private applyTheme(modeId: string): void {
    try {
      // Get theme for the mode
      const theme = this.getThemeForMode(modeId);
      
      if (!theme) {
        this.logger.warn(`No theme found for mode ${modeId}, using default theme`);
        return;
      }
      
      // Apply CSS variables
      this.applyCssVariables(theme);
      
      // Update active theme
      this.activeTheme = modeId;
      
      this.logger.info(`Applied theme for mode ${modeId}`);
    } catch (error) {
      this.logger.error('Failed to apply theme', { error, modeId });
      errorHandler.handleError(error as Error, { context: 'mode-themes-apply' });
    }
  }
  
  /**
   * Apply CSS variables for a theme
   */
  private applyCssVariables(theme: ModeTheme): void {
    const root = document.documentElement;
    
    // Apply color variables
    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--primary-foreground', 'hsl(0, 0%, 98%)');
    
    root.style.setProperty('--secondary', theme.colors.secondary);
    root.style.setProperty('--secondary-foreground', 'hsl(0, 0%, 98%)');
    
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--accent-foreground', 'hsl(0, 0%, 98%)');
    
    root.style.setProperty('--background', theme.colors.background);
    root.style.setProperty('--foreground', theme.colors.foreground);
    
    root.style.setProperty('--muted', theme.colors.muted);
    root.style.setProperty('--muted-foreground', 'hsl(215.4, 16.3%, 46.9%)');
    
    root.style.setProperty('--border', theme.colors.border);
    
    // Apply other theme properties
    if (theme.fontFamily) {
      root.style.setProperty('--font-sans', theme.fontFamily);
    }
    
    if (theme.borderRadius) {
      root.style.setProperty('--radius', theme.borderRadius);
    }
    
    if (theme.accentGradient) {
      root.style.setProperty('--accent-gradient', theme.accentGradient);
    }
    
    // Add a data attribute to the body for CSS selectors
    document.body.setAttribute('data-mode', theme.modeId);
  }
  
  /**
   * Get theme for a mode
   */
  public getThemeForMode(modeId: string): ModeTheme | null {
    // Check if we have a predefined theme
    if (this.themes[modeId]) {
      return this.themes[modeId];
    }
    
    // Check if the mode has custom theme settings
    const mode = modeService.getMode(modeId);
    if (mode?.customSettings?.theme) {
      return {
        modeId,
        colors: { ...this.defaultTheme, ...mode.customSettings.theme.colors },
        ...mode.customSettings.theme
      };
    }
    
    // Return default theme for custom modes
    return {
      modeId,
      colors: { ...this.defaultTheme }
    };
  }
  
  /**
   * Register a custom theme for a mode
   */
  public registerTheme(modeId: string, theme: Partial<ModeTheme>): void {
    try {
      // Get existing theme or create a new one
      const existingTheme = this.themes[modeId] || {
        modeId,
        colors: { ...this.defaultTheme }
      };
      
      // Merge with new theme
      const newTheme: ModeTheme = {
        ...existingTheme,
        ...theme,
        modeId,
        colors: {
          ...existingTheme.colors,
          ...(theme.colors || {})
        }
      };
      
      // Save the theme
      this.themes[modeId] = newTheme;
      
      // Apply the theme if it's the active mode
      if (modeService.getActiveModeId() === modeId) {
        this.applyTheme(modeId);
      }
      
      this.logger.info(`Registered theme for mode ${modeId}`);
    } catch (error) {
      this.logger.error('Failed to register theme', { error, modeId });
      errorHandler.handleError(error as Error, { context: 'mode-themes-register' });
    }
  }
  
  /**
   * Reset to default theme
   */
  public resetToDefaultTheme(): void {
    try {
      const root = document.documentElement;
      
      // Reset all CSS variables
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--secondary-foreground');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-foreground');
      root.style.removeProperty('--background');
      root.style.removeProperty('--foreground');
      root.style.removeProperty('--muted');
      root.style.removeProperty('--muted-foreground');
      root.style.removeProperty('--border');
      root.style.removeProperty('--font-sans');
      root.style.removeProperty('--radius');
      root.style.removeProperty('--accent-gradient');
      
      // Remove mode attribute
      document.body.removeAttribute('data-mode');
      
      this.activeTheme = null;
      
      this.logger.info('Reset to default theme');
    } catch (error) {
      this.logger.error('Failed to reset theme', { error });
      errorHandler.handleError(error as Error, { context: 'mode-themes-reset' });
    }
  }
}

// Export singleton instance
export const modeThemesService = ModeThemesService.getInstance();
