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
    if (!profile) {
      return null;
    }
    
    const updatedProfile = {
      ...profile,
      ...updates,
      updatedAt: Date.now()
    };
    
    this.profiles.set(profileId, updatedProfile);
    this.saveProfiles();
    
    return updatedProfile;
  }
  
  /**
   * Set the active profile
   */
  setActiveProfile(profileId: string): boolean {
    if (!this.profiles.has(profileId)) {
      return false;
    }
    
    this.activeProfileId = profileId;
    this.saveProfiles();
    return true;
  }
  
  /**
   * Get a profile by ID
   */
  getProfile(profileId: string): UserProfile | null {
    return this.profiles.get(profileId) || null;
  }
  
  /**
   * Get all profiles
   */
  getAllProfiles(): UserProfile[] {
    return Array.from(this.profiles.values());
  }
  
  /**
   * Delete a profile
   */
  deleteProfile(profileId: string): boolean {
    if (!this.profiles.has(profileId)) {
      return false;
    }
    
    this.profiles.delete(profileId);
    
    // If we deleted the active profile, set another one as active
    if (this.activeProfileId === profileId) {
      const firstProfile = this.profiles.values().next().value;
      this.activeProfileId = firstProfile ? firstProfile.id : null;
    }
    
    this.saveProfiles();
    return true;
  }
  
  /**
   * Add a plugin loadout to a profile
   */
  addPluginLoadout(
    profileId: string,
    loadout: Omit<PluginLoadout, 'id' | 'isDefault'>
  ): PluginLoadout | null {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return null;
    }
    
    const loadoutId = this.generateId('loadout');
    const newLoadout: PluginLoadout = {
      ...loadout,
      id: loadoutId,
      isDefault: false
    };
    
    profile.pluginLoadouts.push(newLoadout);
    profile.updatedAt = Date.now();
    
    this.profiles.set(profileId, profile);
    this.saveProfiles();
    
    return newLoadout;
  }
  
  /**
   * Set the active plugin loadout
   */
  setActivePluginLoadout(profileId: string, loadoutId: string): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return false;
    }
    
    const loadoutExists = profile.pluginLoadouts.some(l => l.id === loadoutId);
    if (!loadoutExists) {
      return false;
    }
    
    profile.activePluginLoadout = loadoutId;
    profile.updatedAt = Date.now();
    
    this.profiles.set(profileId, profile);
    this.saveProfiles();
    
    return true;
  }
  
  /**
   * Save a project to a profile
   */
  saveProject(
    profileId: string,
    project: Omit<SavedProject, 'id' | 'savedDate' | 'lastModified'>
  ): SavedProject | null {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return null;
    }
    
    const projectId = this.generateId('project');
    const now = Date.now();
    
    const savedProject: SavedProject = {
      ...project,
      id: projectId,
      savedDate: now,
      lastModified: now
    };
    
    profile.savedProjects.push(savedProject);
    profile.updatedAt = now;
    
    this.profiles.set(profileId, profile);
    this.saveProfiles();
    
    return savedProject;
  }
  
  /**
   * Update a saved project
   */
  updateSavedProject(
    profileId: string,
    projectId: string,
    updates: Partial<Omit<SavedProject, 'id' | 'savedDate'>>
  ): SavedProject | null {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return null;
    }
    
    const projectIndex = profile.savedProjects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return null;
    }
    
    const project = profile.savedProjects[projectIndex];
    const updatedProject: SavedProject = {
      ...project,
      ...updates,
      lastModified: Date.now()
    };
    
    profile.savedProjects[projectIndex] = updatedProject;
    profile.updatedAt = Date.now();
    
    this.profiles.set(profileId, profile);
