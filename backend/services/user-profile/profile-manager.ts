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
    this.saveProfiles();
    
    return updatedProject;
  }
  
  /**
   * Delete a saved project
   */
  deleteSavedProject(profileId: string, projectId: string): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return false;
    }
    
    const projectIndex = profile.savedProjects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return false;
    }
    
    profile.savedProjects.splice(projectIndex, 1);
    profile.updatedAt = Date.now();
    
    // Remove from favorites if present
    const favIndex = profile.favorites.projects.indexOf(projectId);
    if (favIndex !== -1) {
      profile.favorites.projects.splice(favIndex, 1);
    }
    
    this.profiles.set(profileId, profile);
    this.saveProfiles();
    
    return true;
  }
  
  /**
   * Add a prompt to recent prompts
   */
  addRecentPrompt(profileId: string, prompt: string): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return false;
    }
    
    // Add to the start of the array
    profile.recentPrompts.unshift(prompt);
    
    // Limit to 20 recent prompts
    if (profile.recentPrompts.length > 20) {
      profile.recentPrompts = profile.recentPrompts.slice(0, 20);
    }
    
    profile.updatedAt = Date.now();
    
    this.profiles.set(profileId, profile);
    this.saveProfiles();
    
    return true;
  }
  
  /**
   * Toggle a favorite item
   */
  toggleFavorite(
    profileId: string,
    type: 'prompts' | 'plugins' | 'projects',
    itemId: string
  ): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return false;
    }
    
    const favorites = profile.favorites[type];
    const index = favorites.indexOf(itemId);
    
    if (index === -1) {
      // Add to favorites
      favorites.push(itemId);
    } else {
      // Remove from favorites
      favorites.splice(index, 1);
    }
    
    profile.updatedAt = Date.now();
    
    this.profiles.set(profileId, profile);
    this.saveProfiles();
    
    return true;
  }
  
  /**
   * Convert coding style preferences to editor config string
   */
  getCodingStyleAsEditorConfig(profileId: string): string {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return '';
    }
    
    const { codingStyle } = profile;
    
    return `# EditorConfig is awesome: https://EditorConfig.org

# Generated by Cyber Prompt Builder from user preferences
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = ${codingStyle.indentation}
indent_size = ${codingStyle.indentSize}
max_line_length = ${codingStyle.lineWidth}

[*.{js,jsx,ts,tsx}]
quote_type = ${codingStyle.quoteStyle}
curly_bracket_next_line = ${codingStyle.bracketStyle === 'new-line'}
spaces_around_operators = true
spaces_around_brackets = false
${codingStyle.usesSemicolons ? '' : '# '}insert_semicolon = true
`;
  }
  
  /**
   * Convert coding style preferences to Prettier config
   */
  getCodingStyleAsPrettierConfig(profileId: string): string {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return '';
    }
    
    const { codingStyle } = profile;
    
    return JSON.stringify({
      tabWidth: codingStyle.indentSize,
      useTabs: codingStyle.indentation === 'tabs',
      printWidth: codingStyle.lineWidth,
      semi: codingStyle.usesSemicolons,
      singleQuote: codingStyle.quoteStyle === 'single',
      bracketSpacing: true,
      bracketSameLine: codingStyle.bracketStyle === 'same-line',
      trailingComma: 'es5',
      arrowParens: 'avoid'
    }, null, 2);
  }
  
  /**
   * Export a profile to a shareable format
   */
  exportProfile(profileId: string): string {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return '';
    }
    
    // Create a shareable version (excluding sensitive or personal data)
    const shareableProfile = {
      name: profile.name,
      codingStyle: profile.codingStyle,
      pluginLoadouts: profile.pluginLoadouts,
      theme: profile.theme,
      providerPreferences: profile.providerPreferences,
      exportedAt: Date.now()
    };
    
    return JSON.stringify(shareableProfile, null, 2);
  }
  
  /**
   * Import a profile from a shareable format
   */
  importProfile(profileData: string): UserProfile | null {
    try {
      const importedData = JSON.parse(profileData);
      
      // Validate the import data (basic checks)
      if (!importedData.name || !importedData.codingStyle) {
        throw new Error('Invalid profile data');
      }
      
      // Create a new profile with the imported data
      return this.createProfile(
        `${importedData.name} (Imported)`,
        {
          codingStyle: importedData.codingStyle,
          pluginLoadouts: importedData.pluginLoadouts,
          theme: importedData.theme,
          providerPreferences: importedData.providerPreferences
        }
      );
    } catch (error) {
      console.error('Error importing profile:', error);
      return null;
    }
  }
  
  /**
   * Generate a unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Save profiles to localStorage
   */
  private saveProfiles(): void {
    try {
      // Store profiles
      const serializedProfiles = JSON.stringify(Array.from(this.profiles.entries()));
      localStorage.setItem('cyber_prompt_profiles', serializedProfiles);
      
      // Store active profile ID
      localStorage.setItem('cyber_prompt_active_profile', this.activeProfileId || '');
    } catch (error) {
      console.error('Error saving profiles:', error);
    }
  }
  
  /**
   * Load profiles from localStorage
   */
  private loadProfiles(): void {
    try {
      // Load profiles
      const serializedProfiles = localStorage.getItem('cyber_prompt_profiles');
      if (serializedProfiles) {
        const profileEntries = JSON.parse(serializedProfiles);
        this.profiles = new Map(profileEntries);
      }
      
      // Load active profile ID
      const activeProfileId = localStorage.getItem('cyber_prompt_active_profile');
      if (activeProfileId && this.profiles.has(activeProfileId)) {
        this.activeProfileId = activeProfileId;
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  }
  
  /**
   * Initialize the default profile if none exists
   */
  private initializeDefaultProfile(): void {
    if (this.profiles.size === 0) {
      this.createProfile('Default Profile');
    }
  }
}

// Export singleton instance
export const profileManager = new ProfileManager();