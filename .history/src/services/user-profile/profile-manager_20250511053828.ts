/**
 * User Profile Manager
 * Handles user preferences, coding styles, and saved projects
 */

// Coding style preferences
export interface CodingStylePreferences {
  indentation: 'spaces' | 'tabs';
  indentSize: number;
  lineWidth: number;
  usesSemicolons: boolean;
  quoteStyle: 'single' | 'double';
  bracketStyle: 'same-line' | 'new-line';
  cssFramework: 'none' | 'tailwind' | 'bootstrap' | 'bulma' | 'material' | 'custom';
  jsFramework: 'none' | 'react' | 'vue' | 'angular' | 'svelte' | 'custom';
  preferredLanguages: string[];
}

// Provider preferences for different tasks
export interface ProviderPreferences {
  planning: string;
  codeGeneration: string;
  refactoring: string;
  optimization: string;
  explanation: string;
}

// Plugin loadout configuration
export interface PluginLoadout {
  id: string;
  name: string;
  description: string;
  plugins: string[]; // Array of plugin IDs
  isDefault: boolean;
}

// Project reference information
export interface SavedProject {
  id: string;
  name: string;
  description: string;
  savedDate: number;
  lastModified: number;
  sessionId: string;
  goalId?: string;
  tags: string[];
  thumbnail?: string;
  codeStats: {
    languages: Record<string, number>; // Language to line count
    totalFiles: number;
    totalLines: number;
  };
}

// User profile containing all user-specific settings
export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  createdAt: number;
  updatedAt: number;
  codingStyle: CodingStylePreferences;
  providerPreferences: ProviderPreferences;
  pluginLoadouts: PluginLoadout[];
  activePluginLoadout: string; // ID of active loadout
  savedProjects: SavedProject[];
  recentPrompts: string[];
  favorites: {
    prompts: string[];
    plugins: string[];
    projects: string[];
  };
  theme: 'light' | 'dark' | 'system' | 'cyberpunk' | 'minimal' | 'retro';
  customSettings: Record<string, any>;
}

/**
 * ProfileManager handles user profile settings and preferences
 */
export class ProfileManager {
  private profiles: Map<string, UserProfile> = new Map();
  private activeProfileId: string | null = null;
  
  constructor() {
    this.loadProfiles();
    this.initializeDefaultProfile();
  }
  
  /**
   * Get the active user profile
   */
  getActiveProfile(): UserProfile | null {
    if (!this.activeProfileId) {
      return null;
    }
    
    return this.profiles.get(this.activeProfileId) || null;
  }
  
  /**
   * Create a new user profile
   */
  createProfile(
    name: string,
    options: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>> = {}
  ): UserProfile {
    const id = this.generateId('profile');
    const now = Date.now();
    
    const defaultCodingStyle: CodingStylePreferences = {
      indentation: 'spaces',
      indentSize: 2,
      lineWidth: 80,
      usesSemicolons: true,
      quoteStyle: 'single',
      bracketStyle: 'same-line',
      cssFramework: 'tailwind',
      jsFramework: 'react',
      preferredLanguages: ['typescript', 'javascript', 'html', 'css']
    };
    
    const defaultProviderPreferences: ProviderPreferences = {
      planning: 'claude',
      codeGeneration: 'openai',
      refactoring: 'claude',
      optimization: 'openai',
      explanation: 'claude'
    };
    
    const defaultPluginLoadout: PluginLoadout = {
      id: this.generateId('loadout'),
      name: 'Default Loadout',
      description: 'Standard set of tools for general development',
      plugins: [
        'built-in-css-optimizer',
        'built-in-lighthouse-audit',
        'built-in-react-converter'
      ],
      isDefault: true
    };
    
    const profile: UserProfile = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      codingStyle: options.codingStyle || defaultCodingStyle,
      providerPreferences: options.providerPreferences || defaultProviderPreferences,
      pluginLoadouts: options.pluginLoadouts || [defaultPluginLoadout],
      activePluginLoadout: options.activePluginLoadout || defaultPluginLoadout.id,
      savedProjects: options.savedProjects || [],
      recentPrompts: options.recentPrompts || [],
      favorites: options.favorites || {
        prompts: [],
        plugins: [],
        projects: []
      },
      theme: options.theme || 'system',
      customSettings: options.customSettings || {}
    };
    
    this.profiles.set(id, profile);
    
    // If there's no active profile, set this as active
    if (!this.activeProfileId) {
      this.activeProfileId = id;
    }
    
    this.saveProfiles();
    return profile;
  }
  
  /**
   * Update a user profile
   */
  updateProfile(
    profileId: string,
    updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>
  ): UserProfile | null {
    const profile = this.profiles.get(profileId);
